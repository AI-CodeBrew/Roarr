"""
Auth Routes: API endpoints for authentication and user management
"""
from flask import Blueprint, request, jsonify
import logging
from .utils import require_auth, extract_user_attributes, verify_token
from .service import AuthService

logger = logging.getLogger(__name__)

# Create Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

# Initialize service
auth_service = AuthService()

@auth_bp.route('/api/assign-user-id', methods=['POST'])
@require_auth
def assign_user_id():
    """Assign Cognito user ID as the only user identifier and create user profile if not exists."""
    try:
        # Extract token from headers directly
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'No authorization header provided'
            }), 401
        
        # Verify token and get decoded token
        decoded_token = verify_token(auth_header)
        if not decoded_token:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Extract user attributes from decoded token
        user_info = extract_user_attributes(decoded_token)
        
        # Try multiple ways to get the Cognito user ID
        cognito_user_id = (
            user_info.get('sub') or 
            decoded_token.get('sub') or 
            decoded_token.get('cognito:username') or
            getattr(request, 'user_id', None)
        )
        
        if not cognito_user_id:
            logger.error(f"Could not extract user ID. Decoded token: {decoded_token}")
            logger.error(f"User info: {user_info}")
            return jsonify({
                'success': False,
                'error': 'Could not extract Cognito user ID from token'
            }), 400
        
        # Use service to handle business logic
        result = auth_service.assign_user_id(user_info)
        
        if not result.get('success'):
            status_code = 500 if 'error' in result else 200
            return jsonify(result), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in assign_user_id route: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    """Logout endpoint"""
    try:
        # Extract token from headers directly
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'No authorization header provided'
            }), 401
        
        # Verify token and get decoded token
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
        result = auth_service.logout(user_id)
        
        if not result.get('success'):
            return jsonify(result), 500
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

