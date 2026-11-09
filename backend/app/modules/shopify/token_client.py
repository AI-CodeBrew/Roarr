"""Current Shopify offline tokens for backend API calls.

Offline tokens are *expiring*: an access token lasts one hour and comes with a rotating
refresh token. Shopify retires the previous token on every refresh or token exchange, so
only ONE party may refresh a store's token. The frontend (the Shopify app template) owns
the Session row and its refresh; this module only asks it for the current token. The backend
never refreshes on its own, because a second refresher would retire the frontend's tokens.

Every Shopify Admin call in the backend gets its token from `get_valid_shopify_token`.
There is deliberately no fallback to the token saved at install time: it is stale after an
hour, and a legacy non-expiring token would be blocked by Shopify. When no valid token can be
had, a typed error is raised and, if the store has to reopen the app, it is marked
`needs_reauth` in the stores table.
"""
import hashlib
import hmac
import json
import logging
import os
import threading
import time
from datetime import datetime
from typing import Dict, Optional, Tuple

import requests

from app.modules.shopify.graphql_client import normalize_shop_domain

logger = logging.getLogger(__name__)

TOKEN_PATH = "/api/internal/shop-token"
REQUEST_TIMEOUT_SECONDS = 10
CACHE_SECONDS = 60
FAILURE_RETRY_SECONDS = 30
# The frontend replaces a token this close to expiry, retiring the old one, so a
# cached token must not be reused once this window starts.
REFRESH_WINDOW_SECONDS = 5 * 60

REAUTH_MESSAGE = (
    "Shopify access for this store has expired. Open Roarr from your Shopify admin "
    "to reconnect it."
)


class ShopifyTokenError(Exception):
    """No usable Shopify token could be obtained for a store."""


class ShopifyReauthRequired(ShopifyTokenError):
    """The store has no valid session or refresh token; the merchant must reopen the app."""

    def __init__(self, reason: str = ""):
        super().__init__(REAUTH_MESSAGE)
        self.reason = reason or "re-auth required"


class ShopifyTokenUnavailable(ShopifyTokenError):
    """The token service could not be reached or is misconfigured (a retry may work)."""


_cache: Dict[str, Tuple[str, float]] = {}
# shop -> (monotonic-ish wall time until which a failure is remembered, the error)
_failures: Dict[str, Tuple[float, ShopifyTokenError]] = {}
_flagged_reauth = set()
_shop_locks: Dict[str, threading.Lock] = {}
_shop_locks_guard = threading.Lock()


def _lock_for(shop: str) -> threading.Lock:
    with _shop_locks_guard:
        return _shop_locks.setdefault(shop, threading.Lock())


def _fetch_token(shop: str) -> Tuple[str, Optional[str]]:
    """Ask the frontend for the store's current token. Raises a ShopifyTokenError."""
    frontend_url = (os.getenv("FRONTEND_URL") or "").rstrip("/")
    secret = os.getenv("SHOPIFY_APP_SECRET")
    if not frontend_url or not secret:
        raise ShopifyTokenUnavailable("FRONTEND_URL and SHOPIFY_APP_SECRET are required")

    body = json.dumps({"shop": shop, "timestamp": int(time.time())}).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    try:
        response = requests.post(
            f"{frontend_url}{TOKEN_PATH}",
            data=body,
            headers={
                "Content-Type": "application/json",
                "X-Internal-Signature": signature,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as e:
        raise ShopifyTokenUnavailable(f"token service unreachable: {e}") from e

    # 404: no Session row (uninstalled, or a legacy non-expiring session the app ignores).
    # 409: the session or its refresh token expired. Both need the merchant to reopen the app.
    if response.status_code in (404, 409):
        raise ShopifyReauthRequired(f"token service says re-auth is needed (HTTP {response.status_code})")
    if response.status_code != 200:
        raise ShopifyTokenUnavailable(f"token service returned HTTP {response.status_code}")

    try:
        data = response.json()
        return data["accessToken"], data.get("expiresAt")
    except (ValueError, KeyError, TypeError) as e:
        raise ShopifyTokenUnavailable(f"token service sent an unexpected response: {e}") from e


def _cache_until(expires_at: Optional[str], now: float) -> float:
    until = now + CACHE_SECONDS
    if expires_at:
        try:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).timestamp()
            until = min(until, expiry - REFRESH_WINDOW_SECONDS)
        except ValueError:
            pass
    return until


def _set_reauth_flag(shop: str, needed: bool, reason: str = "") -> None:
    """Best effort: record on the store whether the merchant has to reopen the app."""
    try:
        from app.modules.database import document_store  # lazy: avoids an import cycle

        document_store.mark_store_reauth(shop, needed, reason)
    except Exception as e:  # never let bookkeeping break an API call
        logger.warning("Could not set needs_reauth=%s for %s: %s", needed, shop, e)


def invalidate_token(shop_url: str) -> None:
    """Forget the cached token (call after Shopify answered 401 for it)."""
    _cache.pop(normalize_shop_domain(shop_url), None)


def get_valid_shopify_token(shop_url: str, force_refresh: bool = False) -> str:
    """
    Return the store's current offline access token.

    - Served from a short cache that never outlives the token's refresh window.
    - `force_refresh=True` skips the cache (use it once after a 401).
    - Raises ShopifyReauthRequired when the merchant has to reopen the app, or
      ShopifyTokenUnavailable when the token service can't be reached. Never returns a
      stale or legacy token.
    """
    if not shop_url:
        raise ShopifyTokenUnavailable("shop_url is required")
    shop = normalize_shop_domain(shop_url)

    if not force_refresh:
        cached = _cache.get(shop)
        if cached and cached[1] > time.time():
            return cached[0]
        failed = _failures.get(shop)
        if failed and failed[0] > time.time():
            raise failed[1]

    with _lock_for(shop):
        now = time.time()
        if not force_refresh:
            cached = _cache.get(shop)
            if cached and cached[1] > now:
                return cached[0]
            failed = _failures.get(shop)
            if failed and failed[0] > now:
                raise failed[1]

        try:
            token, expires_at = _fetch_token(shop)
        except ShopifyReauthRequired as e:
            _cache.pop(shop, None)
            _failures[shop] = (now + FAILURE_RETRY_SECONDS, e)
            logger.error(
                "SHOPIFY_REAUTH_REQUIRED shop=%s: %s. The merchant must open Roarr from the "
                "Shopify admin to get a new expiring token.",
                shop,
                e.reason,
            )
            _flagged_reauth.add(shop)
            _set_reauth_flag(shop, True, e.reason)
            raise
        except ShopifyTokenUnavailable as e:
            _failures[shop] = (now + FAILURE_RETRY_SECONDS, e)
            logger.warning("Shopify token unavailable for %s: %s", shop, e)
            raise

        _failures.pop(shop, None)
        _cache[shop] = (token, _cache_until(expires_at, now))
        if shop in _flagged_reauth:
            _flagged_reauth.discard(shop)
            _set_reauth_flag(shop, False)
        return token


def resolve_access_token(
    shop_url: Optional[str], stored_token: Optional[str]
) -> Optional[str]:
    """
    Backwards-compatible wrapper used when loading store credentials.

    No stored token means the store is uninstalled or was never connected, so there is
    nothing to resolve. Otherwise the stored token is ignored and the current one is returned.
    """
    if not shop_url or not stored_token:
        return stored_token
    return get_valid_shopify_token(shop_url)
