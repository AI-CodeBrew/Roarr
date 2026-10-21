"""
Events Routes: API endpoints for SSE and event streaming
"""
from flask import Blueprint, request, jsonify, Response, stream_with_context
import logging
from .service import EventsService
from ..auth.utils import require_auth

logger = logging.getLogger(__name__)

# Create Blueprint for events routes
events_bp = Blueprint('events', __name__)

# Initialize service
events_service = EventsService()

@events_bp.route('/api/sse/init', methods=['POST'])
@require_auth
def init_sse_token():
    """Initialize SSE by issuing a token for the authenticated user"""
    try:
        # Extract token from headers directly
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'No authorization header provided'
            }), 401
        
        # Verify token and get decoded token
        from ..auth.utils import verify_token
        decoded_token = verify_token(auth_header)
        if not decoded_token:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Get user ID from decoded token
        user_id = decoded_token.get('sub')
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Could not extract user ID from token'
            }), 401
        
        # Use service to handle business logic
        result = events_service.init_sse(user_id)
        
        if not result.get('success'):
            return jsonify(result), 500
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error issuing SSE token: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to initialize SSE'
        }), 500

@events_bp.route('/api/shopify/events', methods=['GET'])
def shopify_events():
    """Stream Shopify events via SSE"""
    try:
        token = request.args.get('token')
        user_id = events_service.validate_sse_token(token)
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Create event stream
        headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
        
        return Response(
            stream_with_context(events_service.create_event_stream(user_id)),
            headers=headers
        )
        
    except Exception as e:
        logger.error(f"Error in shopify_events: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to initialize events stream'
        }), 500

