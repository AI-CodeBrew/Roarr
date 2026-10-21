"""
Events Service: Business logic for SSE and event streaming
"""
import logging
import json
import time
from queue import Empty
from flask import Response, stream_with_context
from .utils import (
    subscribe_user_events,
    unsubscribe_user_events,
    issue_sse_token,
    consume_sse_token,
    get_sse_token_ttl
)

logger = logging.getLogger(__name__)

class EventsService:
    """Service class for event streaming operations"""
    
    @staticmethod
    def init_sse(user_id: str):
        """
        Initialize SSE for a user by issuing a token.
        
        Args:
            user_id: The user's Cognito ID
            
        Returns:
            dict: Response with success status, token, and TTL
        """
        try:
            token = issue_sse_token(user_id)
            return {
                'success': True,
                'token': token,
                'ttl': get_sse_token_ttl()
            }
        except Exception as e:
            logger.error(f"Error issuing SSE token: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to initialize SSE'
            }
    
    @staticmethod
    def create_event_stream(user_id: str):
        """
        Create an SSE event stream for a user.
        
        Args:
            user_id: The user's Cognito ID
            
        Yields:
            str: SSE formatted event data
        """
        q = subscribe_user_events(user_id)
        try:
            # Initial hello to establish stream
            yield f"event: ping\ndata: {json.dumps({'ts': int(time.time())})}\n\n"
            last_heartbeat = time.time()
            
            while True:
                try:
                    item = q.get(timeout=5)
                    yield f"data: {json.dumps(item)}\n\n"
                except Empty:
                    # Heartbeat every 25s
                    if time.time() - last_heartbeat > 25:
                        yield f"event: ping\ndata: {json.dumps({'ts': int(time.time())})}\n\n"
                        last_heartbeat = time.time()
                    continue
        finally:
            unsubscribe_user_events(user_id, q)
    
    @staticmethod
    def validate_sse_token(token: str):
        """
        Validate an SSE token and return the user ID.
        
        Args:
            token: The SSE token to validate
            
        Returns:
            str: User ID if token is valid, None otherwise
        """
        if not token:
            return None
        return consume_sse_token(token)

