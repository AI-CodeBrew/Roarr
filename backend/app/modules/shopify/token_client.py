"""Current Shopify offline tokens for backend API calls.

Offline tokens last an hour and Shopify retires the old token on every refresh,
so the copy saved at install goes stale. The frontend owns the token and its
refresh, and the backend asks it for the current one.
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

_cache: Dict[str, Tuple[str, float]] = {}
_shop_locks: Dict[str, threading.Lock] = {}
_shop_locks_guard = threading.Lock()


def _lock_for(shop: str) -> threading.Lock:
    with _shop_locks_guard:
        return _shop_locks.setdefault(shop, threading.Lock())


def _fetch_token(shop: str) -> Tuple[str, Optional[str]]:
    frontend_url = (os.getenv("FRONTEND_URL") or "").rstrip("/")
    secret = os.getenv("SHOPIFY_APP_SECRET")
    if not frontend_url or not secret:
        raise ValueError("FRONTEND_URL and SHOPIFY_APP_SECRET are required")

    body = json.dumps({"shop": shop, "timestamp": int(time.time())}).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    response = requests.post(
        f"{frontend_url}{TOKEN_PATH}",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Internal-Signature": signature,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    return data["accessToken"], data.get("expiresAt")


def _cache_until(expires_at: Optional[str], now: float) -> float:
    until = now + CACHE_SECONDS
    if expires_at:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).timestamp()
        until = min(until, expiry - REFRESH_WINDOW_SECONDS)
    return until


def resolve_access_token(
    shop_url: Optional[str], stored_token: Optional[str]
) -> Optional[str]:
    """Return the store's current token, or the stored one if the frontend can't give it."""
    # No stored token means the store is uninstalled or was never connected.
    if not shop_url or not stored_token:
        return stored_token

    shop = normalize_shop_domain(shop_url)
    cached = _cache.get(shop)
    if cached and cached[1] > time.time():
        return cached[0]

    with _lock_for(shop):
        now = time.time()
        cached = _cache.get(shop)
        if cached and cached[1] > now:
            return cached[0]

        try:
            token, expires_at = _fetch_token(shop)
            _cache[shop] = (token, _cache_until(expires_at, now))
            return token
        except (requests.RequestException, KeyError, TypeError, ValueError) as e:
            logger.warning(
                "Could not get current Shopify token for %s, using stored token: %s",
                shop,
                e,
            )
            _cache[shop] = (stored_token, now + FAILURE_RETRY_SECONDS)
            return stored_token
