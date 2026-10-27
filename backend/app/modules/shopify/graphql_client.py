"""
Minimal Shopify Admin GraphQL client for calls made outside ShopifyService (webhooks, billing).

Shopify treats the REST Admin API as legacy, so new Admin calls go through here. Theme/asset
file calls are the only REST exception and stay where they are.
"""
import logging
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

SHOPIFY_API_VERSION = "2026-01"


class ShopifyGraphQLError(Exception):
    """Raised when Shopify rejects a GraphQL request (HTTP, top-level `errors`, or `userErrors`)."""


def normalize_shop_domain(shop_url: str) -> str:
    """'https://foo.myshopify.com' or 'foo' -> 'foo.myshopify.com'."""
    s = (shop_url or "").replace("https://", "").replace("http://", "").strip("/")
    return s if s.endswith(".myshopify.com") else f"{s}.myshopify.com"


def gid_to_id(gid: Optional[str]) -> Optional[str]:
    """'gid://shopify/AppPurchaseOneTime/123' -> '123'. Plain ids pass through."""
    if not gid:
        return None
    return str(gid).rsplit("/", 1)[-1]


def to_gid(resource: str, value: Any) -> str:
    """Numeric id (or existing gid) -> 'gid://shopify/<resource>/<id>'."""
    text = str(value)
    return text if text.startswith("gid://") else f"gid://shopify/{resource}/{text}"


def shopify_graphql(
    shop_url: str,
    access_token: str,
    query: str,
    variables: Optional[Dict[str, Any]] = None,
    *,
    api_version: str = SHOPIFY_API_VERSION,
    timeout: int = 30,
) -> Dict[str, Any]:
    """Run one Admin GraphQL operation and return its `data` dict."""
    url = f"https://{normalize_shop_domain(shop_url)}/admin/api/{api_version}/graphql.json"
    payload: Dict[str, Any] = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(
        url,
        json=payload,
        headers={"X-Shopify-Access-Token": access_token, "Content-Type": "application/json"},
        timeout=timeout,
    )
    if response.status_code != 200:
        raise ShopifyGraphQLError(f"HTTP {response.status_code}: {response.text[:300]}")
    body = response.json()
    if body.get("errors"):
        raise ShopifyGraphQLError(str(body["errors"])[:500])
    return body.get("data") or {}


def raise_on_user_errors(result: Optional[Dict[str, Any]]) -> None:
    """Raise if a mutation payload carries `userErrors`."""
    errors = (result or {}).get("userErrors") or []
    if errors:
        raise ShopifyGraphQLError("; ".join(e.get("message", "") for e in errors))
