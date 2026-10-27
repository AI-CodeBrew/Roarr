"""
Subscription Service: Business logic for Shopify subscription management (Admin GraphQL billing)
"""
import os
import logging
from typing import Dict, Optional, Any
from dotenv import load_dotenv

from ..shopify.graphql_client import (
    gid_to_id,
    normalize_shop_domain,
    raise_on_user_errors,
    shopify_graphql,
    to_gid,
)

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
            
            shop_domain = normalize_shop_domain(shop_url).replace('.myshopify.com', '')

            # Create subscription payload
            if billing_cycle.lower() == 'yearly':
                # For yearly billing, use the discounted yearly price
                subscription_name = f"{plan_details['name']} (Yearly - {discount_percentage}% off)"
                subscription_terms = f"Yearly subscription to {plan_details['name']} with {discount_percentage}% discount - {plan_details['description']}. Billed monthly at ${yearly_price}/month (equivalent to ${monthly_price}/month with discount applied)."
            else:
                subscription_name = f"{plan_details['name']} (Monthly)"
                subscription_terms = f"Monthly subscription to {plan_details['name']} - {plan_details['description']}. Billed monthly at ${price}/month."
            
            is_test = os.getenv('SHOPIFY_TEST_MODE', 'false').lower() == 'true'
            line_items = [
                {
                    "plan": {
                        "appRecurringPricingDetails": {
                            "price": {"amount": str(price), "currencyCode": "USD"},
                            "interval": "EVERY_30_DAYS",
                        }
                    }
                }
            ]
            if plan_name.lower() == "pro":
                # Usage-based billing for Pro
                line_items.append(
                    {
                        "plan": {
                            "appUsagePricingDetails": {
                                "cappedAmount": {"amount": "100.00", "currencyCode": "USD"},
                                "terms": subscription_terms,
                            }
                        }
                    }
                )

            logger.info(f"Creating subscription for {shop_domain}: {plan_details['name']} - ${price}/{billing_cycle}")

            data = shopify_graphql(
                shop_url,
                access_token,
                """
                mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean, $trialDays: Int) {
                  appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test, trialDays: $trialDays) {
                    appSubscription { id status }
                    confirmationUrl
                    userErrors { field message }
                  }
                }
                """,
                {
                    "name": subscription_name,
                    "returnUrl": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/dashboard?subscription=success",
                    "lineItems": line_items,
                    "test": is_test,
                    "trialDays": 0,  # No free trial
                },
            )
            result = data.get("appSubscriptionCreate") or {}
            raise_on_user_errors(result)

            logger.info(f"Successfully created subscription for {shop_domain}")
            return {
                'success': True,
                'subscription_id': gid_to_id((result.get("appSubscription") or {}).get("id")),
                'confirmation_url': result.get("confirmationUrl"),
                'plan_name': plan_details['name'],
                'price': price,
                'billing_cycle': billing_cycle,
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
            
            shop_domain = normalize_shop_domain(shop_url).replace('.myshopify.com', '')

            logger.info(f"Creating add-on purchase for {shop_domain}: {addon_details['name']} - ${price}")

            # One-time charge (this doesn't cancel existing subscriptions)
            data = shopify_graphql(
                shop_url,
                access_token,
                """
                mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
                  appPurchaseOneTimeCreate(name: $name, price: $price, returnUrl: $returnUrl, test: $test) {
                    appPurchaseOneTime { id status }
                    confirmationUrl
                    userErrors { field message }
                  }
                }
                """,
                {
                    "name": f"{addon_details['name']} Add-on",
                    "price": {"amount": str(price), "currencyCode": "USD"},
                    "returnUrl": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/dashboard?addon=success",
                    "test": os.getenv('SHOPIFY_TEST_MODE', 'false').lower() == 'true',
                },
            )
            result = data.get("appPurchaseOneTimeCreate") or {}
            raise_on_user_errors(result)

            logger.info(f"Successfully created add-on purchase for {shop_domain}")
            return {
                'success': True,
                'charge_id': gid_to_id((result.get("appPurchaseOneTime") or {}).get("id")),
                'confirmation_url': result.get("confirmationUrl"),
                'addon_name': addon_details['name'],
                'price': price,
                'pages_added': addon_details['pages_added'],
                'shop_domain': shop_domain,
                'is_addon': True
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
            shop_domain = normalize_shop_domain(shop_url).replace('.myshopify.com', '')

            data = shopify_graphql(
                shop_url,
                access_token,
                """
                query appSubscription($id: ID!) {
                  node(id: $id) {
                    ... on AppSubscription {
                      id
                      name
                      status
                      test
                      createdAt
                      lineItems {
                        plan {
                          pricingDetails {
                            ... on AppRecurringPricing { price { amount currencyCode } }
                          }
                        }
                      }
                    }
                  }
                }
                """,
                {"id": to_gid("AppSubscription", subscription_id)},
            )
            node = data.get("node")
            if not node:
                return {
                    'success': False,
                    'error': 'Subscription not found',
                    'shop_domain': shop_domain
                }

            price = None
            for item in node.get("lineItems") or []:
                details = ((item or {}).get("plan") or {}).get("pricingDetails") or {}
                if details.get("price"):
                    price = details["price"].get("amount")
                    break
            subscription = {
                'id': gid_to_id(node.get("id")),
                'name': node.get("name"),
                'status': (node.get("status") or "").lower(),
                'price': price,
                'created_at': node.get("createdAt"),
                'test': bool(node.get("test")),
            }
            return {
                'success': True,
                'subscription': subscription,
                'status': subscription['status'],
                'name': subscription['name'],
                'price': subscription['price'],
                'created_at': subscription['created_at'],
                'updated_at': None
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
            shop_domain = normalize_shop_domain(shop_url).replace('.myshopify.com', '')

            data = shopify_graphql(
                shop_url,
                access_token,
                """
                mutation appSubscriptionCancel($id: ID!) {
                  appSubscriptionCancel(id: $id) {
                    appSubscription { id status }
                    userErrors { field message }
                  }
                }
                """,
                {"id": to_gid("AppSubscription", subscription_id)},
            )
            raise_on_user_errors(data.get("appSubscriptionCancel"))

            logger.info(f"Successfully cancelled subscription {subscription_id} for {shop_domain}")
            return {
                'success': True,
                'message': 'Subscription cancelled successfully',
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

