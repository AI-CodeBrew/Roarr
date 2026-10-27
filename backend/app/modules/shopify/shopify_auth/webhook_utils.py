"""
Shopify Webhook Utils: Utilities for managing Shopify webhooks (Admin GraphQL API).
"""
import os
import logging
from typing import Dict, List, Any
from dotenv import load_dotenv

from ..graphql_client import (
    ShopifyGraphQLError,
    gid_to_id,
    normalize_shop_domain,
    raise_on_user_errors,
    shopify_graphql,
    to_gid,
)

load_dotenv()
logger = logging.getLogger(__name__)

SUBSCRIPTION_TOPIC = "app_subscriptions/update"
# One-time purchase (credit pack) updates. Shopify's current topic for application charges.
ADDON_TOPIC = "app_purchases_one_time/update"

_WEBHOOK_FIELDS = "id topic uri"


def _topic_to_enum(topic: str) -> str:
    """'app_subscriptions/update' -> 'APP_SUBSCRIPTIONS_UPDATE'."""
    return topic.replace("/", "_").upper()


def _topic_from_enum(enum_value: str) -> str:
    """'APP_SUBSCRIPTIONS_UPDATE' -> 'app_subscriptions/update'."""
    head, _, tail = (enum_value or "").lower().rpartition("_")
    return f"{head}/{tail}" if head else enum_value.lower()


def _flatten(node: Dict[str, Any]) -> Dict[str, Any]:
    """GraphQL webhook node -> the {id, topic, address} shape callers already use."""
    return {
        "id": gid_to_id(node.get("id")),
        "gid": node.get("id"),
        "topic": _topic_from_enum(node.get("topic", "")),
        "address": node.get("uri"),
    }


