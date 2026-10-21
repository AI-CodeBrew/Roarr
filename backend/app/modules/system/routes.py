"""
System Routes: Health check and feedback endpoints
"""
from flask import Blueprint, request, jsonify
import os
import requests
import logging
from ..auth.utils import require_auth

logger = logging.getLogger(__name__)

# Create Blueprint for system routes
system_bp = Blueprint('system', __name__)

@system_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for the API"""
    try:
        return jsonify({
            'status': 'healthy',
            'message': 'Backend is running successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@system_bp.route('/api/feedback', methods=['POST'])
@require_auth
def submit_feedback():
    """Submit user feedback to Slack"""
    try:
        # Extract user_id from request (set by require_auth decorator)
        user_id = getattr(request, 'user_id', None)
        data = request.get_json()
        
        if not data or 'feedback' not in data:
            return jsonify({
                'success': False,
                'error': 'Feedback content is required'
            }), 400
        
        feedback_content = data['feedback'].strip()
        if not feedback_content:
            return jsonify({
                'success': False,
                'error': 'Feedback content cannot be empty'
            }), 400
        
        user_email = data.get('user_email', 'Unknown User')
        
        structured_message = {
            'text': f"*Feedback from {user_email}:*\n{feedback_content}"
        }
        
        slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        if not slack_webhook_url:
            return jsonify({
                'success': False,
                'error': 'Slack webhook URL not configured'
            }), 500
        
        response = requests.post(
            slack_webhook_url,
            json=structured_message,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Feedback submitted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to send feedback to Slack'
            }), 500
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': 'Network error while sending feedback'
        }), 500
    except Exception as e:
        logger.error(f"Error in submit_feedback: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

