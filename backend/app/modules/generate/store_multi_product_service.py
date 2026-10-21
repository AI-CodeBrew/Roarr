import logging
from typing import Any, Dict, List, Optional, Set

from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from ...clients.langchain_client import llm_4_1_nano
from ..database import document_store
from .context_utils import build_product_context
from .generate_images import generate_multi_product_store_images
from .store_prompts import STORE_SYSTEM_PROMPT_TEMPLATE, STORE_USER_PROMPT_TEMPLATE
from .store.templates.multi_store.signature import (
    HomePageMultiStore,
    ProductPageMultiStore,
)
from .generation_locale import apply_common_cta_defaults, apply_review_placeholders

logger = logging.getLogger(__name__)


def _normalize_image_urls(raw: Any) -> List[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        s = raw.strip()
        return [s] if s else []
    if isinstance(raw, list):
        return [str(u).strip() for u in raw if u is not None and str(u).strip()]
    return []


def _product_handle_from_payload(product: dict) -> str:
    """Handle from frontend product object (Shopify-style)."""
    if not isinstance(product, dict):
        return ""
    for key in ("handle", "productHandle", "product_handle"):
        v = product.get(key)
        if v is not None and str(v).strip():
            return str(v).strip()
    return ""


def _collect_product_image_urls(product: dict) -> List[str]:
    """
    Accept Shopify-style `image` (string) and/or `images` / `productImages` / `product_images`
    (arrays). Merge, dedupe, preserve order.
    """
    merged: List[str] = []
    for key in ("productImages", "product_images", "images", "image"):
        raw = product.get(key)
        if raw is None:
            continue
        merged.extend(_normalize_image_urls(raw))
    seen: set = set()
    out: List[str] = []
    for u in merged:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def generate_home_page_text(
    category: str,
    product_context_str: Optional[str] = None,
    language: Optional[str] = None,
) -> Dict[str, Any]:
    category_key = (category or "").strip().lower()

    llm = llm_4_1_nano
    structured_llm = llm.with_structured_output(HomePageMultiStore)

    system_prompt = SystemMessagePromptTemplate.from_template(
        STORE_SYSTEM_PROMPT_TEMPLATE
    )
    user_prompt = HumanMessagePromptTemplate.from_template(STORE_USER_PROMPT_TEMPLATE)

    chat_prompt = ChatPromptTemplate.from_messages([system_prompt, user_prompt])

    language_instruction = ""
    if language and str(language).strip():
        language_instruction = (
            f"IMPORTANT: Generate all content in {str(language).strip()} language."
        )

    messages = chat_prompt.format_messages(
        schema_name=HomePageMultiStore.__name__,
        page_name="home page",
        category=category_key,
        product_context_str=product_context_str or "",
        language_instruction=language_instruction,
    )

    parsed_model = structured_llm.invoke(messages)
    return parsed_model.model_dump()


def generate_product_page_text(
    category: str,
    product_context_str: Optional[str] = None,
    language: Optional[str] = None,
) -> Dict[str, Any]:
    category_key = (category or "").strip().lower()

    llm = llm_4_1_nano
    structured_llm = llm.with_structured_output(ProductPageMultiStore)

    system_prompt = SystemMessagePromptTemplate.from_template(
        STORE_SYSTEM_PROMPT_TEMPLATE
    )
    user_prompt = HumanMessagePromptTemplate.from_template(STORE_USER_PROMPT_TEMPLATE)

    chat_prompt = ChatPromptTemplate.from_messages([system_prompt, user_prompt])

    language_instruction = ""
    if language and str(language).strip():
        language_instruction = (
            f"IMPORTANT: Generate all content in {str(language).strip()} language."
        )

    messages = chat_prompt.format_messages(
        schema_name=ProductPageMultiStore.__name__,
        page_name="product page",
        category=category_key,
        product_context_str=product_context_str or "",
        language_instruction=language_instruction,
    )

    parsed_model = structured_llm.invoke(messages)
    return parsed_model.model_dump()


def generate_multi_product_store_text(
    products: list,
    category: str,
    language: Optional[str] = None,
    page_id: Optional[str] = None,
) -> Dict[str, Any]:
    combined_title = " / ".join(p["title"] for p in products)
    combined_description_lines = []
    for idx, product in enumerate(products, start=1):
        combined_description_lines.append(
            f"Product {idx} - {product['title']}:\n{product['description']}"
        )
    combined_description = "\n\n".join(combined_description_lines)

    product_context_str = build_product_context(
        product_title=combined_title,
        product_description=combined_description,
        category=category,
    )
    if page_id:
        document_store.update_generation_percentage(page_id, 12)

    home_page = generate_home_page_text(
        category=category,
        product_context_str=product_context_str,
        language=language,
    )
    if page_id:
        document_store.update_generation_percentage(page_id, 18)
    return {
        "home_page": home_page,
    }


def _normalize_product_id(value) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    if "/" in s:
        s = s.rstrip("/").split("/")[-1]
    return s


def _normalize_product_template(raw) -> int:
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return 1
    return 2 if n == 2 else 1


def _generate_cod_premium_product_pages(
    normalized_products: List[Dict[str, Any]],
    raw_products: list,
    category_key: str,
    language: Optional[str] = None,
    page_id: Optional[str] = None,
    selected_template: int = 1,
) -> List[Dict[str, Any]]:
    """
    Multi store: one premium PDP (same Generate Product Page path) per selected product.
    Used for both COD and prepaid multi.
    """
    from .generate_text import generate_product_page_copy
    from .generate_images import generate_images

    pages: List[Dict[str, Any]] = []
    total = max(len(normalized_products), 1)
    template = _normalize_product_template(selected_template)
    for idx, product in enumerate(normalized_products):
        title = product.get("title") or f"Product {idx + 1}"
        description = product.get("description") or ""
        image_urls = product.get("productImages") or []
        raw = (
            raw_products[idx]
            if isinstance(raw_products, list) and idx < len(raw_products)
            else {}
        )
        handle = ""
        if isinstance(raw, dict):
            handle = _product_handle_from_payload(raw)
        product_id = product.get("id")
        if product_id is None and isinstance(raw, dict):
            product_id = raw.get("id")

        page_entry: Dict[str, Any] = {
            "id": product_id,
            "handle": handle,
            "title": title,
            "text": {},
            "images": {},
        }

        try:
            product_context_str = build_product_context(
                product_title=title,
                product_description=description,
                category=category_key,
            )
            page_entry["text"] = generate_product_page_copy(
                category=category_key,
                template=template,
                product_context_str=product_context_str,
                language=language,
            ) or {}
            logger.info(
                "Store premium PDP text for product %s (%s): %s fields",
                idx + 1,
                title,
                len(page_entry["text"]),
            )
        except Exception as text_err:
            logger.error(
                f"COD multi product page text failed for product {idx + 1}: {text_err}"
            )

        if image_urls:
            try:
                page_entry["images"] = generate_images(
                    product_title=title,
                    product_description=description,
                    product_images=image_urls,
                    category=category_key,
                    template=template,
                    page_id=None,
                    document_store=None,
                    language=language,
                ) or {}
            except Exception as img_err:
                logger.error(
                    f"COD multi product page images failed for product {idx + 1}: {img_err}"
                )

        pages.append(page_entry)
        if page_id:
            # After home (~18–58), walk COD PDPs toward ~70 before collections.
            pct = 58 + int(((idx + 1) / total) * 10)
            document_store.update_generation_percentage(page_id, min(pct, 68))

    return pages


def generate_for_multi_product_store(data, category_key, language, page_id=None):
    if page_id:
        document_store.update_generation_percentage(page_id, 6)

    market_type = str(
        data.get("market_type") or data.get("marketType") or "prepaid"
    ).strip().lower()
    if market_type not in {"cod", "prepaid"}:
        market_type = "prepaid"
    country_code_raw = data.get("country_code") or data.get("countryCode")
    country_code = (
        str(country_code_raw).strip().upper()[:2] if country_code_raw else None
    )

    products = data.get("products") or []
    if not isinstance(products, list) or not products:
        return None, "products must be a non-empty array for multi_product mode"
    if len(products) > 3:
        return None, "multi_product mode supports at most 3 products"

    normalized_products = []
    for idx, product in enumerate(products, start=1):
        if not isinstance(product, dict):
            return (
                None,
                f"Product {idx} must be an object with title and description",
            )

        title = str(product.get("title", "")).strip()
        description = str(product.get("description", "")).strip()

        if not title or not description:
            return None, f"Product {idx} must include both title and description"

        image_urls = _collect_product_image_urls(product)
        entry: Dict[str, Any] = {
            "title": title,
            "description": description,
            "productImages": image_urls,
        }
        pid = product.get("id")
        if pid is not None:
            entry["id"] = pid
        normalized_products.append(entry)

    if page_id:
        document_store.update_generation_percentage(page_id, 10)

    pages = generate_multi_product_store_text(
        products=normalized_products,
        category=category_key,
        language=language,
        page_id=page_id,
    )

    images_result: Dict[str, Any] = {"home_page": {}, "product_page": {}}
    if all(p.get("productImages") for p in normalized_products):
        if page_id:
            document_store.update_generation_percentage(page_id, 30)
        try:
            images_result = generate_multi_product_store_images(
                normalized_products,
                category_key,
                language=language,
                page_id=page_id,
                document_store=document_store,
            )
        except Exception as image_error:
            logger.error(f"Error generating multi-product store images: {image_error}")
    elif page_id:
        document_store.update_generation_percentage(page_id, 58)

    home_text = dict((pages or {}).get("home_page", {}) or {})
    # Multi-store: product handles from frontend (for metafield / Liquid).
    raw_products = data.get("products") or []
    if isinstance(raw_products, list):
        for slot in (1, 2, 3):
            p = raw_products[slot - 1] if len(raw_products) >= slot else None
            home_text[f"selected_product_{slot}"] = (
                _product_handle_from_payload(p) if isinstance(p, dict) else ""
            )
    home_images = dict((images_result or {}).get("home_page", {}) or {})
    apply_review_placeholders(home_text, language, slots=5)
    apply_common_cta_defaults(home_text, language)

    product_pages: List[Dict[str, Any]] = []
    selected_template = _normalize_product_template(
        data.get("selectedTemplate") or data.get("selected_template")
    )
    # Multi (COD + prepaid): generate premium PDPs when the client asks for them.
    # Empty premiumProductIds → store home only (no Sleek/Vibe PDPs).
    # Missing key (legacy clients) → all selected featured products (previous default).
    _premium_key_present = (
        "premiumProductIds" in data or "premium_product_ids" in data
    )
    _requested_premium = (
        data.get("premiumProductIds")
        if "premiumProductIds" in data
        else data.get("premium_product_ids")
    )
    if not isinstance(_requested_premium, list):
        _requested_premium = []

    if _premium_key_present and len(_requested_premium) == 0:
        premium_id_set: Set[str] = set()
        logger.info(
            "Multi store: premiumProductIds=[] — skipping premium PDP generation"
        )
    else:
        if _premium_key_present and _requested_premium:
            requested_norm = {
                _normalize_product_id(x)
                for x in _requested_premium
                if _normalize_product_id(x)
            }
            premium_products = [
                p
                for p in normalized_products
                if _normalize_product_id(p.get("id")) in requested_norm
            ]
        else:
            premium_products = list(normalized_products)

        premium_id_set = {
            _normalize_product_id(p.get("id"))
            for p in premium_products
            if _normalize_product_id(p.get("id"))
        }

        if premium_products:
            by_id = {
                _normalize_product_id(p.get("id")): p
                for p in (raw_products if isinstance(raw_products, list) else [])
                if isinstance(p, dict) and _normalize_product_id(p.get("id"))
            }
            premium_raw = [
                by_id.get(_normalize_product_id(p.get("id")), {})
                for p in premium_products
            ]

            product_pages = _generate_cod_premium_product_pages(
                normalized_products=premium_products,
                raw_products=premium_raw,
                category_key=category_key,
                language=language,
                page_id=page_id,
                selected_template=selected_template,
            )

    primary_product_page = (
        {
            "text": product_pages[0].get("text") or {},
            "images": product_pages[0].get("images") or {},
        }
        if product_pages
        else {"text": {}, "images": {}}
    )

    generation = {
        "mode": "multi",
        "market_type": market_type,
        "country_code": country_code,
        "selectedTemplate": selected_template,
        "premium_product_ids": sorted(premium_id_set) if premium_id_set else [],
        "home_page": {
            "text": home_text,
            "images": home_images,
        },
        "product_page": primary_product_page,
        "product_pages": product_pages,
    }
    subcats = (images_result or {}).get("product_image_subcategories")
    if isinstance(subcats, list) and subcats:
        generation["product_image_subcategories"] = subcats
    return generation, None