class ShopifyWebhookManager:
    """Manage Shopify webhook registration and removal"""

    def __init__(self):
        # Use the same environment variable as the uninstall webhook
        self.base_url = os.getenv('WEBHOOK_ENDPOINT_URL')
        self.webhook_endpoint = f"{self.base_url}/webhook/shopify/app-subscriptions-update"
        self.addon_webhook_endpoint = f"{self.base_url}/webhook/shopify/app-charges-update"

    def _register(self, shop_url: str, access_token: str, topic: str, address: str) -> Dict[str, Any]:
        shop_domain = normalize_shop_domain(shop_url).replace(".myshopify.com", "")
        try:
            logger.info(f"Registering {topic} webhook for shop: {shop_domain} -> {address}")
            data = shopify_graphql(
                shop_url,
                access_token,
                """
                mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
                  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
                    webhookSubscription { %s }
                    userErrors { field message }
                  }
                }
                """ % _WEBHOOK_FIELDS,
                {"topic": _topic_to_enum(topic), "sub": {"callbackUrl": address, "format": "JSON"}},
            )
            result = data.get("webhookSubscriptionCreate") or {}
            raise_on_user_errors(result)
            webhook = _flatten(result.get("webhookSubscription") or {})
            logger.info(f"Successfully registered {topic} webhook for {shop_domain}")
            return {
                'success': True,
                'webhook_id': webhook["id"],
                'webhook_url': webhook["address"],
                'topic': webhook["topic"],
                'address': webhook["address"],
                'shop_domain': shop_domain,
            }
        except (ShopifyGraphQLError, Exception) as e:
            logger.error(f"Failed to register {topic} webhook for {shop_domain}: {e}")
            return {'success': False, 'error': str(e), 'shop_domain': shop_domain}

    def register_app_subscriptions_webhook(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """Register the APP_SUBSCRIPTIONS_UPDATE webhook with Shopify."""
        return self._register(shop_url, access_token, SUBSCRIPTION_TOPIC, self.webhook_endpoint)

    def remove_app_subscriptions_webhook(self, shop_url: str, access_token: str, webhook_endpoint: str = None) -> Dict[str, Any]:
        """
        Remove the APP_SUBSCRIPTIONS_UPDATE webhook from Shopify.

        Args:
            webhook_endpoint: Optional specific webhook endpoint to remove
        """
        shop_domain = normalize_shop_domain(shop_url).replace(".myshopify.com", "")
        try:
            target_endpoint = webhook_endpoint or self.webhook_endpoint
            target = next(
                (
                    w for w in self.list_webhooks(shop_url, access_token)
                    if w.get('topic') == SUBSCRIPTION_TOPIC and w.get('address') == target_endpoint
                ),
                None,
            )
            if not target:
                logger.warning(f"No matching webhook found for {shop_domain} with endpoint {target_endpoint}")
                return {
                    'success': True,
                    'message': 'No matching webhook found to remove',
                    'shop_domain': shop_domain
                }

            data = shopify_graphql(
                shop_url,
                access_token,
                """
                mutation webhookSubscriptionDelete($id: ID!) {
                  webhookSubscriptionDelete(id: $id) {
                    deletedWebhookSubscriptionId
                    userErrors { field message }
                  }
                }
                """,
                {"id": target.get("gid") or to_gid("WebhookSubscription", target["id"])},
            )
            raise_on_user_errors(data.get("webhookSubscriptionDelete"))
            logger.info(f"Successfully removed webhook {target['id']} for {shop_domain}")
            return {'success': True, 'webhook_id': target['id'], 'shop_domain': shop_domain}
        except Exception as e:
            logger.error(f"Error removing webhook for {shop_url}: {e}")
            return {'success': False, 'error': str(e), 'shop_domain': shop_domain}

    def list_webhooks(self, shop_url: str, access_token: str) -> List[Dict[str, Any]]:
        """List this app's webhook subscriptions for a store as {id, gid, topic, address}."""
        try:
            data = shopify_graphql(
                shop_url,
                access_token,
                """
                query webhookSubscriptions {
                  webhookSubscriptions(first: 100) {
                    edges { node { %s } }
                  }
                }
                """ % _WEBHOOK_FIELDS,
            )
            edges = (data.get("webhookSubscriptions") or {}).get("edges") or []
            return [_flatten(edge["node"]) for edge in edges if edge.get("node")]
        except Exception as e:
            logger.error(f"Error listing webhooks for {shop_url}: {e}")
            return []

    def _ensure(self, shop_url: str, access_token: str, topic: str, address: str, label: str) -> Dict[str, Any]:
        try:
            existing = self.list_webhooks(shop_url, access_token)
            logger.info(f"Found {len(existing)} existing webhooks for {shop_url}")
            for webhook in existing:
                if webhook.get('topic') == topic and webhook.get('address') == address:
                    logger.info(f"{label} webhook already registered for {shop_url}")
                    return {
                        'success': True,
                        'message': f'{label} webhook already registered',
                        'webhook_id': webhook.get('id'),
                        'already_exists': True
                    }
            logger.info(f"{label} webhook not found, registering for {shop_url} -> {address}")
            return self._register(shop_url, access_token, topic, address)
        except Exception as e:
            logger.error(f"Error ensuring {label} webhook for {shop_url}: {e}")
            return {'success': False, 'error': str(e)}

    def ensure_subscription_webhook_registered(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """Ensure the APP_SUBSCRIPTIONS_UPDATE webhook is registered for a store."""
        return self._ensure(shop_url, access_token, SUBSCRIPTION_TOPIC, self.webhook_endpoint, "Subscription")

    def register_app_charges_webhook(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """Register the one-time purchase (credit pack) update webhook with Shopify."""
        return self._register(shop_url, access_token, ADDON_TOPIC, self.addon_webhook_endpoint)

    def ensure_addon_webhook_registered(self, shop_url: str, access_token: str) -> Dict[str, Any]:
        """Ensure the one-time purchase update webhook is registered for a store."""
        return self._ensure(shop_url, access_token, ADDON_TOPIC, self.addon_webhook_endpoint, "Add-on")


# Create a global instance
webhook_manager = ShopifyWebhookManager()
