"""
Reddit Conversions API: Send server-side conversion events (e.g. SignUp) to Reddit.
"""
import hashlib
import json
import logging
import os
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

REDDIT_SIGNUP_EVENT_TYPE = "SignUp"


def _sha256_hash(data: str | None) -> str | None:
    """Normalize and SHA256-hash a string for Reddit CAPI (strip, lowercase)."""
    if not data or not isinstance(data, str):
        return None
    normalized = data.strip().lower().encode("utf-8")
    return hashlib.sha256(normalized).hexdigest()


def _get_iso_time() -> str:
    """Return current UTC time in ISO format for Reddit event_at."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _generate_conversion_id(event_at: str, tracking_type: str, store_url: str) -> str:
    """Generate a deterministic conversion_id for deduplication."""
    input_string = f"{event_at}{tracking_type}{store_url}"
    return hashlib.sha256(input_string.encode("utf-8")).hexdigest()


def send_reddit_signup_event(stored_shop: dict) -> bool:
    """
    Send a SignUp conversion event to Reddit CAPI using shop details.

    Uses from stored_shop:
      - email -> user_email (hashed)
      - store_url or domain -> store_domain
      - phone -> phone (hashed, optional)

    Reads from env: REDDIT_ACCESS_TOKEN, REDDIT_PIXEL_ID.
    Optional: REDDIT_TEST_ID for test mode.

    Returns True if the event was sent successfully, False otherwise.
    """
    access_token = os.getenv("REDDIT_ACCESS_TOKEN", "").strip()
    pixel_id = os.getenv("REDDIT_PIXEL_ID", "").strip()
    if not access_token or not pixel_id:
        logger.debug(
            "Reddit CAPI skipped: REDDIT_ACCESS_TOKEN or REDDIT_PIXEL_ID not set"
        )
        return False

    user_email = (stored_shop.get("email") or "").strip()
    store_domain = (
        stored_shop.get("store_url")
        or ""
    )
    if isinstance(store_domain, str) and store_domain.startswith("https://"):
        store_domain = store_domain.replace("https://", "", 1).split("/")[0]
    store_domain = (store_domain or "").strip()

    phone = stored_shop.get("phone", None)
    if phone is not None and not isinstance(phone, str):
        phone = str(phone).strip() or None
    elif isinstance(phone, str):
        phone = phone.strip() or None

    event_time = _get_iso_time()
    hashed_email = _sha256_hash(user_email)
    hashed_phone = _sha256_hash(phone) if phone else None

    conversion_id = _generate_conversion_id(
        event_at=event_time,
        tracking_type=REDDIT_SIGNUP_EVENT_TYPE,
        store_url=store_domain,
    )

    user_payload = {"email": hashed_email}
    if hashed_phone:
        user_payload["phone_number"] = hashed_phone

    payload = {
        # "test_id":"t2_1r4lhmps6v",
        "events": [
            {
                "event_at": event_time,
                "event_type": {"tracking_type": REDDIT_SIGNUP_EVENT_TYPE},
                "user": user_payload,
                "event_metadata": {"conversion_id": conversion_id},
            }
        ]
    }
    print("payload", payload)

    url = f"https://ads-api.reddit.com/api/v2.0/conversions/events/{pixel_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            url, headers=headers, data=json.dumps(payload), timeout=10
        )
        if response.status_code == 200:
            logger.info(
                "Reddit SignUp conversion event sent for store_domain=%s",
                store_domain or "(unknown)",
            )
            return True
        logger.warning(
            "Reddit CAPI returned status %s: %s",
            response.status_code,
            response.text[:500],
        )
        return False
    except requests.RequestException as e:
        logger.warning("Reddit CAPI request failed: %s", e, exc_info=True)
        return False
