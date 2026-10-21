"""
Shopify Webhook Utils: Utilities for managing Shopify webhooks
"""
import os
import requests
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class ShopifyWebhookManager:
    """Manage Shopify webhook registration and removal"""
    
    def __init__(self):
        # Use the same environment variable as the uninstall webhook
        self.base_url = os.getenv('WEBHOOK_ENDPOINT_URL')
        self.webhook_endpoint = f"{self.base_url}/webhook/shopify/app-subscriptions-update"
        self.addon_webhook_endpoint = f"{self.base_url}/webhook/shopify/app-charges-update"
    
    def register_app_subscriptions_webhook(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """
        Register APP_SUBSCRIPTIONS_UPDATE webhook with Shopify
        
        Args:
            shop_url: Shopify store URL (e.g., https://store.myshopify.com)
            access_token: Shopify access token
            
        Returns:
            Dict with webhook registration result
        """
        try:
            # Clean shop_url to ensure proper format
            if not shop_url.startswith('https://'):
                shop_url = f"https://{shop_url}"
            
            # Remove .myshopify.com if already present to avoid duplication
            if shop_url.endswith('.myshopify.com'):
                shop_domain = shop_url.replace('https://', '').replace('.myshopify.com', '')
            else:
                shop_domain = shop_url.replace('https://', '')
            
            # Construct the API URL
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/2025-04/webhooks.json"
            
            # Webhook payload
            webhook_data = {
                "webhook": {
                    "topic": "app_subscriptions/update",
                    "address": self.webhook_endpoint,
                    "format": "json"
                }
            }
            
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Registering webhook for shop: {shop_domain}")
            logger.info(f"Webhook endpoint: {self.webhook_endpoint}")
            logger.info(f"Base URL from env: {os.getenv('WEBHOOK_ENDPOINT_URL', 'NOT_SET')}")
            logger.info(f"Fallback BASE_URL: {os.getenv('BASE_URL', 'NOT_SET')}")
            logger.info(f"Webhook payload: {webhook_data}")
            
            response = requests.post(
                api_url,
                json=webhook_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                webhook_info = response.json()
                logger.info(f"Successfully registered webhook for {shop_domain}")
                return {
                    'success': True,
                    'webhook_id': webhook_info['webhook']['id'],
                    'webhook_url': webhook_info['webhook']['address'],
                    'shop_domain': shop_domain
                }
            else:
                logger.error(f"Failed to register webhook for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error registering webhook for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }
    
    def remove_app_subscriptions_webhook(self, shop_url: str, access_token: str, webhook_endpoint: str = None) -> Dict[str, Any]:
        """
        Remove APP_SUBSCRIPTIONS_UPDATE webhook from Shopify
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            webhook_endpoint: Optional specific webhook endpoint to remove
            
        Returns:
            Dict with webhook removal result
        """
        try:
            # Clean shop_url to ensure proper format
            if not shop_url.startswith('https://'):
                shop_url = f"https://{shop_url}"
            
            # Remove .myshopify.com if already present to avoid duplication
            if shop_url.endswith('.myshopify.com'):
                shop_domain = shop_url.replace('https://', '').replace('.myshopify.com', '')
            else:
                shop_domain = shop_url.replace('https://', '')
            
            # First, get all webhooks to find the one we want to delete
            list_url = f"https://{shop_domain}.myshopify.com/admin/api/2025-04/webhooks.json"
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Fetching webhooks for shop: {shop_domain}")
            
            response = requests.get(list_url, headers=headers, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch webhooks for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Failed to fetch webhooks: HTTP {response.status_code}",
                    'shop_domain': shop_domain
                }
            
            webhooks = response.json().get('webhooks', [])
            target_webhook = None
            
            # Find the webhook with our endpoint and topic
            target_endpoint = webhook_endpoint or self.webhook_endpoint
            for webhook in webhooks:
                if (webhook.get('topic') == 'app_subscriptions/update' and 
                    webhook.get('address') == target_endpoint):
                    target_webhook = webhook
                    break
            
            if not target_webhook:
                logger.warning(f"No matching webhook found for {shop_domain} with endpoint {target_endpoint}")
                return {
                    'success': True,
                    'message': 'No matching webhook found to remove',
                    'shop_domain': shop_domain
                }
            
            # Delete the webhook
            webhook_id = target_webhook['id']
            delete_url = f"https://{shop_domain}.myshopify.com/admin/api/2025-04/webhooks/{webhook_id}.json"
            
            logger.info(f"Removing webhook {webhook_id} for {shop_domain}")
            
            delete_response = requests.delete(delete_url, headers=headers, timeout=30)
            
            if delete_response.status_code == 200:
                logger.info(f"Successfully removed webhook for {shop_domain}")
                return {
                    'success': True,
                    'webhook_id': webhook_id,
                    'shop_domain': shop_domain
                }
            else:
                logger.error(f"Failed to remove webhook for {shop_domain}: {delete_response.status_code} - {delete_response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {delete_response.status_code}: {delete_response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error removing webhook for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }
    
    def list_webhooks(self, shop_url: str, access_token: str) -> List[Dict[str, Any]]:
        """
        List all webhooks for a Shopify store
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            
        Returns:
            List of webhook information
        """
        try:
            # Clean shop_url to ensure proper format
            if not shop_url.startswith('https://'):
                shop_url = f"https://{shop_url}"
            
            # Remove .myshopify.com if already present to avoid duplication
            if shop_url.endswith('.myshopify.com'):
                shop_domain = shop_url.replace('https://', '').replace('.myshopify.com', '')
            else:
                shop_domain = shop_url.replace('https://', '')
            
            list_url = f"https://{shop_domain}.myshopify.com/admin/api/2025-04/webhooks.json"
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            response = requests.get(list_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json().get('webhooks', [])
            else:
                logger.error(f"Failed to list webhooks for {shop_domain}: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error listing webhooks for {shop_url}: {e}")
            return []

    def ensure_subscription_webhook_registered(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """
        Ensure the APP_SUBSCRIPTIONS_UPDATE webhook is registered for a store
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            
        Returns:
            Dict with registration result
        """
        try:
            # First, check if the webhook is already registered
            existing_webhooks = self.list_webhooks(shop_url, access_token)
            
            logger.info(f"Found {len(existing_webhooks)} existing webhooks for {shop_url}")
            
            # Look for existing subscription webhook
            for webhook in existing_webhooks:
                logger.info(f"Checking webhook: topic={webhook.get('topic')}, address={webhook.get('address')}")
                if (webhook.get('topic') == 'app_subscriptions/update' and 
                    webhook.get('address') == self.webhook_endpoint):
                    logger.info(f"Subscription webhook already registered for {shop_url}")
                    return {
                        'success': True,
                        'message': 'Webhook already registered',
                        'webhook_id': webhook.get('id'),
                        'already_exists': True
                    }
            
            # If not found, register it
            logger.info(f"Subscription webhook not found, registering for {shop_url}")
            logger.info(f"Target webhook endpoint: {self.webhook_endpoint}")
            return self.register_app_subscriptions_webhook(shop_url, access_token)
            
        except Exception as e:
            logger.error(f"Error ensuring subscription webhook for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def register_app_charges_webhook(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """
        Register APP_CHARGES_UPDATE webhook with Shopify for add-on purchases
        
        Args:
            shop_url: Shopify store URL (e.g., https://store.myshopify.com)
            access_token: Shopify access token
            
        Returns:
            Dict with webhook registration result
        """
        try:
            # Clean shop_url to ensure proper format
            if not shop_url.startswith('https://'):
                shop_url = f"https://{shop_url}"
            
            # Remove .myshopify.com if already present to avoid duplication
            if shop_url.endswith('.myshopify.com'):
                shop_domain = shop_url.replace('https://', '').replace('.myshopify.com', '')
            else:
                shop_domain = shop_url.replace('https://', '')
            
            # Construct the API URL
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/2025-04/webhooks.json"
            
            # Webhook payload for application charges
            webhook_data = {
                "webhook": {
                    "topic": "app_charges/update",
                    "address": self.addon_webhook_endpoint,
                    "format": "json"
                }
            }
            
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Registering app charges webhook for {shop_domain}")
            
            response = requests.post(api_url, json=webhook_data, headers=headers, timeout=30)
            
            if response.status_code == 201:
                webhook_info = response.json()
                webhook = webhook_info['webhook']
                
                logger.info(f"Successfully registered app charges webhook for {shop_domain}: {webhook['id']}")
                return {
                    'success': True,
                    'webhook_id': webhook['id'],
                    'topic': webhook['topic'],
                    'address': webhook['address'],
                    'shop_domain': shop_domain
                }
            else:
                logger.error(f"Failed to register app charges webhook for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error registering app charges webhook for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }

    def ensure_addon_webhook_registered(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """
        Ensure the APP_CHARGES_UPDATE webhook is registered for a store
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            
        Returns:
            Dict with registration result
        """
        try:
            # First, check if the webhook is already registered
            existing_webhooks = self.list_webhooks(shop_url, access_token)
            
            logger.info(f"Found {len(existing_webhooks)} existing webhooks for {shop_url}")
            
            # Look for existing add-on webhook
            for webhook in existing_webhooks:
                logger.info(f"Checking webhook: topic={webhook.get('topic')}, address={webhook.get('address')}")
                if (webhook.get('topic') == 'app_charges/update' and 
                    webhook.get('address') == self.addon_webhook_endpoint):
                    logger.info(f"Add-on webhook already registered for {shop_url}")
                    return {
                        'success': True,
                        'message': 'Add-on webhook already registered',
                        'webhook_id': webhook.get('id'),
                        'already_exists': True
                    }
            
            # If not found, register it
            logger.info(f"Add-on webhook not found, registering for {shop_url}")
            logger.info(f"Target add-on webhook endpoint: {self.addon_webhook_endpoint}")
            return self.register_app_charges_webhook(shop_url, access_token)
            
        except Exception as e:
            logger.error(f"Error ensuring add-on webhook for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Create a global instance
webhook_manager = ShopifyWebhookManager()

