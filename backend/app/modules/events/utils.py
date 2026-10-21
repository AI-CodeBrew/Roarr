"""
Events Utils: Helper functions for SSE (Server-Sent Events) and event management
"""
import time
import uuid
import threading
from queue import Queue, Empty

# --- Simple in-memory user event broker for SSE ---
_user_event_subscribers = {}
_user_event_lock = threading.Lock()
_sse_tokens = {}
_sse_tokens_lock = threading.Lock()
_SSE_TOKEN_TTL_SECONDS = 120

def subscribe_user_events(user_id: str) -> Queue:
    """Subscribe a user to receive events via SSE"""
    q = Queue()
    with _user_event_lock:
        if user_id not in _user_event_subscribers:
            _user_event_subscribers[user_id] = []
        _user_event_subscribers[user_id].append(q)
    return q

def unsubscribe_user_events(user_id: str, q: Queue) -> None:
    """Unsubscribe a user from receiving events"""
    with _user_event_lock:
        arr = _user_event_subscribers.get(user_id, [])
        if q in arr:
            arr.remove(q)
        if not arr and user_id in _user_event_subscribers:
            _user_event_subscribers.pop(user_id, None)

def publish_user_event(user_id: str, event: dict) -> None:
    """Publish an event to all subscribers for a user"""
    with _user_event_lock:
        arr = list(_user_event_subscribers.get(user_id, []))
    for q in arr:
        try:
            q.put_nowait(event)
        except Exception:
            pass

def cleanup_expired_sse_tokens() -> None:
    """Remove expired SSE tokens"""
    now = int(time.time())
    with _sse_tokens_lock:
        expired = [t for t, meta in _sse_tokens.items() if meta.get('exp', 0) <= now]
        for t in expired:
            _sse_tokens.pop(t, None)

def issue_sse_token(user_id: str) -> str:
    """Issue a new SSE token for a user"""
    token = str(uuid.uuid4())
    exp = int(time.time()) + _SSE_TOKEN_TTL_SECONDS
    with _sse_tokens_lock:
        _sse_tokens[token] = {'uid': user_id, 'exp': exp}
    return token

def consume_sse_token(token: str) -> str:
    """Consume an SSE token and return the user ID if valid"""
    cleanup_expired_sse_tokens()
    with _sse_tokens_lock:
        meta = _sse_tokens.pop(token, None)
    if not meta:
        return None
    if meta.get('exp', 0) < int(time.time()):
        return None
    return meta.get('uid')

def get_sse_token_ttl() -> int:
    """Get the TTL for SSE tokens in seconds"""
    return _SSE_TOKEN_TTL_SECONDS

