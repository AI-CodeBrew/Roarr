"""
Subscription Service: Business logic for Shopify subscription management
"""
import os
import requests
import logging
from typing import Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class ShopifySubscriptionManager:
    
    def __init__(self):
        self.api_version = "2026-01"
    
    def create_subscription(self, shop_url: str, access_token: str, plan_name: str, 
                          billing_cycle: str = "monthly") -> Dict[str, Any]:
        try:
            from ...constants.subscription_plans import (
                get_plan_price, get_plan_details, is_valid_plan, is_valid_billing_cycle,
                get_addon_details, is_valid_addon, is_addon_purchase
            )
            
            # Check if this is an add-on purchase
            if is_addon_purchase(plan_name):
                return self._create_addon_purchase(shop_url, access_token, plan_name)
            
            # Validate inputs for regular plan subscription
            if not is_valid_plan(plan_name):
                raise ValueError(f"Invalid plan name: {plan_name}")
            
            if not is_valid_billing_cycle(billing_cycle):
                raise ValueError(f"Invalid billing cycle: {billing_cycle}")
            
            # Get plan details
            plan_details = get_plan_details(plan_name)
            price = get_plan_price(plan_name, billing_cycle)
            
            # For enterprise, return contact sales info
            if plan_name.lower() == "enterprise":
                return {
                    'success': True,
                    'requires_contact': True,
                    'message': 'Enterprise plan requires contact with sales team',
                    'contact_email': 'sales@zambeel.ai',
                    'plan_name': plan_details['name']
                }
            
            # Handle yearly billing - Shopify recurring charges are monthly only
            # For yearly plans, we'll use the yearly price but bill monthly
            if billing_cycle.lower() == 'yearly':
                # Use yearly price (which is the discounted monthly rate)
                monthly_price = get_plan_price(plan_name, 'monthly')
                yearly_price = get_plan_price(plan_name, 'yearly')
                discount_percentage = round(((float(monthly_price) - float(yearly_price)) / float(monthly_price)) * 100)
                price = yearly_price  # Use the discounted yearly price
                logger.info(f"Yearly billing requested for {plan_name}: Monthly ${monthly_price}, Yearly ${yearly_price} ({discount_percentage}% discount)")
            
            # Clean shop_url to ensure proper format
            if not shop_url.startswith('https://'):
                shop_url = f"https://{shop_url}"
            
            # Remove .myshopify.com if already present to avoid duplication
            if shop_url.endswith('.myshopify.com'):
                shop_domain = shop_url.replace('https://', '').replace('.myshopify.com', '')
            else:
                shop_domain = shop_url.replace('https://', '')
            
            # Construct the API URL for app subscriptions
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/{self.api_version}/recurring_application_charges.json"
            
            # Create subscription payload
            if billing_cycle.lower() == 'yearly':
                # For yearly billing, use the discounted yearly price
                subscription_name = f"{plan_details['name']} (Yearly - {discount_percentage}% off)"
                subscription_terms = f"Yearly subscription to {plan_details['name']} with {discount_percentage}% discount - {plan_details['description']}. Billed monthly at ${yearly_price}/month (equivalent to ${monthly_price}/month with discount applied)."
            else:
                subscription_name = f"{plan_details['name']} (Monthly)"
                subscription_terms = f"Monthly subscription to {plan_details['name']} - {plan_details['description']}. Billed monthly at ${price}/month."
            
            subscription_data = {
                "recurring_application_charge": {
                    "name": subscription_name,
                    "price": price,
                    "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/dashboard?subscription=success",
                    "test": os.getenv('SHOPIFY_TEST_MODE', 'false').lower() == 'true',
                    "trial_days": 0,  # No free trial
                    "capped_amount": "100.00" if plan_name.lower() == "pro" else None,  # Usage-based billing for Pro
                    "terms": subscription_terms
                }
            }
            
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Creating subscription for {shop_domain}: {plan_details['name']} - ${price}/{billing_cycle}")
            logger.info(f"Subscription data: {subscription_data}")
            
            response = requests.post(
                api_url,
                json=subscription_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                subscription_info = response.json()
                subscription = subscription_info['recurring_application_charge']
                
                logger.info(f"Successfully created subscription for {shop_domain}")
                return {
                    'success': True,
                    'subscription_id': subscription['id'],
                    'confirmation_url': subscription['confirmation_url'],
                    'plan_name': plan_details['name'],
                    'price': price,
                    'billing_cycle': billing_cycle,
                    'shop_domain': shop_domain
                }
            else:
                logger.error(f"Failed to create subscription for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error creating subscription for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }
    
    def _create_addon_purchase(self, shop_url: str, access_token: str, addon_name: str) -> Dict[str, Any]:
        """
        Create an add-on purchase (one-time charge) that doesn't cancel existing subscriptions
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            addon_name: Add-on name (single_page, extra_pages_5, etc.)
            
        Returns:
            Dict with add-on purchase result
        """
        try:
            from ...constants.subscription_plans import get_addon_details, is_valid_addon
            
            # Validate add-on
            if not is_valid_addon(addon_name):
                raise ValueError(f"Invalid add-on name: {addon_name}")
            
            # Get add-on details
            addon_details = get_addon_details(addon_name)
            price = addon_details['price']
            
            # Clean shop_url to ensure proper format
            if not shop_url.startswith('https://'):
                shop_url = f"https://{shop_url}"
            
            # Remove .myshopify.com if already present to avoid duplication
            if shop_url.endswith('.myshopify.com'):
                shop_domain = shop_url.replace('https://', '').replace('.myshopify.com', '')
            else:
                shop_domain = shop_url.replace('https://', '')
            
            # Construct the API URL for one-time application charges
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/{self.api_version}/application_charges.json"
            
            # Create one-time charge payload (this doesn't cancel existing subscriptions)
            charge_data = {
                "application_charge": {
                    "name": f"{addon_details['name']} Add-on",
                    "price": price,
                    "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/dashboard?addon=success",
                    "test": os.getenv('SHOPIFY_TEST_MODE', 'false').lower() == 'true',
                    "description": f"{addon_details['description']} - One-time purchase"
                }
            }
            
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Creating add-on purchase for {shop_domain}: {addon_details['name']} - ${price}")
            logger.info(f"Add-on data: {charge_data}")
            
            response = requests.post(
                api_url,
                json=charge_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                charge_info = response.json()
                charge = charge_info['application_charge']
                
                logger.info(f"Successfully created add-on purchase for {shop_domain}")
                return {
                    'success': True,
                    'charge_id': charge['id'],
                    'confirmation_url': charge['confirmation_url'],
                    'addon_name': addon_details['name'],
                    'price': price,
                    'pages_added': addon_details['pages_added'],
                    'shop_domain': shop_domain,
                    'is_addon': True
                }
            else:
                logger.error(f"Failed to create add-on purchase for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error creating add-on purchase for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }
    
    def get_subscription_status(self, shop_url: str, access_token: str, subscription_id: str) -> Dict[str, Any]:
        """
        Get the status of a specific subscription
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            subscription_id: Subscription ID to check
            
        Returns:
            Dict with subscription status
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
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/{self.api_version}/recurring_application_charges/{subscription_id}.json"
            
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            response = requests.get(api_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                subscription_info = response.json()
                subscription = subscription_info['recurring_application_charge']
                
                return {
                    'success': True,
                    'subscription': subscription,
                    'status': subscription.get('status'),
                    'name': subscription.get('name'),
                    'price': subscription.get('price'),
                    'created_at': subscription.get('created_at'),
                    'updated_at': subscription.get('updated_at')
                }
            else:
                logger.error(f"Failed to get subscription status for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error getting subscription status for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }
    
    def cancel_subscription(self, shop_url: str, access_token: str, subscription_id: str) -> Dict[str, Any]:
        """
        Cancel a subscription
        
        Args:
            shop_url: Shopify store URL
            access_token: Shopify access token
            subscription_id: Subscription ID to cancel
            
        Returns:
            Dict with cancellation result
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
            api_url = f"https://{shop_domain}.myshopify.com/admin/api/{self.api_version}/recurring_application_charges/{subscription_id}.json"
            
            headers = {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json'
            }
            
            # Delete the subscription
            response = requests.delete(api_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                logger.info(f"Successfully cancelled subscription {subscription_id} for {shop_domain}")
                return {
                    'success': True,
                    'message': 'Subscription cancelled successfully',
                    'shop_domain': shop_domain
                }
            else:
                logger.error(f"Failed to cancel subscription for {shop_domain}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'shop_domain': shop_domain
                }
                
        except Exception as e:
            logger.error(f"Error cancelling subscription for {shop_url}: {e}")
            return {
                'success': False,
                'error': str(e),
                'shop_domain': shop_domain if 'shop_domain' in locals() else shop_url
            }

# Create a global instance
subscription_manager = ShopifySubscriptionManager()

