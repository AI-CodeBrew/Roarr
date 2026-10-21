"""
Debug Routes: API endpoints for debugging webhook functionality
"""
from flask import Blueprint, request, jsonify
import os
import logging
from ..auth.utils import require_auth
from ..database import document_store

logger = logging.getLogger(__name__)

# Create Blueprint for debug routes
debug_bp = Blueprint('debug', __name__)

@debug_bp.route('/api/debug/remove-old-webhook', methods=['POST'])
@require_auth
def debug_remove_old_webhook():
    """
    Debug endpoint to remove old webhook and register new one
    """
    try:
        data = request.get_json()
        shop_url = data.get('shop_url')
        access_token = data.get('access_token')
        
        if not shop_url or not access_token:
            return jsonify({
                'success': False,
                'error': 'shop_url and access_token are required'
            }), 400
        
        from ..shopify.shopify_auth.webhook_utils import webhook_manager
        
        logger.info(f"Removing old webhook and registering new one for: {shop_url}")
        
        # Remove old webhook
        old_webhook_endpoint = f"{webhook_manager.base_url}/api/webhook/shopify/app-subscriptions-update"
        remove_result = webhook_manager.remove_app_subscriptions_webhook(shop_url, access_token, old_webhook_endpoint)
        
        logger.info(f"Remove old webhook result: {remove_result}")
        
        # Register new webhook
        webhook_result = webhook_manager.ensure_subscription_webhook_registered(shop_url, access_token)
        
        logger.info(f"Register new webhook result: {webhook_result}")
        
        return jsonify({
            'success': True,
            'remove_result': remove_result,
            'register_result': webhook_result,
            'shop_url': shop_url,
            'old_endpoint': old_webhook_endpoint,
            'new_endpoint': webhook_manager.webhook_endpoint
        }), 200
        
    except Exception as e:
        logger.error(f"Error in debug remove old webhook: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@debug_bp.route('/api/debug/register-webhook', methods=['POST'])
@require_auth
def debug_register_webhook():
    """
    Debug endpoint to manually register subscription webhook for a store
    """
    try:
        data = request.get_json()
        shop_url = data.get('shop_url')
        access_token = data.get('access_token')
        
        if not shop_url or not access_token:
            return jsonify({
                'success': False,
                'error': 'shop_url and access_token are required'
            }), 400
        
        from ..shopify.shopify_auth.webhook_utils import webhook_manager
        
        logger.info(f"Manual webhook registration for: {shop_url}")
        logger.info(f"Webhook endpoint: {webhook_manager.webhook_endpoint}")
        logger.info(f"Base URL: {webhook_manager.base_url}")
        
        # Register subscription webhook
        webhook_result = webhook_manager.ensure_subscription_webhook_registered(shop_url, access_token)
        
        logger.info(f"Subscription webhook registration result: {webhook_result}")
        
        # Register add-on webhook
        addon_webhook_result = webhook_manager.ensure_addon_webhook_registered(shop_url, access_token)
        
        logger.info(f"Add-on webhook registration result: {addon_webhook_result}")
        
        return jsonify({
            'success': True,
            'subscription_webhook_result': webhook_result,
            'addon_webhook_result': addon_webhook_result,
            'shop_url': shop_url,
            'subscription_webhook_endpoint': webhook_manager.webhook_endpoint,
            'addon_webhook_endpoint': webhook_manager.addon_webhook_endpoint
        }), 200
        
    except Exception as e:
        logger.error(f"Error in debug register webhook: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@debug_bp.route('/api/debug/webhook-endpoint', methods=['GET'])
def debug_webhook_endpoint():
    """
    Debug endpoint to check webhook endpoint configuration and accessibility
    """
    try:
        from ..shopify.shopify_auth.webhook_utils import webhook_manager
        
        endpoint_info = {
            'webhook_endpoint_url': os.getenv('WEBHOOK_ENDPOINT_URL', 'NOT_SET'),
            'base_url': os.getenv('BASE_URL', 'NOT_SET'),
            'webhook_endpoint': webhook_manager.webhook_endpoint,
            'environment': os.getenv('ENVIRONMENT', 'development'),
            'frontend_url': os.getenv('FRONTEND_URL', 'NOT_SET')
        }
        
        # Test if the webhook endpoint is accessible
        try:
            import requests
            response = requests.get(webhook_manager.webhook_endpoint, timeout=10)
            endpoint_info['endpoint_accessible'] = True
            endpoint_info['endpoint_status_code'] = response.status_code
        except Exception as e:
            endpoint_info['endpoint_accessible'] = False
            endpoint_info['endpoint_error'] = str(e)
        
        return jsonify({
            'success': True,
            'endpoint_info': endpoint_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error in debug webhook endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@debug_bp.route('/api/debug/check-webhooks', methods=['GET'])
@require_auth
def debug_check_webhooks():
    """
    Debug endpoint to check webhook registration for user's stores
    """
    try:
        user_id = request.user_id
        
        # Get user's stores
        stores = document_store.get_user_stores(user_id)
        if not stores:
            return jsonify({
                'success': False,
                'error': 'No stores found for user'
            }), 400
        
        results = []
        
        for store in stores:
            store_url = store.get('store_url')
            access_token = store.get('access_token')
            store_id = store.get('PK')
            
            if not store_url or not access_token:
                results.append({
                    'store_id': store_id,
                    'store_url': store_url,
                    'error': 'Missing credentials'
                })
                continue
            
            try:
                from ..shopify.shopify_auth.webhook_utils import webhook_manager
                
                # List existing webhooks
                webhooks = webhook_manager.list_webhooks(store_url, access_token)
                
                # Check for subscription webhook
                subscription_webhook = None
                for webhook in webhooks:
                    if webhook.get('topic') == 'app_subscriptions/update':
                        subscription_webhook = webhook
                        break
                
                # Try to ensure webhook is registered
                ensure_result = webhook_manager.ensure_subscription_webhook_registered(store_url, access_token)
                
                results.append({
                    'store_id': store_id,
                    'store_url': store_url,
                    'total_webhooks': len(webhooks),
                    'subscription_webhook': subscription_webhook,
                    'ensure_result': ensure_result,
                    'all_webhooks': webhooks
                })
                
            except Exception as e:
                results.append({
                    'store_id': store_id,
                    'store_url': store_url,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'stores_count': len(stores),
            'results': results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in debug check webhooks: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@debug_bp.route('/api/debug/webhook-test', methods=['POST'])
def debug_webhook_test():
    """
    Debug endpoint to test webhook processing with sample data
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No test data provided'
            }), 400
        
        # Simulate webhook payload
        webhook_data = data.get('webhook_data', {
            'id': '12345',
            'admin_graphql_api_shop_id': '67890',
            'status': 'active',
            'name': 'Basic Plan (Monthly)',
            'price': '1.00',
            'currency': 'USD',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        })
        
        logger.info("=" * 50)
        logger.info("DEBUG WEBHOOK TEST")
        logger.info("=" * 50)
        logger.info(f"Test webhook data: {webhook_data}")
        
        # Test the webhook processing logic
        subscription_id = webhook_data.get('id')
        admin_graphql_api_shop_id = webhook_data.get('admin_graphql_api_shop_id')
        status = webhook_data.get('status')
        name = webhook_data.get('name')
        
        logger.info(f"Processing test subscription: {subscription_id}")
        logger.info(f"Shop ID: {admin_graphql_api_shop_id}")
        logger.info(f"Status: {status}")
        logger.info(f"Name: {name}")
        
        # Test store lookup
        target_store = None
        if admin_graphql_api_shop_id:
            target_store = document_store.get_store_by_shop_id(admin_graphql_api_shop_id)
            if target_store:
                logger.info(f"Found store: {target_store.get('store_url')} -> User: {target_store.get('fk_user_id')}")
            else:
                logger.warning(f"No store found with shop_id: {admin_graphql_api_shop_id}")
        
        # Test subscription transaction creation
        test_user_id = "test_user_123"
        transaction_data = document_store.create_subscription_transaction(
            subscription_id=subscription_id,
            fk_user_id=test_user_id,
            shopify_payload=webhook_data
        )
        
        logger.info(f"Created test transaction: {transaction_data}")
        
        # Test plan update
        if name and status:
            plan_update_success = document_store.update_user_plan_from_webhook(
                test_user_id, name, status
            )
            logger.info(f"Plan update result: {plan_update_success}")
        
        logger.info("=" * 50)
        logger.info("DEBUG TEST COMPLETED")
        logger.info("=" * 50)
        
        return jsonify({
            'success': True,
            'message': 'Debug test completed',
            'webhook_data': webhook_data,
            'store_found': target_store is not None,
            'transaction_created': transaction_data is not None
        }), 200
        
    except Exception as e:
        logger.error(f"Error in debug webhook test: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

