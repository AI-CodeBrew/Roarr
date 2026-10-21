"""
Shared helpers for store generation payloads (parity with storefront / admin product shapes).
"""

from typing import Any, Dict, List, Optional


def collect_product_image_urls(product: Optional[Dict[str, Any]], max_count: int = 20) -> List[str]:
    """
    Mirror frontend collectProductImageUrls: featured image first, then GraphQL edges,
    then a flat images array (strings or {url}). Dedupe, preserve order, cap at max_count.
    """
    if not product:
        return []
    urls: List[str] = []

    def add(u: Any) -> None:
        if not isinstance(u, str) or not u.strip():
            return
        u = u.strip()
        if u not in urls:
            urls.append(u)

    fi = product.get("featuredImage") or product.get("featured_image")
    if isinstance(fi, dict) and fi.get("url"):
        add(str(fi["url"]))
        if len(urls) >= max_count:
            return urls[:max_count]

    images = product.get("images")
    if isinstance(images, dict):
        edges = images.get("edges") or []
        if isinstance(edges, list):
            for e in edges:
                node = (e or {}).get("node") or {}
                u = node.get("url")
                if u:
                    add(str(u))
                    if len(urls) >= max_count:
                        return urls[:max_count]

    if isinstance(images, list):
        for img in images:
            if isinstance(img, str):
                if img.strip():
                    add(img.strip())
            elif isinstance(img, dict) and img.get("url"):
                add(str(img["url"]).strip())
            if len(urls) >= max_count:
                return urls[:max_count]

    return urls[:max_count]


def product_dict_for_image_collection(pd: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a product-shaped dict for collect_product_image_urls from shopify_utils.get_product output.
    """
    fi_url = pd.get("featured_image_url")
    out: Dict[str, Any] = {}
    if fi_url:
        out["featuredImage"] = {"url": fi_url}
    raw_urls = [str(u).strip() for u in (pd.get("images") or []) if u]
    edges = [{"node": {"url": u}} for u in raw_urls]
    if edges:
        out["images"] = {"edges": edges}
    return out


def store_description_from_shopify(pd: Dict[str, Any]) -> str:
    """description || descriptionHtml (plain description preferred)."""
    d = (pd.get("description") or "").strip()
    if d:
        return d
    return (pd.get("description_html") or "").strip()
