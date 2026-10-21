"""
Store generation: run collections agent + generate one image per collection
using product images in that collection.
"""

import logging
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional, Tuple

from ..shopify.collections_agent_service import (
    run_collections_agent,
    sync_reused_collection_descriptions_to_shopify,
)
from ..shopify.shopify_utils import shopify_utils
from .generate_images import (
    cleanup_temp_directory,
    convert_urls_to_paths,
    generate_and_upload_image_with_retry,
)

logger = logging.getLogger(__name__)

_MAX_BASE_IMAGES = 8


def _strip_title(value: Any) -> str:
    s = str(value or "").strip()
    return s[:200] if s else ""


def _collect_product_image_urls(product: Dict[str, Any]) -> List[str]:
    urls: List[str] = []
    img = product.get("image")
    if isinstance(img, dict) and img.get("src"):
        urls.append(str(img["src"]).strip())
    elif isinstance(img, str) and img.strip():
        urls.append(img.strip())
    for im in product.get("images") or []:
        if isinstance(im, dict) and im.get("src"):
            u = str(im["src"]).strip()
            if u:
                urls.append(u)
    seen = set()
    out: List[str] = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out[:_MAX_BASE_IMAGES]


def _products_by_id(products: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    m: Dict[str, Dict[str, Any]] = {}
    for p in products or []:
        pid = p.get("id")
        if pid is not None:
            m[str(pid)] = p
    return m


def _collection_image_prompt(
    name: str,
    description: str,
    product_titles: List[str],
    category: str,
    language: Optional[str],
) -> str:
    titles = ", ".join(product_titles[:20]) if product_titles else "various products"
    desc = (description or "").strip()[:400]
    lang = (language or "").strip()
    locale_note = (
        f" Visual mood should suit a store serving primarily {lang}-speaking customers."
        if lang
        else ""
    )
    return (
        f"Create a single, professional e-commerce collection hero image for an online store. "
        f"Collection name (for your understanding only—do NOT render as text): {name}. "
        f"Short description (mood only—do NOT put this text on the image): {desc}. "
        f"Products in this collection include: {titles}. "
        f"Store category context: {category or 'general'}. "
        f"Style: clean, premium, cohesive, suitable for a Shopify collection banner. "
        f"CRITICAL: The product is the unchanged central hero, with perfectly preserved geometry, "
        f"materials, proportions, and branding, exactly as shown in the provided reference image. "
        f"Do not alter, redesign, substitute, or stylize the product away from the reference; "
        f"only the surrounding scene, lighting, and composition may be adjusted for the banner. "
        f"CRITICAL: The image must be purely visual—no letters, words, numbers, captions, "
        f"logos, watermarks, price tags, labels with readable text, or typography of any kind. "
        f"The storefront will show the collection title separately; do not add fake product names or prices."
        + locale_note
    )


def _generate_collection_image_for_entry(
    idx: int,
    col: Dict[str, Any],
    by_id: Dict[str, Dict[str, Any]],
    store_category: str,
    language: Optional[str],
    user_id: str,
) -> Dict[str, Any]:
    """Build one collection entry with generated_image_url (own temp dir; thread-safe)."""
    entry = dict(col)
    name = entry.get("name") or "Collection"
    description = entry.get("description") or ""
    pids = entry.get("product_ids") or []
    full_products: List[Dict[str, Any]] = []
    for pid in pids:
        p = by_id.get(str(pid))
        if p:
            full_products.append(p)

    titles = [_strip_title(p.get("title")) for p in full_products if p.get("title")]
    image_urls: List[str] = []
    for p in full_products:
        image_urls.extend(_collect_product_image_urls(p))
        if len(image_urls) >= _MAX_BASE_IMAGES:
            image_urls = image_urls[:_MAX_BASE_IMAGES]
            break

    temp_dir = tempfile.mkdtemp(prefix=f"collection_img_{idx}_")
    generated_url: Optional[str] = None
    try:
        base_paths: Any = []
        if image_urls:
            base_paths = convert_urls_to_paths(image_urls, temp_dir)
        if not base_paths:
            base_paths = None

        prompt = _collection_image_prompt(
            name=name,
            description=description,
            product_titles=titles,
            category=store_category,
            language=language,
        )
        generated_url = generate_and_upload_image_with_retry(
            base_paths,
            prompt,
            temp_dir,
            filename_base=f"collection_{idx}_{uuid.uuid4().hex[:6]}",
            image_type="product_images",
            aspect_ratio_override="1:1",
            slot_label=f"collection_image_{idx}",
        )
    except Exception as e:
        logger.warning(f"Collection image generation failed for '{name}': {e}")
    finally:
        try:
            cleanup_temp_directory(temp_dir)
        except Exception:
            pass

    entry["generated_image_url"] = generated_url

    # Also update the Shopify collection itself with this hero image (best effort).
    collection_id = entry.get("collection_id")
    if generated_url and collection_id:
        try:
            upd = shopify_utils.update_collection_image(
                collection_id=str(collection_id),
                image_src=str(generated_url),
                user_id=user_id,
            )
            entry["shopify_collection_image_updated"] = bool(upd.get("success"))
        except Exception as e:
            logger.warning(
                f"Failed updating Shopify collection image for '{name}' ({collection_id}): {e}"
            )
            entry["shopify_collection_image_updated"] = False
    return entry


def _parallel_collection_images(
    selected: List[Dict[str, Any]],
    by_id: Dict[str, Dict[str, Any]],
    store_category: str,
    language: Optional[str],
    user_id: str,
) -> List[Dict[str, Any]]:
    if not selected:
        return []

    n = len(selected)
    max_workers = min(n, 3)

    def _task(args: Tuple[int, Dict[str, Any]]) -> Dict[str, Any]:
        idx, col = args
        return _generate_collection_image_for_entry(
            idx, col, by_id, store_category, language, user_id
        )

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        return list(executor.map(_task, enumerate(selected)))


def run_collections_agent_and_images(
    *,
    user_id: str,
    store_category: str,
    language: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch catalog + collections from Shopify, run collections agent, then generate
    one S3 image URL per selected collection (from products in that collection).
    """
    if not user_id:
        return {"success": False, "error": "user_id is required"}

    products = shopify_utils.get_products(user_id, limit=250)
    collections = shopify_utils.get_collections_with_products(
        user_id=user_id,
        per_collection_product_limit=250,
    )

    if not products:
        return {
            "success": False,
            "error": "No products in store; cannot run collections agent.",
        }

    agent_result = run_collections_agent(
        products_raw=products,
        collections_raw=collections or [],
        user_id=user_id,
        target_cards=3,
    )

    selected = agent_result.get("selected_collections") or []
    by_id = _products_by_id(products)

    sync_reused_collection_descriptions_to_shopify(
        user_id=user_id,
        selected_collections=selected,
        product_by_id=by_id,
        language=language,
    )

    items_out = _parallel_collection_images(
        selected, by_id, store_category, language, user_id
    )

    return {
        "success": True,
        "collections": {
            "items": items_out,
            "agent_meta": agent_result.get("meta") or {},
            "intentionally_skipped": agent_result.get("intentionally_skipped") or [],
        },
    }


def apply_collections_to_home_page(generation: Dict[str, Any]) -> None:
    """
    After collections agent + images: align the multi-store home page with the
    three selected collections.

    - text.top_product_punchline_{1,2,3} <- collection name (heading)
    - text.collection_{1,2,3} <- Shopify collection handle (string)
    - images.product_impact_image_{1,2,3} <- generated collection hero URLs
    """
    coll = generation.get("collections") or {}
    items = coll.get("items") or []
    if not items:
        return

    hp = generation.setdefault("home_page", {})
    text = hp.setdefault("text", {})
    images = hp.setdefault("images", {})

    for slot in (1, 2, 3):
        item = items[slot - 1] if len(items) >= slot else None
        if isinstance(item, dict):
            heading = (item.get("name") or item.get("title") or "").strip()
            if heading:
                text[f"top_product_punchline_{slot}"] = heading
            h = item.get("handle")
            text[f"collection_{slot}"] = (
                str(h).strip() if h is not None and str(h).strip() else ""
            )
            url = item.get("generated_image_url")
            if url:
                images[f"product_impact_image_{slot}"] = url
        else:
            text[f"collection_{slot}"] = ""
