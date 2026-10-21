"""
Emagen Routes: API endpoints for Emagen product visualization
"""
from flask import Blueprint, request, jsonify
import json
import asyncio
import logging
from ..auth.utils import verify_token

logger = logging.getLogger(__name__)

# Create Blueprint for emagen routes
emagen_bp = Blueprint('emagen', __name__)

@emagen_bp.route('/api/emagen/generate', methods=['POST'])
def generate_emagen_shotpack():
    """Generate Emagen photoshoot based on user selections"""
    try:
        # Handle auth token from form data (for CORS compatibility)
        auth_token = request.form.get('auth_token')
        if not auth_token:
            return jsonify({
                'success': False,
                'error': 'No authorization token provided'
            }), 401
        
        # Verify the token manually
        try:
            user_attributes = verify_token(auth_token)
            user_id = user_attributes.get('sub')
            if not user_id:
                raise ValueError("Invalid token")
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Invalid authorization token: {str(e)}'
            }), 401
        
        # Get form data
        data_str = request.form.get('data')
        if not data_str:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        try:
            data = json.loads(data_str)
        except json.JSONDecodeError as e:
            return jsonify({
                'success': False,
                'error': f'Invalid JSON data: {str(e)}'
            }), 400
        
        # Extract required parameters
        product_type = data.get('product_type')
        display_type = data.get('display_type')
        identity_option = data.get('identity_option')
        recipe = data.get('recipe')
        garment_type = data.get('garment_type')
        
        # Validate required parameters
        required_params = ['product_type', 'display_type', 'identity_option', 'recipe', 'garment_type']
        missing_params = [param for param in required_params if not data.get(param)]
        if missing_params:
            return jsonify({
                'success': False,
                'error': f'Missing required parameters: {", ".join(missing_params)}'
            }), 400
        
        # Get uploaded files
        if 'product_image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Missing required file: product_image'
            }), 400
        
        product_file = request.files['product_image']
        if product_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Product image file must be selected'
            }), 400
        
        # Read product image
        product_bytes = product_file.read()
        
        # Handle identity data based on option
        identity_data = None
        if identity_option == 'uploaded':
            if 'identity_image' not in request.files:
                return jsonify({
                    'success': False,
                    'error': 'Missing required file: identity_image for uploaded option'
                }), 400
            
            identity_file = request.files['identity_image']
            if identity_file.filename == '':
                return jsonify({
                    'success': False,
                    'error': 'Identity image file must be selected'
                }), 400
            
            identity_data = identity_file.read()
            
        elif identity_option == 'form_selected':
            # For form-selected identity, we expect identity data in JSON
            identity_data = data.get('identity_data')
            if not identity_data:
                return jsonify({
                    'success': False,
                    'error': 'Missing identity_data for form_selected option'
                }), 400
        
        # Import Emagen router
        from .utils import generate_emagen_shotpack as emagen_generate
        
        # Run async generation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(emagen_generate(
                product_type=product_type,
                display_type=display_type,
                identity_option=identity_option,
                recipe=recipe,
                garment_type=garment_type,
                product_bytes=product_bytes,
                identity_data=identity_data
            ))
            
            return jsonify({
                'success': True,
                'data': result,
                'message': 'Emagen photoshoot generated successfully'
            })
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Error in generate_emagen_shotpack: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

