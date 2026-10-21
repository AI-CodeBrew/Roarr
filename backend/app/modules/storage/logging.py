"""Chat message logging → Bunny (JSON event files)."""
import json
import logging
from datetime import datetime, timezone

from app.clients.bunny_client import bunny_client

logger = logging.getLogger(__name__)


def append_message_event(
    user_id: str,
    thread_id: str,
    role: str,
    content: str,
    model: str | None = None,
    request_id: str | None = None,
    extra: dict | None = None,
) -> None:
    if not bunny_client._configured():
        logger.debug("Bunny not configured — skip chat log")
        return
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "role": role,
        "content": content,
        "model": model,
        "request_id": request_id,
        **(extra or {}),
    }
    event_key = (
        f"{user_id}/chats/{thread_id}/"
        f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')}.json"
    )
    try:
        bunny_client.upload_bytes(
            json.dumps({"event": event}).encode("utf-8"),
            event_key,
            content_type="application/json",
        )
    except Exception as e:
        logger.error("Failed to log chat event to Bunny: %s", e)
