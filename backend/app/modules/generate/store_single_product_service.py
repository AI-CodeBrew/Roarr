import logging
from typing import Any, Dict, List, Optional

from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from ...clients.langchain_client import llm_4_1_nano
from ..database import document_store
from .context_utils import build_product_context
from .generate_images import generate_single_product_store_images
from .store_prompts import STORE_SYSTEM_PROMPT_TEMPLATE, STORE_USER_PROMPT_TEMPLATE
from .store.templates.single_store.signature import (
    HomePageSingleStore,
    ProductPageSingleStore,
)
from .store.templates.packs.cinematic.signature import HomePageCinematicStore
from .store.templates.packs.amour.signature import HomePageAmourStore
from .store.pack_utils import (
    HOME_ONLY_STORE_TEMPLATE_PACKS,
    normalize_store_template_pack,
)
from .generation_locale import apply_common_cta_defaults, apply_review_placeholders

logger = logging.getLogger(__name__)


def _single_product_handle_from_payload(data: dict) -> str:
    """Handle from frontend for single-product store generation."""
    if not isinstance(data, dict):
        return ""
    for key in ("handle", "productHandle", "product_handle"):
        v = data.get(key)
        if v is not None and str(v).strip():
            return str(v).strip()
    prod = data.get("product")
    if isinstance(prod, dict):
        for key in ("handle", "productHandle", "product_handle"):
            v = prod.get(key)
            if v is not None and str(v).strip():
                return str(v).strip()
    return ""


def _collect_request_product_image_urls(data: dict) -> List[str]:
    """productImages | product_images | images | image (single or list). Deduped."""
    merged: List[str] = []
    for key in ("productImages", "product_images", "images", "image"):
        raw = data.get(key)
        if raw is None:
            continue
        if isinstance(raw, str):
            s = raw.strip()
            if s:
                merged.append(s)
        elif isinstance(raw, list):
            merged.extend(
                [str(u).strip() for u in raw if u is not None and str(u).strip()]
            )
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
    store_template_pack: str = "classic",
) -> Dict[str, Any]:
    category_key = (category or "").strip().lower()
    pack = normalize_store_template_pack(store_template_pack)
    schema_cls = {
        "cinematic": HomePageCinematicStore,
        "amour": HomePageAmourStore,
    }.get(pack, HomePageSingleStore)

    llm = llm_4_1_nano
    structured_llm = llm.with_structured_output(schema_cls)

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
        schema_name=schema_cls.__name__,
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
    structured_llm = llm.with_structured_output(ProductPageSingleStore)

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
        schema_name=ProductPageSingleStore.__name__,
        page_name="product page",
        category=category_key,
        product_context_str=product_context_str or "",
        language_instruction=language_instruction,
    )

    parsed_model = structured_llm.invoke(messages)
    return parsed_model.model_dump()


def _normalize_product_template(raw) -> int:
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return 1
    return 2 if n == 2 else 1


def generate_single_product_store_text(
    product_title: str,
    product_description: str,
    category: str,
    language: Optional[str] = None,
    page_id: Optional[str] = None,
    market_type: str = "prepaid",
    selected_template: int = 1,
    store_template_pack: str = "classic",
    include_premium_pdp: bool = True,
) -> Dict[str, Any]:
    product_context_str = build_product_context(
        product_title=product_title,
        product_description=product_description,
        category=category,
    )
    if page_id:
        document_store.update_generation_percentage(page_id, 12)

    home_page = generate_home_page_text(
        category=category,
        product_context_str=product_context_str,
        language=language,
        store_template_pack=store_template_pack,
    )
    if page_id:
        document_store.update_generation_percentage(page_id, 20)

    result: Dict[str, Any] = {
        "home_page": home_page,
    }

    # Premium themes (COD + prepaid Linen/Pulse/Eclipse/Velvet): Sleek/Vibe PDP text.
    # Classic prepaid skips premium PDP generation.
    if include_premium_pdp:
        try:
            from .generate_text import generate_product_page_copy

            product_page = generate_product_page_copy(
                category=category,
                template=selected_template,
                product_context_str=product_context_str,
                language=language,
            )
            result["product_page"] = product_page or {}
            logger.info(
                "Single premium PDP text: %s fields",
                len(result["product_page"]) if isinstance(result["product_page"], dict) else 0,
            )
            if page_id:
                document_store.update_generation_percentage(page_id, 24)
        except Exception as e:
            logger.error(f"Single product page text generation failed: {e}")
            result["product_page"] = {}

    return result


