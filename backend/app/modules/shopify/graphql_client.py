"""
Minimal Shopify Admin GraphQL client for calls made outside ShopifyService (webhooks, billing).

Shopify treats the REST Admin API as legacy, so new Admin calls go through here. Theme/asset
file calls are the only REST exception and stay where they are.
"""
import logging
import os
import threading
import time
from typing import Any, Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)

SHOPIFY_API_VERSION = "2026-10"

# Per-shop cache of `shop.plan.partnerDevelopment`, for the billing `test` flag. The answer can
# change when a development store is transferred to a merchant and moves to a paid plan, so it
# expires after a short time instead of being kept for the life of the process.
_DEV_STORE_CACHE_TTL_SECONDS = 600
_dev_store_cache: Dict[str, Tuple[bool, float]] = {}
_dev_store_cache_lock = threading.Lock()


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


def is_partner_development_store(shop_url: str, access_token: str) -> bool:
    """
    True only when Shopify reports `shop.plan.partnerDevelopment == true`.

    Cached per shop for `_DEV_STORE_CACHE_TTL_SECONDS`. A failed lookup returns False and is not
    cached, so an error can never turn a paying store's charge into a free test charge.
    """
    shop = normalize_shop_domain(shop_url)
    now = time.monotonic()
    with _dev_store_cache_lock:
        cached = _dev_store_cache.get(shop)
    if cached and cached[1] > now:
        return cached[0]

    try:
        data = shopify_graphql(
            shop,
            access_token,
            "query ShopPlanForBilling { shop { plan { partnerDevelopment } } }",
            timeout=10,
        )
    except (ShopifyGraphQLError, requests.RequestException, ValueError) as exc:
        logger.warning(f"Could not read plan for {shop}; using real (non-test) charges: {exc}")
        return False

    is_dev = ((data.get("shop") or {}).get("plan") or {}).get("partnerDevelopment") is True
    with _dev_store_cache_lock:
        _dev_store_cache[shop] = (is_dev, now + _DEV_STORE_CACHE_TTL_SECONDS)
    logger.info(f"Shop {shop} partnerDevelopment={is_dev}")
    return is_dev


def use_test_charges(shop_url: str, access_token: str) -> bool:
    """
    Billing `test` flag: SHOPIFY_TEST_MODE=true, or the shop is a partner development store.
    Paying stores get False.
    """
    if os.getenv("SHOPIFY_TEST_MODE", "false").lower() == "true":
        return True
    return is_partner_development_store(shop_url, access_token)
