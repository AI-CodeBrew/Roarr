"""
Subscription Routes: API endpoints for subscription management
"""
from flask import Blueprint, request, jsonify
import logging
from .service import subscription_manager
from ..auth.utils import require_auth
from ..database import document_store

logger = logging.getLogger(__name__)

# Create Blueprint for subscription routes
subscription_bp = Blueprint('subscription', __name__)

@subscription_bp.route('/api/user-subscription', methods=['GET'])
@require_auth
def get_user_subscription():
    """Get user's current subscription plan from user_subscription_transaction table"""
    try:
        user_id = request.user_id
        logger.info(f"Getting subscription plan for user: {user_id}")
        
        # Get user from DynamoDB
        user = document_store.get_user_by_cognito_id(user_id)
        if not user:
            logger.warning(f"User not found for cognito_id: {user_id}")
            return jsonify({
                'success': False,
                'error': 'User not found. Please authenticate again.'
            }), 404
        
        # Get current active subscription from user_subscription_transaction table
        current_subscription = document_store.get_user_current_subscription(user_id)
        
        if current_subscription:
            # Extract subscription details from transaction data
            subscription_name = current_subscription.get('name', 'Free Plan')
            subscription_status = current_subscription.get('status', 'inactive')
            subscription_price = current_subscription.get('price', '0.00')
            subscription_currency = current_subscription.get('currency', 'USD')
            created_at = current_subscription.get('created_at')
            updated_at = current_subscription.get('updated_at')
            
            # Map subscription name to plan identifier
            subscription_plan = document_store.map_subscription_name_to_plan(subscription_name)
            
            # Get plan details from subscription plans for features and limits
            from ...constants.subscription_plans import SUBSCRIPTION_PLANS, DEFAULT_PLAN
            plan_details = SUBSCRIPTION_PLANS.get(subscription_plan, SUBSCRIPTION_PLANS[DEFAULT_PLAN])
            
            # Get add-on purchases and calculate total pages
            addon_purchases = document_store.get_user_addon_purchases(user_id)
            total_addon_pages = document_store.get_user_total_addon_pages(user_id)
            base_max_pages = plan_details.get('max_pages', 1)
            total_max_pages = base_max_pages + total_addon_pages
            
            return jsonify({
                'success': True,
                'subscription_plan': subscription_plan,
                'plan_name': subscription_name,
                'max_pages': total_max_pages,
                'base_max_pages': base_max_pages,
                'addon_pages': total_addon_pages,
                'addon_purchases': addon_purchases,
                'features': plan_details.get('features', []),
                'subscription_status': subscription_status,
                'subscription_price': subscription_price,
                'subscription_currency': subscription_currency,
                'created_at': created_at,
                'updated_at': updated_at,
                'has_active_subscription': subscription_status.upper() == 'ACTIVE'
            }), 200
        else:
            from ...constants.subscription_plans import SUBSCRIPTION_PLANS, DEFAULT_PLAN
            plan_details = SUBSCRIPTION_PLANS[DEFAULT_PLAN]
            
            # Get add-on purchases even for free plan users
            addon_purchases = document_store.get_user_addon_purchases(user_id)
            total_addon_pages = document_store.get_user_total_addon_pages(user_id)
            base_max_pages = plan_details.get('max_pages', 1)
            total_max_pages = base_max_pages + total_addon_pages
            
            return jsonify({
                'success': True,
                'subscription_plan': DEFAULT_PLAN,
                'plan_name': plan_details.get('name', 'Free Plan'),
                'max_pages': total_max_pages,
                'base_max_pages': base_max_pages,
                'addon_pages': total_addon_pages,
                'addon_purchases': addon_purchases,
                'features': plan_details.get('features', []),
                'subscription_status': 'inactive',
                'subscription_price': '0.00',
                'subscription_currency': 'USD',
                'has_active_subscription': False
            }), 200
        
    except Exception as e:
        logger.error(f"Error getting user subscription: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@subscription_bp.route('/api/user/subscription-status', methods=['GET'])
@require_auth
def get_user_subscription_status():
    """
    Get user's current subscription status for UI from user_subscription_transaction table
    """
    try:
        user_id = request.user_id
        
        # Check subscription status and expiry
        subscription_info = document_store.check_subscription_expiry(user_id)
        
        # Get current active subscription from user_subscription_transaction table
        current_subscription = document_store.get_user_current_subscription(user_id)
        
        if current_subscription:
            # Extract subscription details from transaction data
            subscription_name = current_subscription.get('name', 'Free Plan')
            subscription_status = current_subscription.get('status', 'inactive')
            
            # Map subscription name to plan identifier
            current_plan = document_store.map_subscription_name_to_plan(subscription_name)
            
            return jsonify({
                'success': True,
                'has_active_subscription': subscription_info['has_active_subscription'],
                'is_expired': subscription_info['is_expired'],
                'current_plan': current_plan,
                'subscription': subscription_info['subscription'],
                'expiry_date': subscription_info.get('expiry_date'),
                'subscription_name': subscription_name,
                'subscription_status': subscription_status
            }), 200
        else:
            # No active subscription found, return free plan
            from ...constants.subscription_plans import DEFAULT_PLAN
            
            return jsonify({
                'success': True,
                'has_active_subscription': False,
                'is_expired': False,
                'current_plan': DEFAULT_PLAN,
                'subscription': None,
                'expiry_date': None,
                'subscription_name': 'Free Plan',
                'subscription_status': 'inactive'
            }), 200
        
    except Exception as e:
        logger.error(f"Error getting user subscription status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@subscription_bp.route('/api/create-subscription', methods=['POST'])
@require_auth
def create_subscription():
    """
    Create a Shopify subscription for the user
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        plan_name = data.get('plan_name')
        billing_cycle = data.get('billing_cycle', 'monthly')
        
        if not plan_name:
            return jsonify({
                'success': False,
                'error': 'plan_name is required'
            }), 400
        
        user_id = request.user_id
        
        # Get user's Shopify credentials (always returns first store for subscription purposes)
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return jsonify({
                'success': False,
                'error': 'No Shopify store connected. Please connect your store first.'
            }), 400
        
        shop_url = shopify_credentials.get('shop_url')
        access_token = shopify_credentials.get('access_token')
        store_id = shopify_credentials.get('store_id')
        
        if not shop_url or not access_token:
            return jsonify({
                'success': False,
                'error': 'Invalid Shopify credentials'
            }), 400
        
        # Log which store is being used for subscription
        logger.info(f"Creating subscription for user {user_id} using store: {shop_url} (store_id: {store_id})")
        
        # Create subscription using Shopify API
        result = subscription_manager.create_subscription(
            shop_url=shop_url,
            access_token=access_token,
            plan_name=plan_name,
            billing_cycle=billing_cycle
        )
        
        if result['success']:
            if result.get('requires_contact'):
                return jsonify({
                    'success': True,
                    'requires_contact': True,
                    'message': result['message'],
                    'contact_email': result['contact_email'],
                    'plan_name': result['plan_name']
                }), 200
            else:
                return jsonify({
                    'success': True,
                    'subscription_id': result['subscription_id'],
                    'confirmation_url': result['confirmation_url'],
                    'plan_name': result['plan_name'],
                    'price': result['price'],
                    'billing_cycle': result['billing_cycle']
                }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to create subscription')
            }), 500
            
    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@subscription_bp.route('/api/purchase-addon', methods=['POST'])
@require_auth
def purchase_addon():
    """
    Purchase an add-on without canceling existing subscription
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        addon_name = data.get('addon_name')
        
        if not addon_name:
            return jsonify({
                'success': False,
                'error': 'addon_name is required'
            }), 400
        
        user_id = request.user_id
        
        # Get user's Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return jsonify({
                'success': False,
                'error': 'No Shopify store connected. Please connect your store first.'
            }), 400
        
        shop_url = shopify_credentials.get('shop_url')
        access_token = shopify_credentials.get('access_token')
        store_id = shopify_credentials.get('store_id')
        
        if not shop_url or not access_token:
            return jsonify({
                'success': False,
                'error': 'Invalid Shopify credentials'
            }), 400
        
        # Log which store is being used for add-on purchase
        logger.info(f"Purchasing add-on for user {user_id} using store: {shop_url} (store_id: {store_id})")
        
        # Create add-on purchase using Shopify API
        result = subscription_manager.create_subscription(
            shop_url=shop_url,
            access_token=access_token,
            plan_name=addon_name,  # This will be detected as add-on
            billing_cycle="monthly"  # Not used for add-ons but required by the method
        )
        
        if result['success']:
            # Store the charge ID for webhook tracking
            # This allows us to track which user made the purchase when webhook is received
            try:
                from ...constants.subscription_plans import get_addon_details
                addon_details = get_addon_details(addon_name)
                
                # Store pending add-on purchase for webhook tracking
                document_store.create_addon_purchase(
                    charge_id=result['charge_id'],
                    fk_user_id=user_id,
                    addon_name=addon_details['name'],
                    price=result['price'],
                    pages_added=result['pages_added'],
                    shopify_payload={
                        'id': result['charge_id'],
                        'status': 'pending',
                        'name': result['addon_name'],
                        'price': result['price'],
                        'currency': 'USD',
                        'created_at': None,
                        'updated_at': None
                    }
                )
                logger.info(f"Stored pending add-on purchase for user {user_id}: {result['charge_id']}")
            except Exception as e:
                logger.error(f"Error storing add-on purchase tracking: {e}")
                # Continue with the response even if tracking fails
            
            return jsonify({
                'success': True,
                'charge_id': result['charge_id'],
                'confirmation_url': result['confirmation_url'],
                'addon_name': result['addon_name'],
                'price': result['price'],
                'pages_added': result['pages_added'],
                'is_addon': True
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to create add-on purchase')
            }), 500
            
    except Exception as e:
        logger.error(f"Error purchasing add-on: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@subscription_bp.route('/api/subscription-status/<subscription_id>', methods=['GET'])
@require_auth
def get_subscription_status(subscription_id):
    """
    Get the status of a specific subscription
    """
    try:
        user_id = request.user_id
        
        # Get user's Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return jsonify({
                'success': False,
                'error': 'No Shopify store connected'
            }), 400
        
        shop_url = shopify_credentials.get('shop_url')
        access_token = shopify_credentials.get('access_token')
        
        # Get subscription status
        result = subscription_manager.get_subscription_status(
            shop_url=shop_url,
            access_token=access_token,
            subscription_id=subscription_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'subscription': result['subscription'],
                'status': result['status'],
                'name': result['name'],
                'price': result['price']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to get subscription status')
            }), 500
            
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@subscription_bp.route('/api/get-addons', methods=['GET'])
@require_auth
def get_addons():
    """
    Get available add-ons
    """
    try:
        from ...constants.subscription_plans import ADD_ONS
        
        return jsonify({
            'success': True,
            'addons': ADD_ONS
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting add-ons: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