def generate_for_single_product_store(data, category_key, language, page_id=None):
    product_title = data.get("productTitle")
    product_description = data.get("productDescription")
    market_type = str(
        data.get("market_type") or data.get("marketType") or "prepaid"
    ).strip().lower()
    if market_type not in {"cod", "prepaid"}:
        market_type = "prepaid"
    country_code_raw = data.get("country_code") or data.get("countryCode")
    country_code = (
        str(country_code_raw).strip().upper()[:2] if country_code_raw else None
    )

    if not product_title or not product_description:
        return None, "productTitle and productDescription are required for single_product mode"

    selected_template = _normalize_product_template(
        data.get("selectedTemplate") or data.get("selected_template")
    )
    store_template_pack = normalize_store_template_pack(
        data.get("storeTemplatePack")
        or data.get("store_template_pack")
        or data.get("homepageTemplatePack")
    )

    # Classic prepaid: premiumProductIds=[] → homepage only (no Sleek/Vibe PDP).
    # Missing key (legacy): generate premium PDP. COD always premium.
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
    include_premium_pdp = (
        True if not _premium_key_present else len(_requested_premium) > 0
    )
    # Swift / Amour: homepage-only (no Sleek/Vibe PDP), prepaid and COD.
    if store_template_pack in HOME_ONLY_STORE_TEMPLATE_PACKS:
        include_premium_pdp = False
    # Explicit empty premiumProductIds → homepage-only (Swift), including COD.
    elif _premium_key_present and len(_requested_premium) == 0:
        include_premium_pdp = False

    if page_id:
        document_store.update_generation_percentage(page_id, 8)

    text = generate_single_product_store_text(
        product_title=product_title,
        product_description=product_description,
        category=category_key,
        language=language,
        page_id=page_id,
        market_type=market_type,
        selected_template=selected_template,
        store_template_pack=store_template_pack,
        include_premium_pdp=include_premium_pdp,
    )

    images_result = {}
    product_images_urls = _collect_request_product_image_urls(data)
    if product_images_urls:
        if page_id:
            document_store.update_generation_percentage(page_id, 28)
        try:
            style_prefs = data.get("stylePreferences") or data.get("style_preferences") or {}
            brand_color = (
                style_prefs.get("dynamicColor")
                or style_prefs.get("dynamic_color")
                or data.get("selected_color")
                or data.get("dynamicColor")
            )
            brand_colors = [brand_color] if brand_color else None
            images_result = generate_single_product_store_images(
                product_title=product_title,
                product_description=product_description,
                product_images=product_images_urls,
                category=category_key,
                language=language,
                page_id=page_id,
                document_store=document_store,
                store_template_pack=store_template_pack,
                brand_colors=brand_colors,
            )
        except Exception as image_error:
            logger.error(f"Error generating images for store: {image_error}")
    elif page_id:
        document_store.update_generation_percentage(page_id, 58)

    product_page_images: Dict[str, Any] = {}
    if include_premium_pdp and product_images_urls:
        try:
            from .generate_images import generate_images

            if page_id:
                document_store.update_generation_percentage(page_id, 62)
            product_page_images = generate_images(
                product_title=product_title,
                product_description=product_description,
                product_images=product_images_urls,
                category=category_key,
                template=selected_template,
                page_id=None,
                document_store=None,
                language=language,
            ) or {}
        except Exception as pdp_img_err:
            logger.error(f"Single product page image generation failed: {pdp_img_err}")
            product_page_images = {}

    home_text = dict((text or {}).get("home_page", {}) or {})
    home_text["selected_product"] = _single_product_handle_from_payload(data)
    home_images = dict((images_result or {}).get("home_page", {}) or {})
    # Reviews are merchant placeholders (same as classic) — never AI-fill.
    apply_review_placeholders(home_text, language, slots=4)
    apply_common_cta_defaults(home_text, language)
    for slot in range(1, 4):
        home_text.pop(f"review_{slot}_name", None)
        home_text.pop(f"review_{slot}_location", None)
        home_text.pop(f"review_{slot}_quote", None)

    product_page_text = (
        dict((text or {}).get("product_page", {}) or {}) if include_premium_pdp else {}
    )
    if product_page_text:
        apply_common_cta_defaults(product_page_text, language)
    product_id_raw = data.get("productId") or data.get("product_id")
    if not product_id_raw and isinstance(data.get("product"), dict):
        product_id_raw = data["product"].get("id")
    product_handle = _single_product_handle_from_payload(data)
    generation = {
        "mode": {"type": "single"},
        "market_type": market_type,
        "country_code": country_code,
        "selectedTemplate": selected_template,
        "storeTemplatePack": store_template_pack,
        "store_template_pack": store_template_pack,
        "premium_product_ids": (
            [str(product_id_raw)] if include_premium_pdp and product_id_raw else []
        ),
        "home_page": {
            "text": home_text,
            "images": home_images,
        },
        "product_page": {
            "text": product_page_text,
            "images": (
                product_page_images
                if include_premium_pdp and isinstance(product_page_images, dict)
                else {}
            ),
            **({"id": product_id_raw} if product_id_raw else {}),
            **({"handle": product_handle} if product_handle else {}),
            **({"title": product_title} if product_title else {}),
        },
    }
    sub = (images_result or {}).get("image_subcategory")
    if sub:
        generation["image_subcategory"] = sub
    return generation, None
