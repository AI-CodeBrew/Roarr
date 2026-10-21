from app.clients.crisp_client import crisp_client
from calendar import monthrange
import os
import json
from app.modules.database.conditions import Attr, Key
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List, Any
from decimal import Decimal
from dotenv import load_dotenv
from ...constants.plans import (
    DEFAULT_PLAN,
    get_max_pages_for_plan,
    get_plan_name,
    is_valid_plan,
)
from .pg_document_store import PgDynamoResource

logger = logging.getLogger(__name__)

load_dotenv()


class ClientError(Exception):
    """Stub replacing botocore ClientError so existing except blocks still work."""

    def __init__(self, message: str = "", response: Optional[Dict] = None):
        super().__init__(message)
        self.response = response or {"Error": {"Code": "", "Message": message}}


class DocumentStore:
    def __init__(self):
        """Initialize Postgres-backed document store (Dynamo-compatible API)."""
        self.region = os.getenv("AWS_DEFAULT_REGION", "eu-west-3")
        self.subscription_transactions_table = os.getenv(
            "DYNAMO_TABLE_SUBSCRIPTION_TRANSACTIONS", "user_subscription_transaction"
        )
        self.shops_table = os.getenv("DYNAMO_TABLE_SHOPS", "roarr_users_stores")
        self.users_table = os.getenv("DYNAMO_TABLE_SHOPS", "roarr_users_stores")
        self.stores_table = os.getenv("DYNAMO_TABLE_SHOPS", "roarr_users_stores")
        self.pages_table = os.getenv("DYNAMO_TABLE_PAGES", "roarr-generated-pages")
        self.coupons_table = os.getenv("DYNAMO_TABLE_COUPONS", "roarr_coupons")
        self.subscription_history_table = os.getenv(
            "DYNAMO_TABLE_SUBSCRIPTION_HISTORY", "roarr_subscription_history"
        )
        self.bundler_table = os.getenv("DYNAMO_TABLE_BUNDLER", "roarr_bundles")
        self.user_dna_table = os.getenv(
            "DYNAMO_TABLE_USER_DNA", "dev_roarr_user_dna"
        )
        self.user_campaigns_table = os.getenv(
            "DYNAMO_TABLE_USER_CAMPAIGNS", "dev_roarr_user_campaigns"
        )

        try:
            # v2: Supabase Postgres shim — no AWS DynamoDB
            self.dynamodb = PgDynamoResource()
            self.users_table_ref = self.dynamodb.Table(self.users_table)
            self.stores_table_ref = self.dynamodb.Table(self.stores_table)
            self.subscription_transactions_table_ref = self.dynamodb.Table(
                self.subscription_transactions_table
            )
            self.shops_table_ref = self.dynamodb.Table(self.shops_table)
            self.pages_table_ref = self.dynamodb.Table(self.pages_table)
            self.coupons_table_ref = self.dynamodb.Table(self.coupons_table)
            self.subscription_history_table_ref = self.dynamodb.Table(
                self.subscription_history_table
            )
            self.bundler_table_ref = self.dynamodb.Table(self.bundler_table)
            self.user_dna_table_ref = self.dynamodb.Table(self.user_dna_table)
            self.user_campaigns_table_ref = self.dynamodb.Table(
                self.user_campaigns_table
            )
        except Exception as e:
            logger.error(f"Failed to initialize Postgres document store: {e}")
            raise

    def _safe_get_table(self, table_name: Optional[str]):
        """Safely get a table reference (Postgres shim)."""
        if not table_name:
            return None
        try:
            return self.dynamodb.Table(table_name)
        except Exception as e:
            logger.error(f"Unexpected error accessing table '{table_name}': {e}")
            return None

    def _require_table(self, table_ref, table_name: str):
        """
        Ensure a DynamoDB table reference exists before performing operations.
        """
        if table_ref is None:
            raise RuntimeError(
                f"DynamoDB table '{table_name}' is not configured or accessible. Please create the table or update environment variables."
            )
        return table_ref

    def _query_all_items(self, table, **kwargs) -> List[Dict[str, Any]]:
        """
        Query a DynamoDB table and automatically paginate through all results.
        """
        items: List[Dict[str, Any]] = []
        last_evaluated_key = None

        while True:
            if last_evaluated_key:
                kwargs["ExclusiveStartKey"] = last_evaluated_key

            response = table.query(**kwargs)
            items.extend(response.get("Items", []))

            last_evaluated_key = response.get("LastEvaluatedKey")
            if not last_evaluated_key:
                break

        return items

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.now(timezone.utc).isoformat()

    def _convert_floats_to_decimal(self, obj: Any) -> Any:
        """
        Recursively convert float values to Decimal for DynamoDB compatibility.

        Args:
            obj: The object to convert (can be dict, list, float, or other types)

        Returns:
            Object with floats converted to Decimals
        """
        if obj is None:
            return obj
        elif isinstance(obj, bool):
            # Handle booleans before checking for other types (bool is a subclass of int)
            return obj
        elif isinstance(obj, float):
            # Convert float to Decimal using string conversion for precision
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: self._convert_floats_to_decimal(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            # Convert tuples to lists and recursively convert items
            return [self._convert_floats_to_decimal(item) for item in obj]
        elif isinstance(obj, Decimal):
            # Already a Decimal, return as-is
            return obj
        elif isinstance(obj, (int, str)):
            # Primitives that don't need conversion
            return obj
        else:
            # For any other type, return as-is
            return obj

    def _format_timestamp(self, timestamp_str: str) -> str:
        """Format timestamp to consistent ISO format"""
        if not timestamp_str:
            return self._get_timestamp()

        try:
            # Parse the timestamp and reformat it
            if timestamp_str.endswith("Z"):
                return timestamp_str
            elif "+" in timestamp_str:
                # Already has timezone info
                return timestamp_str
            else:
                # Add Z for UTC if no timezone info
                return (
                    timestamp_str + "Z"
                    if not timestamp_str.endswith("Z")
                    else timestamp_str
                )
        except Exception:
            return self._get_timestamp()

    def _calculate_expiry_date(self, created_at: str, interval: str) -> str:
        """Calculate subscription expiry date based on interval"""
        try:
            if not created_at:
                return self._get_timestamp()

            # Parse the created_at timestamp
            if created_at.endswith("Z"):
                created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            elif "+" in created_at:
                created_dt = datetime.fromisoformat(created_at)
            else:
                created_dt = datetime.fromisoformat(created_at + "+00:00")

            # Calculate expiry based on interval
            if interval == "every_30_days" or interval == "monthly":
                expiry_dt = created_dt + timedelta(days=30)
            elif interval == "every_365_days" or interval == "yearly":
                expiry_dt = created_dt + timedelta(days=365)
            elif interval == "every_7_days" or interval == "weekly":
                expiry_dt = created_dt + timedelta(days=7)
            elif interval == "every_14_days" or interval == "biweekly":
                expiry_dt = created_dt + timedelta(days=14)
            else:
                # Default to 30 days
                expiry_dt = created_dt + timedelta(days=30)

            return expiry_dt.isoformat() + "Z"

        except Exception as e:
            logger.error(f"Error calculating expiry date: {e}")
            # Default to 30 days from now
            return (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"

    # Credentials Management Methods - Now stored in users table
    def _get_credentials_attr_name(self, platform: str) -> str:
        """Get the attribute name for storing credentials for a platform"""
        return f"{platform.lower()}_credentials"

    def store_user_credentials(
        self, cognito_user_id: str, platform: str, credentials: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Store user credentials for a specific platform in users table"""
        try:
            attr_name = self._get_credentials_attr_name(platform)
            creds_data = {
                **credentials,
                "created_at": self._get_timestamp(),
                "updated_at": self._get_timestamp(),
                "is_active": True,
            }

            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression=f"SET #{attr_name} = :creds, updated_at = :updated_at",
                ExpressionAttributeNames={f"#{attr_name}": attr_name},
                ExpressionAttributeValues={
                    ":creds": creds_data,
                    ":updated_at": self._get_timestamp(),
                },
            )

            return {"credentials": creds_data, "platform": platform}

        except ClientError as e:
            logger.error(f"Error storing user credentials: {e}")
            raise

    def get_user_credentials(
        self, cognito_user_id: str, platform: str
    ) -> Optional[Dict[str, Any]]:
        """Get user credentials for a specific platform from users table"""
        try:
            user = self.get_user_by_cognito_id(cognito_user_id)
            if not user:
                return None

            attr_name = self._get_credentials_attr_name(platform)
            creds = user.get(attr_name)

            if creds and creds.get("is_active", True):
                return {"credentials": creds, "platform": platform}
            return None

        except ClientError as e:
            logger.error(f"Error getting user credentials: {e}")
            return None

    def update_user_credentials(
        self, cognito_user_id: str, platform: str, credentials: Dict[str, Any]
    ) -> bool:
        """Update user credentials for a specific platform in users table"""
        try:
            attr_name = self._get_credentials_attr_name(platform)

            # Get existing credentials to preserve created_at
            existing_creds = self.get_user_credentials(cognito_user_id, platform)
            created_at = (
                existing_creds.get("credentials", {}).get("created_at")
                if existing_creds
                else self._get_timestamp()
            )

            creds_data = {
                **credentials,
                "created_at": created_at,
                "updated_at": self._get_timestamp(),
                "is_active": True,
            }

            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression=f"SET #{attr_name} = :creds, updated_at = :updated_at",
                ExpressionAttributeNames={f"#{attr_name}": attr_name},
                ExpressionAttributeValues={
                    ":creds": creds_data,
                    ":updated_at": self._get_timestamp(),
                },
            )

            return True

        except ClientError as e:
            logger.error(f"Error updating user credentials: {e}")
            return False

    def delete_user_credentials(self, cognito_user_id: str, platform: str) -> bool:
        """Delete user credentials for a specific platform (soft delete)"""
        try:
            attr_name = self._get_credentials_attr_name(platform)

            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression=f"SET #{attr_name}.is_active = :is_active, #{attr_name}.updated_at = :updated_at, updated_at = :updated_at",
                ExpressionAttributeNames={f"#{attr_name}": attr_name},
                ExpressionAttributeValues={
                    ":is_active": False,
                    ":updated_at": self._get_timestamp(),
                },
            )

            return True

        except ClientError as e:
            logger.error(f"Error deleting user credentials: {e}")
            return False

    def get_all_user_credentials(self, cognito_user_id: str) -> List[Dict[str, Any]]:
        """Get all active credentials for a user from users table"""
        try:
            user = self.get_user_by_cognito_id(cognito_user_id)
            if not user:
                return []

            credentials_list = []
            # Check for known credential types
            for platform in ["shopify"]:
                attr_name = self._get_credentials_attr_name(platform)
                if attr_name in user:
                    creds = user[attr_name]
                    if creds.get("is_active", True):
                        credentials_list.append(
                            {"platform": platform, "credentials": creds}
                        )

            return credentials_list

        except ClientError as e:
            logger.error(f"Error getting all user credentials: {e}")
            return []

    # Shopify Credentials Methods - Now handled via stores table
    def store_shopify_credentials(
        self,
        cognito_user_id: str,
        shop_url: str,
        access_token: str,
        shop_id: str = None,
    ) -> Dict[str, Any]:
        """Store Shopify credentials by creating/updating a store"""
        try:
            # Create or update store with these credentials
            store_id = self.create_store(
                shop_url, access_token, cognito_user_id, shop_id
            )
            return {
                "shop_url": shop_url,
                "access_token": access_token,
                "store_id": store_id,
                "shop_id": shop_id,
            }
        except Exception as e:
            logger.error(f"Error storing Shopify credentials: {e}")
            raise

    def get_shopify_credentials(self, cognito_user_id: str) -> Optional[Dict[str, Any]]:
        """Get Shopify credentials from the user's primary store (first active store)"""
        try:
            # Get the primary store (first active store)
            store = self.get_user_primary_store(cognito_user_id)
            if store:
                # Always return the primary store's credentials for subscription purposes
                # This ensures consistent behavior when user has multiple stores
                return {
                    "shop_url": store.get("store_url"),
                    "access_token": store.get("access_token"),
                    "store_id": store.get("PK"),
                }
            return None
        except Exception as e:
            logger.error(f"Error getting Shopify credentials: {e}")
            return None

    def update_shopify_credentials(
        self, cognito_user_id: str, shop_url: str, access_token: str
    ) -> bool:
        """Update Shopify credentials via store update"""
        try:
            # Find the store with this shop_url
            store = self.get_store_by_shop_url(shop_url)
            if store:
                # Update the existing store
                self.stores_table_ref.update_item(
                    Key={"PK": store["PK"]},
                    UpdateExpression="SET access_token = :token, updated_at = :updated_at",
                    ExpressionAttributeValues={
                        ":token": access_token,
                        ":updated_at": self._get_timestamp(),
                    },
                )
                return True
            else:
                # Create new store
                self.create_store(shop_url, access_token, cognito_user_id)
                return True
        except Exception as e:
            logger.error(f"Error updating Shopify credentials: {e}")
            return False

    # Token Management Methods - Removed, tokens now stored with credentials

    # User Management Methods
    def create_user(
        self,
        cognito_user_id: str,
        email: str,
        first_name: str = "",
        last_name: str = "",
    ) -> Dict[str, Any]:
        """Create a new user in DynamoDB using Cognito ID as primary key"""
        try:
            user_item = {
                "PK": cognito_user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "subscription_plan": DEFAULT_PLAN,  # Default plan for new users
                "plan_updated_at": self._get_timestamp(),
                "is_active": True,
                "created_at": self._get_timestamp(),
                "updated_at": self._get_timestamp(),
            }

            self.users_table_ref.put_item(Item=user_item)
            return user_item

        except ClientError as e:
            logger.error(f"Error creating user: {e}")
            raise

    def get_user_by_cognito_id(self, cognito_user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Cognito user ID"""
        try:
            response = self.users_table_ref.get_item(Key={"PK": cognito_user_id})

            return response.get("Item")

        except ClientError as e:
            logger.error(f"Error getting user by Cognito ID: {e}")
            return None

    def update_user(self, cognito_user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user information"""
        try:
            # Build update expression
            update_expression = "SET "
            expression_attribute_values = {}
            expression_attribute_names = {}

            for key, value in updates.items():
                if key in ["PK"]:  # Skip primary key
                    continue

                attr_name = f"#{key}"
                attr_value = f":{key}"

                update_expression += f"{attr_name} = {attr_value}, "
                expression_attribute_names[attr_name] = key
                expression_attribute_values[attr_value] = value

            # Add updated_at timestamp
            update_expression += "#updated_at = :updated_at"
            expression_attribute_names["#updated_at"] = "updated_at"
            expression_attribute_values[":updated_at"] = self._get_timestamp()

            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
            )

            return True

        except ClientError as e:
            logger.error(f"Error updating user: {e}")
            return False

    def delete_user(self, cognito_user_id: str) -> bool:
        """Delete user (soft delete by setting is_active to False)"""
        try:
            self.update_user(cognito_user_id, {"is_active": False})
            return True
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False

    def get_user_plan(self, cognito_user_id: str) -> str:
        """
        Get the subscription plan for a user from user_subscription_transaction table

        Args:
            cognito_user_id: The user's Cognito ID

        Returns:
            Plan identifier (free, basic, pro, enterprise). Defaults to DEFAULT_PLAN if not set.
        """
        try:
            # First, try to get current active subscription from user_subscription_transaction table
            current_subscription = self.get_user_current_subscription(cognito_user_id)
            if current_subscription:
                # Map subscription name to plan identifier
                subscription_name = current_subscription.get("name", "")
                plan = self.map_subscription_name_to_plan(subscription_name)
                logger.info(
                    f"Found current subscription '{subscription_name}' mapped to plan '{plan}'"
                )
                return plan

            # Fallback to user table subscription_plan field (for legacy users)
            user = self.get_user_by_cognito_id(cognito_user_id)
            if not user:
                logger.warning(
                    f"User {cognito_user_id} not found, returning default plan"
                )
                return DEFAULT_PLAN

            plan = user.get("subscription_plan", DEFAULT_PLAN)

            # Validate plan
            if not is_valid_plan(plan):
                logger.warning(
                    f"Invalid plan '{plan}' for user {cognito_user_id}, returning default plan"
                )
                return DEFAULT_PLAN

            logger.info(
                f"Using legacy subscription_plan field for user {cognito_user_id}: {plan}"
            )
            return plan

        except Exception as e:
            logger.error(f"Error getting user plan: {e}")
            return DEFAULT_PLAN

    def get_active_subscription(self, cognito_user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the active subscription for a user from the subscriptions table

        Args:
            cognito_user_id: The user's Cognito ID

        Returns:
            Active subscription record or None if not found
        """
        try:
            subscriptions_table = self.dynamodb.Table("subscription_transactions")

            from app.modules.database.conditions import Attr, Key

            response = subscriptions_table.scan(
                FilterExpression=Attr("fk_user_id").eq(cognito_user_id)
                & Attr("status").eq("ACTIVE"),
                Limit=1,
            )

            items = response.get("Items", [])
            if items:
                # Sort by webhook_received_at descending to get the most recent
                items.sort(key=lambda x: x.get("webhook_received_at", ""), reverse=True)
                logger.info(
                    f"Found active subscription for user {cognito_user_id}: {items[0]}"
                )
                return items[0]

            logger.info(f"No active subscription found for user {cognito_user_id}")
            return None

        except Exception as e:
            logger.error(
                f"Error getting active subscription for user {cognito_user_id}: {e}"
            )
            return None

    def map_subscription_name_to_plan(self, subscription_name: str) -> str:
        """
        Map subscription name from Shopify to internal plan identifier

        Args:
            subscription_name: Subscription name from Shopify (e.g., "Starter Monthly", "Value Monthly", "Premium Monthly")

        Returns:
            Internal plan identifier (free, basic, pro, enterprise)
        """
        if not subscription_name:
            return DEFAULT_PLAN

        subscription_name_lower = subscription_name.lower()

        # Map actual Shopify subscription names to plan identifiers
        if "starter" in subscription_name_lower:
            return "starter"  # Starter Monthly maps to free plan (2 generations)
        elif "value" in subscription_name_lower:
            return "basic"  # Value Monthly maps to basic plan (10 generations, $34/$35)
        elif "premium" in subscription_name_lower:
            return "pro"  # Premium Monthly maps to pro plan (20 generations)
        elif "enterprise" in subscription_name_lower:
            return "enterprise"
        # Legacy mappings for backward compatibility
        elif "basic" in subscription_name_lower:
            return "basic"
        elif "pro" in subscription_name_lower:
            return "pro"
        else:
            logger.warning(
                f"Unknown subscription name pattern: '{subscription_name}', returning default plan"
            )
            return DEFAULT_PLAN

    def update_user_plan(self, cognito_user_id: str, new_plan: str) -> bool:
        """
        Update a user's subscription plan

        Args:
            cognito_user_id: The user's Cognito ID
            new_plan: New plan identifier (free, basic, pro, enterprise)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Validate plan
            if not is_valid_plan(new_plan):
                logger.error(f"Invalid plan '{new_plan}'")
                return False

            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression="SET subscription_plan = :plan, plan_updated_at = :updated_at, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":plan": new_plan,
                    ":updated_at": self._get_timestamp(),
                },
            )

            logger.info(f"Updated user {cognito_user_id} to plan: {new_plan}")
            return True

        except ClientError as e:
            logger.error(f"Error updating user plan: {e}")
            return False

    def ensure_user_has_plan(self, cognito_user_id: str) -> bool:
        """
        Ensure existing user has a subscription_plan field (for migration)

        Args:
            cognito_user_id: The user's Cognito ID

        Returns:
            True if user has plan or was updated successfully
        """
        try:
            user = self.get_user_by_cognito_id(cognito_user_id)
            if not user:
                return False

            # If user doesn't have subscription_plan, add it (Free plan for new/existing users)
            if "subscription_plan" not in user:
                logger.info(
                    f"Migrating user {cognito_user_id} to default plan: {DEFAULT_PLAN}"
                )
                self.users_table_ref.update_item(
                    Key={"PK": cognito_user_id},
                    UpdateExpression="SET subscription_plan = :plan, plan_updated_at = :updated_at, updated_at = :updated_at",
                    ExpressionAttributeValues={
                        ":plan": DEFAULT_PLAN,
                        ":updated_at": self._get_timestamp(),
                    },
                )

            return True

        except Exception as e:
            logger.error(f"Error ensuring user has plan: {e}")
            return False

    # Resource Management Methods - Now stored in users table
    def create_user_resource(
        self, cognito_user_id: str, resource_type: str, file_id: str, file_hash: str
    ) -> Dict[str, Any]:
        """Create or update user resource in users table"""
        try:
            resource_data = {
                "file_id": file_id,
                "file_hash": file_hash,
                "created_at": self._get_timestamp(),
                "updated_at": self._get_timestamp(),
            }

            # Store as resources.{resource_type}
            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression="SET #resources.#res_type = :res_data, updated_at = :updated_at",
                ExpressionAttributeNames={
                    "#resources": "resources",
                    "#res_type": resource_type,
                },
                ExpressionAttributeValues={
                    ":res_data": resource_data,
                    ":updated_at": self._get_timestamp(),
                },
            )

            return {"resource_type": resource_type, **resource_data}

        except ClientError as e:
            logger.error(f"Error creating user resource: {e}")
            raise

    def get_user_resource(
        self, cognito_user_id: str, resource_type: str
    ) -> Optional[Dict[str, Any]]:
        """Get user resource by type from users table"""
        try:
            user = self.get_user_by_cognito_id(cognito_user_id)
            if not user:
                return None

            resources = user.get("resources", {})
            resource = resources.get(resource_type)

            if resource:
                return {"resource_type": resource_type, **resource}
            return None

        except ClientError as e:
            logger.error(f"Error getting user resource: {e}")
            return None

    def update_user_resource(
        self, cognito_user_id: str, resource_type: str, file_id: str, file_hash: str
    ) -> bool:
        """Update user resource in users table"""
        try:
            # Get existing resource to preserve created_at
            existing_resource = self.get_user_resource(cognito_user_id, resource_type)
            created_at = (
                existing_resource.get("created_at")
                if existing_resource
                else self._get_timestamp()
            )

            resource_data = {
                "file_id": file_id,
                "file_hash": file_hash,
                "created_at": created_at,
                "updated_at": self._get_timestamp(),
            }

            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression="SET #resources.#res_type = :res_data, updated_at = :updated_at",
                ExpressionAttributeNames={
                    "#resources": "resources",
                    "#res_type": resource_type,
                },
                ExpressionAttributeValues={
                    ":res_data": resource_data,
                    ":updated_at": self._get_timestamp(),
                },
            )

            return True

        except ClientError as e:
            logger.error(f"Error updating user resource: {e}")
            return False

    def get_user_thread_id(self, cognito_user_id: str) -> str:
        """Get the thread_id from the user profile."""
        try:
            user = self.get_user_by_cognito_id(cognito_user_id)
            thread_id = user.get("thread_id") if user else None
            return thread_id
        except Exception as e:
            logger.error(f"Error in get_user_thread_id for {cognito_user_id}: {e}")
            return None

    def set_user_thread_id(self, cognito_user_id: str, thread_id: str) -> bool:
        """Set the thread_id in the user profile."""
        try:
            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression="SET thread_id = :thread_id, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":thread_id": thread_id,
                    ":updated_at": self._get_timestamp(),
                },
            )
            return True
        except ClientError as e:
            logger.error(f"Error updating user thread_id: {e}")
            return False

    def delete_user_thread_id(self, cognito_user_id: str) -> bool:
        """Delete the thread_id from the user profile."""
        try:
            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression="REMOVE thread_id SET updated_at = :updated_at",
                ExpressionAttributeValues={":updated_at": self._get_timestamp()},
            )
            return True
        except ClientError as e:
            logger.error(f"Error deleting user thread_id: {e}")
            return False

    def mark_shopify_installed(self, cognito_user_id: str) -> bool:
        """Mark Shopify app as installed on the user profile with timestamp."""
        try:
            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression=(
                    "SET shopify_app_installed = :installed, "
                    "shopify_app_install_dt = :install_dt, "
                    "updated_at = :updated_at"
                ),
                ExpressionAttributeValues={
                    ":installed": True,
                    ":install_dt": self._get_timestamp(),
                    ":updated_at": self._get_timestamp(),
                },
            )
            return True
        except ClientError as e:
            logger.error(f"Error marking Shopify installed: {e}")
            return False

    def mark_shopify_uninstalled(self, cognito_user_id: str) -> bool:
        """Mark Shopify app as uninstalled on the user profile with timestamp."""
        try:
            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression=(
                    "SET shopify_app_installed = :installed, "
                    "shopify_app_uninstall_dt = :uninstall_dt, "
                    "updated_at = :updated_at"
                ),
                ExpressionAttributeValues={
                    ":installed": False,
                    ":uninstall_dt": self._get_timestamp(),
                    ":updated_at": self._get_timestamp(),
                },
            )
            return True
        except ClientError as e:
            logger.error(f"Error marking Shopify uninstalled: {e}")
            return False

    def mark_user_subscription_uninstalled(self, user_id: str) -> bool:
        """Mark user subscription as cancelled on the user profile with timestamp."""
        return self.update_subscription_history_items(
            user_id=user_id,
            updates={
                "uninstalled": True,
                "uninstalled_at": self._get_timestamp(),
            },
            condition_expression="attribute_not_exists(uninstalled) OR uninstalled = :false",
            condition_values={":false": False},
        )

    def update_subscription_history_items(
        self,
        user_id: str,
        updates: Dict[str, Any],
        condition_expression: Optional[str] = None,
        condition_values: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Update multiple subscription history items for a given user_id.

        Args:
            user_id: The user_id to filter subscription history items
            updates: Dictionary of field names and values to update
            condition_expression: Optional condition expression for the update (e.g., "attribute_not_exists(field)")
            condition_values: Optional dictionary of expression attribute values for the condition

        Returns:
            bool: True if all updates succeeded, False otherwise
        """
        try:
            logger.info(f"Updating subscription history items for user {user_id}")

            # Query all items with matching user_id where uninstalled doesn't exist or is False
            response = self.subscription_history_table_ref.scan(
                FilterExpression=Attr("user_id").eq(user_id)
                & (~Attr("uninstalled").exists() | Attr("uninstalled").eq(False))
            )
            items = response.get("Items", [])

            if not items:
                logger.warning(
                    f"No subscription history items found for user {user_id}"
                )
                return False

            logger.info(
                f"Found {len(items)} subscription history items to update for user {user_id}"
            )

            # Build update expression
            update_parts = []
            expression_attribute_values = {}

            for field_name, field_value in updates.items():
                placeholder = f":{field_name}"
                update_parts.append(f"{field_name} = {placeholder}")
                expression_attribute_values[placeholder] = field_value

            update_expression = f"SET {', '.join(update_parts)}"

            # Merge condition values with update values
            if condition_values:
                expression_attribute_values.update(condition_values)

            # Update each item using its PK as the key
            success_count = 0
            for item in items:
                pk = item.get("PK")
                if not pk:
                    logger.warning(f"Skipping item without PK: {item}")
                    continue

                try:
                    update_params = {
                        "Key": {"PK": pk},
                        "UpdateExpression": update_expression,
                        "ExpressionAttributeValues": expression_attribute_values,
                    }

                    if condition_expression:
                        update_params["ConditionExpression"] = condition_expression

                    self.subscription_history_table_ref.update_item(**update_params)
                    success_count += 1
                except ClientError as e:
                    if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                        logger.info(f"Condition check failed for item {pk}, skipping")
                    else:
                        logger.error(
                            f"Error updating subscription history item {pk}: {e}"
                        )

            logger.info(
                f"Successfully updated {success_count}/{len(items)} subscription history items for user {user_id}"
            )
            return success_count > 0

        except Exception as e:
            logger.error(
                f"Error updating subscription history items for user {user_id}: {e}"
            )
            return False

    def mark_shopify_kluck_uninstalled(self, shop_domain: str) -> bool:
        """Mark Shopify Roarr app as uninstalled on the shop details table with timestamp."""
        try:
            # Shops table uses PK = myshopify domain (see store_shop_details)
            # On uninstall we also wipe the stored access token.
            logger.info(
                f"Marking Shopify Roarr app as uninstalled for shop {shop_domain}"
            )
            self.shops_table_ref.update_item(
                Key={"PK": shop_domain},
                ConditionExpression="attribute_exists(PK)",
                UpdateExpression=(
                    "SET uninstalled = :uninstalled, "
                    "uninstall_at = :uninstall_at, "
                    "access_token = :access_token, "
                    "updated_at = :updated_at"
                ),
                ExpressionAttributeValues={
                    ":uninstalled": True,
                    ":uninstall_at": self._get_timestamp(),
                    ":access_token": None,
                    ":updated_at": self._get_timestamp(),
                },
            )
            try:
                logger.info(
                    f"Marking user subscription as cancelled for shop {shop_domain}"
                )
                self.mark_user_subscription_uninstalled(shop_domain)
            except Exception as e:
                logger.error(f"Error marking user subscription as cancelled: {e}")

            # Also wipe access token on the active store record (stores table) if present.
            try:
                store = self.get_store_by_shop_url(shop_domain)
                if store and store.get("PK"):
                    self.stores_table_ref.update_item(
                        Key={"PK": store["PK"]},
                        UpdateExpression="SET access_token = :access_token, updated_at = :updated_at",
                        ExpressionAttributeValues={
                            ":access_token": None,
                            ":updated_at": self._get_timestamp(),
                        },
                    )

            except Exception:
                # Best-effort: uninstall should still succeed even if store token wipe fails.
                pass

            return True
        except ClientError as e:
            if (
                e.response.get("Error", {}).get("Code")
                == "ConditionalCheckFailedException"
            ):
                logger.error(f"Shop not found for domain: {shop_domain}")
                return False
            logger.error(f"Error marking Shopify Roarr uninstalled: {e}")
            return False

    def get_user_shopify_app_status(self, cognito_user_id: str) -> Dict[str, Any]:
        """Get Shopify app status fields from user profile."""
        try:
            user = self.get_user_by_cognito_id(cognito_user_id)
            if not user:
                return {}
            return {
                "shopify_app_installed": user.get("shopify_app_installed", False),
                "shopify_app_install_dt": user.get("shopify_app_install_dt"),
                "shopify_app_uninstall_dt": user.get("shopify_app_uninstall_dt"),
            }
        except Exception as e:
            logger.error(f"Error getting Shopify app status: {e}")
            return {}

    def get_user_has_dataset(self, cognito_user_id: str) -> bool:
        """Get the has_dataset flag from the user profile."""
        user = self.get_user_by_cognito_id(cognito_user_id)
        return user.get("has_dataset", False) if user else False

    def set_user_has_dataset(self, cognito_user_id: str, has_dataset: bool) -> bool:
        """Set the has_dataset flag in the user profile."""
        try:
            self.users_table_ref.update_item(
                Key={"PK": cognito_user_id},
                UpdateExpression="SET has_dataset = :has_dataset, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":has_dataset": has_dataset,
                    ":updated_at": self._get_timestamp(),
                },
            )
            return True
        except ClientError as e:
            logger.error(f"Error updating user has_dataset: {e}")
            return False

    def get_merged_data_resource(
        self, cognito_user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get the merged data resource for a user."""
        return self.get_user_resource(cognito_user_id, "merged_data")

    def get_data_file_resource(self, cognito_user_id: str) -> Optional[Dict[str, Any]]:
        """Get the data file resource for a user."""
        return self.get_user_resource(cognito_user_id, "data_file")

    # Store Management Methods (Shopify sessions for OAuth flow)
    def create_shopify_session(self, shop_url: str, access_token: str) -> str:
        """Create a temporary Shopify OAuth session"""
        try:
            session_id = str(uuid.uuid4())
            expires_at = datetime.now(timezone.utc) + timedelta(days=1)

            session_item = {
                "session_id": session_id,
                "shop_url": shop_url,
                "access_token": access_token,
                "created_at": self._get_timestamp(),
                "expires_at": expires_at.isoformat(),
                "is_active": True,
            }
            sessions_table = self.dynamodb.Table("shopify_store_sessions")
            sessions_table.put_item(Item=session_item)
            return session_id

        except Exception as e:
            logger.error(f"Error creating Shopify session: {e}")
            raise

    def get_shopify_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get and validate a Shopify OAuth session"""
        try:
            sessions_table = self.dynamodb.Table("shopify_store_sessions")
            response = sessions_table.get_item(Key={"session_id": session_id})

            item = response.get("Item")

            if not item:
                return None

            if not item.get("is_active", True):
                return None

            expires_at_str = item.get("expires_at")
            if not expires_at_str:
                return None

            if expires_at_str.endswith("Z"):
                expires_at_str = expires_at_str.replace("Z", "+00:00")

            expires_at = datetime.fromisoformat(expires_at_str)
            current_time = datetime.now(timezone.utc)

            if current_time > expires_at:
                self.deactivate_shopify_session(session_id)
                return None

            return item

        except Exception as e:
            logger.error(f"Error getting Shopify session {session_id}: {e}")
            return None

    def deactivate_shopify_session(self, session_id: str) -> bool:
        """Deactivate a Shopify OAuth session"""
        try:
            sessions_table = self.dynamodb.Table("shopify_store_sessions")
            sessions_table.update_item(
                Key={"session_id": session_id},
                UpdateExpression="SET is_active = :is_active",
                ExpressionAttributeValues={":is_active": False},
            )
            return True
        except Exception as e:
            logger.error(f"Error deactivating Shopify session: {e}")
            return False

    def get_store_by_shop_url(self, shop_url: str) -> Optional[Dict[str, Any]]:
        """Get a store by its shop URL"""
        try:
            response = self.stores_table_ref.scan(
                FilterExpression="store_url = :shop_url AND archived = :archived",
                ExpressionAttributeValues={":shop_url": shop_url, ":archived": False},
            )
            return response.get("Items", [])[0] if response.get("Items") else None
        except Exception as e:
            logger.error(f"Error getting store by shop URL: {e}")
            return None

    def get_store_by_shop_id(self, shop_id: str) -> Optional[Dict[str, Any]]:
        """Get a store by its Shopify shop ID"""
        try:
            response = self.stores_table_ref.scan(
                FilterExpression="shop_id = :shop_id AND archived = :archived",
                ExpressionAttributeValues={":shop_id": shop_id, ":archived": False},
            )
            return response.get("Items", [])[0] if response.get("Items") else None
        except Exception as e:
            logger.error(f"Error getting store by shop ID: {e}")
            return None

    def store_shop_details(self, shop: Dict[str, Any], access_token: str) -> str:
        """
        Store or update Shopify shop details in the shops table.
        If shop already exists, updates the existing record (upsert).

        Args:
            shop: Dictionary containing shop details with the following structure:
                - id: Shopify GraphQL ID (e.g., 'gid://shopify/Shop/65122893895')
                - name: Shop name
                - domain: Shop domain URL
                - myshopifyDomain: Shopify domain
                - email: Shop email
                - phone: Shop phone (can be null)
                - address: Address object with fields (address1, address2, city, province, etc.)
                - currencyCode: Currency code
                - timezone: Timezone
                - plan: Plan name
                - createdAt: Creation timestamp
                - updatedAt: Update timestamp
                - access_token: Access token
            crisp_people_id: Optional Crisp people ID for customer support

        Returns:
            shop_id: The extracted shop ID from the GraphQL ID
        """
        try:
            # Extract shop ID from GraphQL ID (e.g., 'gid://shopify/Shop/65122893895' -> '65122893895')
            shop_graphql_id = shop.get("id", "")
            shop_id = (
                shop_graphql_id.split("/")[-1]
                if shop_graphql_id and "/" in shop_graphql_id
                else None
            )
            shopify_domain = shop.get("myshopifyDomain")
            if not shop_id:
                raise ValueError("Invalid shop ID format")

            # Check if shop already exists
            existing_shop = self.get_shop_details(shopify_domain)
            logger.info(f"Existing shop: {existing_shop}")
            # Prepare shop item for DynamoDB
            if existing_shop:
                is_onboarding = existing_shop.get("is_onboarding", True)
                # Update existing shop - preserve uninstalled status and uninstall_at
                shop_item = {
                    **existing_shop,
                    "PK": shopify_domain,  # Use shop_id as primary key
                    "shop_id": shop_id,
                    "shop_graphql_id": shop_graphql_id,
                    "name": shop.get("name"),
                    "is_onboarding": shop.get("is_onboarding", is_onboarding),
                    "domain": shop.get("domain"),
                    "is_internal": existing_shop.get("is_internal", False),
                    "allow_bypass": existing_shop.get("allow_bypass", False),
                    "crisp_people_id": shop.get("crisp_people_id")
                    or existing_shop.get("crisp_people_id"),
                    "store_url": shop.get("myshopifyDomain"),
                    "email": shop.get("email"),
                    "phone": shop.get("phone"),
                    "currency_code": shop.get("currencyCode"),
                    "timezone": shop.get("timezone"),
                    "plan": shop.get("plan"),
                    "store_creation_date": existing_shop.get("store_creation_date")
                    or shop.get("createdAt")
                    or self._get_timestamp(),  # Preserve original created_at
                    "created_at": existing_shop.get("created_at")
                    or self._get_timestamp(),
                    "updated_at": self._get_timestamp(),
                    "stored_at": existing_shop.get("stored_at")
                    or self._get_timestamp(),  # Preserve original stored_at
                    "uninstalled": existing_shop.get(
                        "uninstalled", False
                    ),  # Preserve uninstalled status
                    "uninstall_at": existing_shop.get(
                        "uninstall_at"
                    ),  # Preserve uninstall_at
                    "access_token": access_token,
                }
                logger.info(f"Updating existing shop details for shop_id: {shop_id}")
            else:
                # Create new shop
                shop_item = {
                    "PK": shopify_domain,  # Use shop_id as primary key
                    "shop_id": shop_id,
                    "crisp_people_id": shop.get("crisp_people_id"),
                    "shop_graphql_id": shop_graphql_id,
                    "name": shop.get("name"),
                    "domain": shop.get("domain"),
                    "store_url": shop.get("myshopifyDomain"),
                    "email": shop.get("email"),
                    "phone": shop.get("phone"),
                    "currency_code": shop.get("currencyCode"),
                    "timezone": shop.get("timezone"),
                    "plan": shop.get("plan"),
                    "store_creation_date": shop.get("createdAt")
                    or self._get_timestamp(),
                    "created_at": self._get_timestamp(),
                    "updated_at": self._get_timestamp(),
                    "stored_at": self._get_timestamp(),
                    "uninstalled": False,  # Default to False
                    "uninstall_at": None,  # Default to None
                    "access_token": access_token,
                    "is_onboarding": shop.get("is_onboarding", False),
                }
                logger.info(f"Creating new shop details for shop_id: {shop_id}")
            logger.info(f"Shop item: {shop_item}")
            # Handle address object
            address = shop.get("address", {})
            if address:
                shop_item["address"] = {
                    "address1": address.get("address1"),
                    "address2": address.get("address2"),
                    "city": address.get("city"),
                    "province": address.get("province"),
                    "province_code": address.get("provinceCode"),
                    "country": address.get("country"),
                    "country_code": address.get("countryCode"),
                    "zip": address.get("zip"),
                }
            else:
                shop_item["address"] = {
                    "address1": None,
                    "address2": None,
                    "city": None,
                    "province": None,
                    "province_code": None,
                    "country": None,
                    "country_code": None,
                    "zip": None,
                }

            # Store or update shop details
            self.shops_table_ref.put_item(Item=shop_item)
            logger.info(
                f"Successfully stored/updated shop details for shop_id: {shop_id}"
            )

            return shop_id

        except Exception as e:
            logger.error(f"Error storing shop details: {e}")
            raise

    def get_shop_details(self, shopify_domain: str) -> Optional[Dict[str, Any]]:
        """
        Get shop details by shop ID.

        Args:
            shop_id: Shopify shop ID

        Returns:
            Shop details dictionary or None if not found
        """
        try:
            response = self.shops_table_ref.get_item(Key={"PK": shopify_domain})
            return response.get("Item")
        except Exception as e:
            logger.error(
                f"Error getting shop details for shop_id {shopify_domain}: {e}"
            )
            return None

    def get_public_copouns(self) -> Optional[Dict[str, Any]]:
        """
        Get public and valid coupons
        """
        try:
            response = self.coupons_table_ref.scan(
                FilterExpression=Attr("public").eq(True) & Attr("valid").eq(True)
            )
            return response.get("Items")
        except Exception as e:
            logger.error(f"Error getting public coupons: {e}")
            return None

    def mark_shop_uninstalled(self, shop_id: str) -> bool:
        """
        Mark a shop as uninstalled by updating the uninstalled flag and uninstall_at.

        Args:
            shop_id: Shopify shop ID

        Returns:
            True if successful, False otherwise
        """
        try:
            self.shops_table_ref.update_item(
                Key={"PK": shop_id},
                UpdateExpression="SET uninstalled = :uninstalled, uninstall_at = :uninstall_at, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":uninstalled": True,
                    ":uninstall_at": self._get_timestamp(),
                    ":updated_at": self._get_timestamp(),
                },
            )
            logger.info(f"Marked shop {shop_id} as uninstalled")
            return True
        except Exception as e:
            logger.error(f"Error marking shop {shop_id} as uninstalled: {e}")
            return False

    def set_shop_onboarding_true(self, shopify_domain: str) -> bool:
        """
        Set is_onboarding to True for a shop.

        Args:
            shopify_domain: Shopify domain (PK in shops table)

        Returns:
            True if successful, False otherwise
        """
        try:
            self.shops_table_ref.update_item(
                Key={"PK": shopify_domain},
                UpdateExpression="SET is_onboarding = :val, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":val": True,
                    ":updated_at": self._get_timestamp(),
                },
            )
            logger.info(f"Set is_onboarding=True for shop {shopify_domain}")
            return True
        except Exception as e:
            logger.error(f"Error setting is_onboarding for shop {shopify_domain}: {e}")
            return False

    def create_store(
        self, store_url: str, access_token: str, fk_user_id: str, shop_id: str = None
    ) -> str:
        try:
            # Check if this specific user already has this store
            response = self.stores_table_ref.scan(
                FilterExpression=Attr("store_url").eq(store_url)
                & Attr("fk_user_id").eq(fk_user_id)
            )

            if response["Count"] > 0:
                existing_store = response["Items"][0]

                if not existing_store.get("archived", False):
                    raise ValueError("Store already connected")

                # Update existing archived store (unarchive and update credentials)
                update_expr = "SET archived = :archived, access_token = :token, fk_user_id = :uid, updated_at = :updated"
                expr_values = {
                    ":archived": False,
                    ":token": access_token,
                    ":uid": fk_user_id,
                    ":updated": self._get_timestamp(),
                }

                # Add shop_id if provided
                if shop_id:
                    update_expr += ", shop_id = :shop_id"
                    expr_values[":shop_id"] = shop_id

                # Execute the update
                self.stores_table_ref.update_item(
                    Key={"PK": existing_store["PK"]},
                    UpdateExpression=update_expr,
                    ExpressionAttributeValues=expr_values,
                )
                return existing_store["PK"]

            store_id = str(uuid.uuid4())
            # Compute trial and initial license windows (no grace on trial)
            trial_days = 3  # 3-day free trial
            grace_days_default = 0
            trial_expires_at = (
                datetime.now(timezone.utc) + timedelta(days=trial_days)
            ).isoformat()
            store_item = {
                "PK": fk_user_id,
                "store_url": store_url,
                "access_token": access_token,
                "fk_user_id": fk_user_id,
                "shop_id": shop_id,  # Store Shopify shop ID for webhook matching
                "archived": False,
                "live_theme_id": None,  # User's live theme ID where templates are uploaded
                "uploaded_template": {},  # Track which categories have been uploaded: { "health_beauty": {"uploaded_at": "..."}, "general": {"uploaded_at": "..."} }
                "product_pages": [],  # Array of product pages created through Store Setup (max 5)
                "product_pages_count": 0,  # Explicit count of product pages
                # License / billing state
                "license_locked": False,
                "license_status": "trial",
                "license_expires_at": trial_expires_at,  # lock after trial if not upgraded
                "grace_days": grace_days_default,
                "created_at": self._get_timestamp(),
                "updated_at": self._get_timestamp(),
            }
            self.stores_table_ref.put_item(Item=store_item)
            return fk_user_id

        except Exception as e:
            raise e

    def get_user_stores(self, fk_user_id: str) -> List[Dict[str, Any]]:
        try:
            # With user id as PK there can be at most one item
            response = self.stores_table_ref.get_item(Key={"PK": fk_user_id})
            item = response.get("Item")
            if not item:
                return []
            if item.get("archived", False):
                return []
            return [item]
        except Exception:
            return []

    def get_user_primary_store(self, fk_user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the user's primary store (first active store).
        This is the store used for subscriptions and primary operations.

        Args:
            fk_user_id: User's Cognito ID

        Returns:
            Primary store data or None if no stores exist
        """
        try:
            stores = self.get_user_stores(fk_user_id)
            if stores and len(stores) > 0:
                return stores[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user primary store: {e}")
            return None

    # License and locking helpers
    def _normalize_shop_domain(self, shop: str) -> str:
        if not shop:
            return shop
        shop = shop.replace("https://", "").replace("http://", "").strip()
        if "." not in shop:
            shop = f"{shop}.myshopify.com"
        return shop

    def get_store_by_any_domain(self, shop: str) -> Optional[Dict[str, Any]]:
        try:
            normalized = self._normalize_shop_domain(shop)
            response = self.stores_table_ref.scan(
                FilterExpression=Attr("archived").eq(False)
            )
            items = response.get("Items", [])
            for item in items:
                url = (
                    (item.get("store_url") or "")
                    .replace("https://", "")
                    .replace("http://", "")
                    .strip()
                )
                if url == normalized or url == shop:
                    return item
                if normalized.endswith(".myshopify.com") and url.endswith(
                    ".myshopify.com"
                ):
                    if url.split(".")[0] == normalized.split(".")[0]:
                        return item
            return None
        except Exception:
            return None

    def set_store_license(
        self,
        *,
        store_id: Optional[str] = None,
        fk_user_id: Optional[str] = None,
        locked: Optional[bool] = None,
        status: Optional[str] = None,
        expires_at: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> bool:
        try:
            if not store_id:
                stores = self.get_user_stores(fk_user_id) if fk_user_id else []
                if not stores:
                    return False
                store_id = stores[0].get("PK")

            parts = ["updated_at = :u"]
            vals = {":u": self._get_timestamp()}
            if locked is not None:
                parts.append("license_locked = :l")
                vals[":l"] = bool(locked)
            if status is not None:
                parts.append("license_status = :s")
                vals[":s"] = status
            if expires_at is not None:
                parts.append("license_expires_at = :e")
                vals[":e"] = expires_at
            if reason is not None:
                parts.append("license_lock_reason = :r")
                vals[":r"] = reason

            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression="SET " + ", ".join(parts),
                ExpressionAttributeValues=vals,
            )
            return True
        except Exception:
            return False

    def get_store_license_status(
        self, shop: Optional[str] = None, fk_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            store = None
            if shop:
                store = self.get_store_by_any_domain(shop)
            elif fk_user_id:
                stores = self.get_user_stores(fk_user_id)
                store = stores[0] if stores else None
            if not store:
                return {"exists": False, "locked": True, "status": "unknown"}

            locked = bool(store.get("license_locked", False))

            status = store.get("license_status") or (
                "active" if not locked else "locked"
            )
            expires_at = store.get("license_expires_at")

            expired = False
            if expires_at:
                try:
                    ts = (
                        expires_at.replace("Z", "+00:00")
                        if isinstance(expires_at, str)
                        else expires_at
                    )
                    dt = datetime.fromisoformat(ts) if isinstance(ts, str) else ts
                    expired = datetime.now(timezone.utc) > dt
                except Exception:
                    expired = False

            if expired:
                locked = True
                status = "expired"

            return {
                "exists": True,
                "locked": locked,
                "status": status,
                "expires_at": expires_at,
                "store_id": store.get("PK"),
            }
        except Exception as e:
            return {
                "exists": False,
                "locked": True,
                "status": "error",
                "reason": str(e),
            }

    def archive_store(self, store_id: str) -> bool:
        try:
            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression="SET archived = :archived, access_token = :access_token, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":archived": True,
                    ":access_token": None,
                    ":updated_at": self._get_timestamp(),
                },
            )
            return True
        except Exception as e:
            return False

    def remove_user_store(self, cognito_user_id: str, store_id: str) -> bool:
        """
        Remove a store for a user and ensure proper store ordering.
        If the removed store was the first store, the next store becomes the primary.

        Args:
            cognito_user_id: User's Cognito ID
            store_id: Store ID to remove

        Returns:
            True if successful, False otherwise
        """
        try:
            # Get all user stores
            stores = self.get_user_stores(cognito_user_id)
            if not stores:
                logger.warning(f"No stores found for user {cognito_user_id}")
                return False

            # Check if the store exists and belongs to the user
            target_store = None
            for store in stores:
                if store.get("PK") == store_id:
                    target_store = store
                    break

            if not target_store:
                logger.warning(f"Store {store_id} not found for user {cognito_user_id}")
                return False

            # Archive the store
            success = self.archive_store(store_id)
            if not success:
                return False

            logger.info(
                f"Successfully removed store {store_id} for user {cognito_user_id}"
            )

            # Check if there are remaining stores
            remaining_stores = self.get_user_stores(cognito_user_id)
            if remaining_stores:
                logger.info(
                    f"User {cognito_user_id} has {len(remaining_stores)} remaining stores"
                )
                # The first store in the remaining list will now be the primary store
                primary_store = remaining_stores[0]
                logger.info(f"Primary store is now: {primary_store.get('store_url')}")
            else:
                logger.info(f"User {cognito_user_id} has no remaining stores")

            return True

        except Exception as e:
            logger.error(f"Error removing user store: {e}")
            return False

    def update_theme_uploaded_status(
        self,
        fk_user_id: str,
        theme_uploaded: bool = True,
        metadata: Dict[str, Any] = None,
        zambeel_theme_id: str = None,
    ) -> bool:
        # def update_store_metadata(self, user_id: str, metadata: Dict[str, Any]) -> bool:
        """Update store metadata as top-level attributes for the user's store (PK=user_id).

        Each key in metadata will be written as its own attribute on the item.
        """
        try:
            if not metadata or not isinstance(metadata, dict):
                return False

            # Build dynamic update expression
            set_clauses = []
            expr_attr_names = {}
            expr_attr_values = {":updated_at": self._get_timestamp()}

            for key, value in metadata.items():
                if value is None:
                    continue
                attr_name_placeholder = f"#{key}"
                attr_value_placeholder = f":{key}"
                set_clauses.append(
                    f"{attr_name_placeholder} = {attr_value_placeholder}"
                )
                expr_attr_names[attr_name_placeholder] = key
                expr_attr_values[attr_value_placeholder] = value

            # Always update updated_at
            set_clauses.append("updated_at = :updated_at")

            if not set_clauses:
                return False

            update_expression = "SET " + ", ".join(set_clauses)

            self.stores_table_ref.update_item(
                Key={"PK": fk_user_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expr_attr_names if expr_attr_names else None,
                ExpressionAttributeValues=expr_attr_values,
            )
            return True
        except Exception:
            return False

    def update_template_upload_metadata(
        self,
        fk_user_id: str,
        category: str,
        duplicated_theme_id: str = None,
        live_theme_id: str = None,
        template: int = None,
    ) -> bool:
        """
        Update template upload metadata for a user's primary store.
        Stores which (category, template) have been uploaded and the duplicated theme ID.

        Args:
            fk_user_id: The user's Cognito ID
            category: Product category (e.g., "health_beauty", "general")
            duplicated_theme_id: User's duplicated theme ID where files were uploaded (preferred)
            live_theme_id: User's live theme ID where files were uploaded (deprecated, kept for backward compatibility)
            template: Template number (1 or 2). If provided, key is "{category}_{template}"; otherwise key is category only (backward compat).

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get the user's primary store (first active store)
            store = self.get_user_primary_store(fk_user_id)
            if not store:
                logger.warning(f"No active stores found for user {fk_user_id}")
                return False

            store_id = store.get("PK")

            # Normalize category to match our template categories (only when template not provided, for backward compat)
            category_lower = (category or "").lower()
            if "health" in category_lower or "beauty" in category_lower:
                template_category = "health_beauty"
            elif "home" in category_lower or "kitchen" in category_lower:
                template_category = "home_kitchen"
            elif "kids" in category_lower or "toys" in category_lower:
                template_category = "kids_toys"
            elif "car" in category_lower or "accessor" in category_lower:
                template_category = "car_accessories"
            elif "fashion" in category_lower or "apparel" in category_lower:
                template_category = "fashion"
            else:
                template_category = "general"

            # Key: per (category, template) when template is provided; else category only
            if template is not None and template in (1, 2, 3):
                metadata_key = f"{template_category}_{template}"
            else:
                metadata_key = template_category

            # Get existing uploaded_template and merge in this upload
            uploaded_template = store.get("uploaded_template", {})
            if not isinstance(uploaded_template, dict):
                uploaded_template = {}

            uploaded_template[metadata_key] = {"uploaded_at": self._get_timestamp()}

            # Use duplicated_theme_id if provided, otherwise fall back to live_theme_id for backward compatibility
            theme_id = duplicated_theme_id or live_theme_id
            if not theme_id:
                logger.warning(
                    "No theme ID provided (neither duplicated_theme_id nor live_theme_id)"
                )
                return False

            # Update the store with duplicated_theme_id (or live_theme_id for backward compatibility) and uploaded_template
            if duplicated_theme_id:
                update_expr = "SET duplicated_theme_id = :theme_id, uploaded_template = :uploaded_template, updated_at = :updated_at"
            else:
                # Backward compatibility: update live_theme_id
                update_expr = "SET live_theme_id = :theme_id, uploaded_template = :uploaded_template, updated_at = :updated_at"

            expr_values = {
                ":theme_id": str(theme_id),
                ":uploaded_template": uploaded_template,
                ":updated_at": self._get_timestamp(),
            }

            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values,
            )

            logger.info(
                f"Updated template upload for store {store_id} (key: {metadata_key}, theme_id: {theme_id})"
            )
            return True

        except Exception as e:
            logger.error(f"Error updating template upload metadata: {e}")
            return False

    def reset_template_upload_metadata(self, fk_user_id: str) -> bool:
        """
        Reset the uploaded_template field for a user's primary store by setting it to null.

        Args:
            fk_user_id: The user's Cognito ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get the user's primary store (first active store)
            store = self.get_user_primary_store(fk_user_id)
            if not store:
                logger.warning(f"No active stores found for user {fk_user_id}")
                return False

            store_id = store.get("PK")

            # Remove the uploaded_template field and update the timestamp
            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression="REMOVE uploaded_template SET updated_at = :updated_at",
                ExpressionAttributeValues={":updated_at": self._get_timestamp()},
            )

            logger.info(f"Reset template upload metadata for store {store_id}")
            return True

        except Exception as e:
            logger.error(f"Error resetting template upload metadata: {e}")
            return False

    # Billing state helpers
    def start_free_trial(self, fk_user_id: str, trial_days: int = 3) -> bool:
        try:
            stores = self.get_user_stores(fk_user_id)
            if not stores:
                return False
            store_id = stores[0].get("PK")
            expires = (
                datetime.now(timezone.utc) + timedelta(days=trial_days)
            ).isoformat()
            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression="SET license_status = :s, license_locked = :l, license_expires_at = :e, grace_days = :g, updated_at = :u",
                ExpressionAttributeValues={
                    ":s": "trial",
                    ":l": False,
                    ":e": expires,
                    ":g": 0,
                    ":u": self._get_timestamp(),
                },
            )
            return True
        except Exception:
            return False

    def set_billing_state(
        self, fk_user_id: str, status: str, cycle_days: int = 30, grace_days: int = 7
    ) -> bool:
        """Set billing state. status in {'active','past_due','locked'}.
        active → expires_at = now + cycle_days + grace
        past_due → expires_at = now + grace
        locked → locked immediately
        """
        try:
            stores = self.get_user_stores(fk_user_id)
            if not stores:
                return False
            store_id = stores[0].get("PK")
            now = datetime.now(timezone.utc)
            if status == "active":
                expires = (now + timedelta(days=cycle_days + grace_days)).isoformat()
                locked = False
            elif status == "past_due":
                expires = (now + timedelta(days=grace_days)).isoformat()
                locked = False
            else:
                expires = now.isoformat()
                locked = True
            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression="SET license_status = :s, license_locked = :l, license_expires_at = :e, grace_days = :g, updated_at = :u",
                ExpressionAttributeValues={
                    ":s": status,
                    ":l": locked,
                    ":e": expires,
                    ":g": grace_days,
                    ":u": self._get_timestamp(),
                },
            )
            return True
        except Exception:
            return False

    def add_product_page(
        self, fk_user_id: str, product_page_info: Dict[str, Any]
    ) -> bool:
        """
        Add a product page entry to the user's store (max pages based on subscription plan)

        Args:
            fk_user_id: The user's Cognito ID
            product_page_info: Dict with product_id, product_title, category, template_number, created_at

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure user has a plan (migrate if needed)
            self.ensure_user_has_plan(fk_user_id)

            # Get user's subscription plan
            user_plan = self.get_user_plan(fk_user_id)
            max_pages = get_max_pages_for_plan(user_plan)

            logger.info(
                f"User {fk_user_id} is on {user_plan} plan with max {max_pages} pages"
            )

            # Get the user's primary store (first active store)
            store = self.get_user_primary_store(fk_user_id)
            if not store:
                logger.warning(f"No active stores found for user {fk_user_id}")
                return False
            store_id = store.get("PK")
            existing_pages = store.get("product_pages", [])
            current_count = store.get("product_pages_count", 0)

            # Check if we've reached the max limit based on plan
            if len(existing_pages) >= max_pages or current_count >= max_pages:
                logger.warning(
                    f"User {fk_user_id} has reached max product page limit ({max_pages}) for {user_plan} plan"
                )
                return False

            # Add timestamp if not provided
            if "created_at" not in product_page_info:
                product_page_info["created_at"] = self._get_timestamp()
            # Enforce free plan count = 1 explicitly (already covered by max_pages), and attach created_at always
            if user_plan == "free":
                product_page_info["plan"] = "free"

            # Add the new product page
            updated_pages = existing_pages + [product_page_info]
            new_count = len(updated_pages)

            self.stores_table_ref.update_item(
                Key={"PK": store_id},
                UpdateExpression="SET product_pages = :pages, product_pages_count = :count, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":pages": updated_pages,
                    ":count": new_count,
                    ":updated_at": self._get_timestamp(),
                },
            )

            logger.info(
                f"Added product page for store {store_id}. Total pages: {new_count}/{max_pages} ({user_plan} plan)"
            )
            return True

        except Exception as e:
            logger.error(f"Error adding product page: {e}")
            return False

    def get_store_status(self, fk_user_id: str) -> Dict[str, Any]:
        """
        Get the store status including template uploads, product pages, and plan info for a user's primary store

        Args:
            fk_user_id: The user's Cognito ID

        Returns:
            Dict with 'store_id', 'live_theme_id', 'uploaded_template', 'template_metadata', 'product_pages',
            'subscription_plan', 'max_pages', and 'plan_name'
        """
        try:
            # Ensure user has a plan (migrate if needed)
            self.ensure_user_has_plan(fk_user_id)

            # Get user's subscription plan
            user_plan = self.get_user_plan(fk_user_id)
            max_pages = get_max_pages_for_plan(user_plan)
            plan_name = get_plan_name(user_plan)

            # Get the primary store (first active store)
            store = self.get_user_primary_store(fk_user_id)
            if not store:
                return {
                    "store_id": None,
                    "has_store": False,
                    "live_theme_id": None,
                    "uploaded_template": {},
                    "template_metadata": [],
                    "product_pages": [],
                    "product_pages_count": 0,
                    "subscription_plan": user_plan,
                    "max_pages": max_pages,
                    "plan_name": plan_name,
                }

            product_pages = store.get("product_pages", [])
            # Get explicit count from DB, fallback to array length for backwards compatibility
            product_pages_count = store.get("product_pages_count", len(product_pages))
            uploaded_template = store.get("uploaded_template", {})
            if not isinstance(uploaded_template, dict):
                uploaded_template = {}
            live_theme_id = store.get("live_theme_id")

            # Convert uploaded_template to template_metadata format for backward compatibility
            template_metadata = []
            if uploaded_template:
                for category, info in uploaded_template.items():
                    if isinstance(info, dict) and "uploaded_at" in info:
                        template_metadata.append(
                            {
                                "category": category,
                                "uploaded_at": info.get("uploaded_at"),
                            }
                        )

            return {
                "store_id": store.get("PK"),
                "has_store": True,
                "live_theme_id": live_theme_id,
                "uploaded_template": uploaded_template,
                "template_metadata": template_metadata,  # For backward compatibility
                "product_pages": product_pages,
                "product_pages_count": product_pages_count,
                "subscription_plan": user_plan,
                "max_pages": max_pages,
                "plan_name": plan_name,
            }

        except Exception as e:
            logger.error(f"Error getting store status: {e}")
            return {
                "store_id": None,
                "has_store": False,
                "live_theme_id": None,
                "uploaded_template": {},
                "template_metadata": [],
                "product_pages": [],
                "product_pages_count": 0,
                "subscription_plan": DEFAULT_PLAN,
                "max_pages": get_max_pages_for_plan(DEFAULT_PLAN),
                "plan_name": get_plan_name(DEFAULT_PLAN),
            }

    # Subscription Transaction Methods
    def create_subscription_transaction(
        self, subscription_id: str, fk_user_id: str, shopify_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a subscription transaction record from Shopify webhook payload

        Args:
            subscription_id: Shopify subscription ID (primary key)
            fk_user_id: User's Cognito ID
            shopify_payload: Full webhook payload from Shopify

        Returns:
            Dict with created transaction data
        """
        try:
            # Calculate expiry date based on interval
            expiry_date = self._calculate_expiry_date(
                shopify_payload.get("created_at"),
                shopify_payload.get("interval", "every_30_days"),
            )

            # Build transaction data with only non-empty fields
            transaction_data = {
                "subscription_id": subscription_id,
                "fk_user_id": fk_user_id,
                "status": shopify_payload.get("status", "unknown"),
                "name": shopify_payload.get("name", ""),
                "currency": shopify_payload.get("currency", "USD"),
                "price": shopify_payload.get("price", ""),
                "interval": shopify_payload.get("interval", ""),
                "created_at": self._format_timestamp(shopify_payload.get("created_at")),
                "updated_at": self._format_timestamp(shopify_payload.get("updated_at")),
                "expiry_date": expiry_date,
                "webhook_received_at": self._get_timestamp(),
                "raw_payload": shopify_payload.get("raw_payload", shopify_payload),
            }

            # Only add fields that have values
            if shopify_payload.get("admin_graphql_api_id"):
                transaction_data["admin_graphql_api_id"] = shopify_payload.get(
                    "admin_graphql_api_id"
                )
            if shopify_payload.get("admin_graphql_api_shop_id"):
                transaction_data["admin_graphql_api_shop_id"] = shopify_payload.get(
                    "admin_graphql_api_shop_id"
                )
            if (
                shopify_payload.get("capped_amount")
                and shopify_payload.get("capped_amount") != "0.00"
            ):
                transaction_data["capped_amount"] = shopify_payload.get("capped_amount")
            if shopify_payload.get("plan_handle"):
                transaction_data["plan_handle"] = shopify_payload.get("plan_handle")

            self.subscription_transactions_table_ref.put_item(Item=transaction_data)

            logger.info(
                f"Created subscription transaction for user {fk_user_id}, subscription {subscription_id}"
            )
            return transaction_data

        except Exception as e:
            logger.error(f"Error creating subscription transaction: {e}")
            raise

    def get_user_subscription_transactions(
        self, fk_user_id: str
    ) -> List[Dict[str, Any]]:
        try:
            response = self.subscription_transactions_table_ref.query(
                IndexName="user-subscriptions-index",
                KeyConditionExpression="fk_user_id = :user_id",
                ExpressionAttributeValues={":user_id": fk_user_id},
            )

            return response.get("Items", [])

        except Exception as e:
            logger.error(f"Error getting user subscription transactions: {e}")
            return []

    def get_user_subscription_history(
        self, fk_user_id: str, count_only: bool = False, uninstalled: bool | None = None
    ) -> List[Dict[str, Any]]:
        try:
            if uninstalled is not None:
                response = self.subscription_history_table_ref.scan(
                    FilterExpression=Attr("user_id").eq(fk_user_id)
                    & (
                        ~Attr("uninstalled").exists()
                        | Attr("uninstalled").eq(uninstalled)
                    )
                )
            else:
                response = self.subscription_history_table_ref.scan(
                    FilterExpression=Attr("user_id").eq(fk_user_id)
                )
            if count_only:
                return len(response.get("Items", []))
            return response.get("Items", [])
        except Exception as e:
            logger.error(f"Error getting user subscription history: {e}")
            return []

    def get_user_current_subscription(
        self, fk_user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get user's current active subscription
        Checks both user_subscription_transaction and subscription_history tables

        Args:
            fk_user_id: User's Cognito ID

        Returns:
            Current subscription data or None
        """
        try:
            # First, try to get from user_subscription_transaction table
            subscriptions = self.get_user_subscription_transactions(fk_user_id)

            # If not found, also check subscription_history table (like get_store_details does)
            if not subscriptions:
                try:
                    # Query subscription_history table for this user
                    response = self.subscription_history_table_ref.scan(
                        FilterExpression=Attr("user_id").eq(fk_user_id)
                        & (
                            ~Attr("uninstalled").exists()
                            | Attr("uninstalled").eq(False)
                        )
                    )
                    subscriptions = response.get("Items", [])
                    logger.info(
                        f"Found {len(subscriptions)} subscriptions in subscription_history table for user {fk_user_id}"
                    )
                except Exception as history_error:
                    logger.warning(
                        f"Error checking subscription_history table: {history_error}"
                    )
                    subscriptions = []

            if not subscriptions:
                return None

            # Sort by created_at descending to get the latest
            subscriptions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            subscriptions_map = {}
            # Find the most recent active subscription
            for subscription in subscriptions:
                subscription_id = subscription.get("subscription_id", "")
                if subscription_id not in subscriptions_map:
                    subscriptions_map[subscription_id] = [subscription]
                else:
                    subscriptions_map[subscription_id].append(subscription)
            for subscription_id, subscriptions in subscriptions_map.items():
                sorted_subscriptions = sorted(
                    subscriptions, key=lambda x: x.get("updated_at", ""), reverse=True
                )
                latest_subscription = sorted_subscriptions[0]
                if latest_subscription.get("status") == "ACTIVE":
                    return latest_subscription
            return None

        except Exception as e:
            logger.error(f"Error getting user current subscription: {e}")
            return None

    def get_user_subscription_start_date(self, fk_user_id: str) -> Optional[str]:
        """
        Get user's subscription start date
        """
        try:
            response = self.subscription_history_table_ref.scan(
                FilterExpression=Attr("user_id").eq(fk_user_id)
                & Attr("status").eq("ACTIVE")
            )
            subscription_history = response.get("Items", [])
            if not subscription_history:
                return None
            logger.info(
                f"Found {len(subscription_history)} subscription history items for user {fk_user_id}"
            )
            subscription_history.sort(
                key=lambda x: x.get("created_at", ""), reverse=False
            )
            subscription_start_date = subscription_history[0].get("created_at", None)
            logger.info(
                f"User {fk_user_id} subscription start date: {subscription_start_date}"
            )
            return subscription_start_date
        except Exception as e:
            logger.error(f"Error getting user subscription start date: {e}")
            return None

    def create_subscription_history(
        self, app_subscription: Dict[str, Any], user_id: str = None
    ) -> Dict[str, Any]:
        """
        Create a subscription history record from Shopify webhook payload
        Stores all fields from app_subscription exactly as received

        Args:
            app_subscription: Full app_subscription object from webhook payload
            user_id: User ID from authenticated request (optional)

        Returns:
            Dict with created history record data
        """
        try:
            # Extract subscription ID from the GraphQL ID
            admin_graphql_api_id = app_subscription.get("admin_graphql_api_id", "")
            subscription_id = (
                admin_graphql_api_id.split("/")[-1] if admin_graphql_api_id else None
            )

            if not subscription_id:
                raise ValueError("No subscription ID found in app_subscription")
            pk_uuid = str(uuid.uuid4())
            # Create history record with all fields from app_subscription
            history_data = {
                "PK": pk_uuid,
                "subscription_id": subscription_id,
                "admin_graphql_api_id": app_subscription.get("admin_graphql_api_id"),
                "name": app_subscription.get("name"),
                "status": app_subscription.get("status"),
                "admin_graphql_api_shop_id": app_subscription.get(
                    "admin_graphql_api_shop_id"
                ),
                "created_at": app_subscription.get("created_at"),
                "updated_at": app_subscription.get("updated_at"),
                "currency": app_subscription.get("currency"),
                "capped_amount": app_subscription.get("capped_amount"),
                "price": app_subscription.get("price"),
                "interval": app_subscription.get("interval"),
                "plan_handle": app_subscription.get("plan_handle"),
                "webhook_received_at": self._get_timestamp(),
            }

            # Add user_id if provided
            if user_id:
                history_data["user_id"] = user_id

            # Remove None values to avoid storing null fields
            history_data = {k: v for k, v in history_data.items() if v is not None}

            self.subscription_history_table_ref.put_item(Item=history_data)

            logger.info(
                f"Created subscription history record for subscription {subscription_id}"
            )
            return history_data

        except Exception as e:
            logger.error(f"Error creating subscription history: {e}")
            raise

    def create_addon_purchase(
        self,
        charge_id: str,
        fk_user_id: str,
        addon_name: str,
        price: str,
        pages_added: int,
        shopify_payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Create an add-on purchase record in the subscription transactions table

        Args:
            charge_id: Shopify charge ID (primary key) - will be converted to string
            fk_user_id: User's Cognito ID
            addon_name: Name of the add-on purchased
            price: Price of the add-on
            pages_added: Number of pages added by this add-on
            shopify_payload: Full webhook payload from Shopify

        Returns:
            Dict with created add-on purchase data
        """
        try:
            charge_id_str = str(charge_id)

            addon_data = {
                "subscription_id": charge_id_str,  # Use charge_id as subscription_id for add-ons
                "fk_user_id": fk_user_id,
                "transaction_type": "addon_purchase",  # Mark as add-on purchase
                "plan_name": addon_name,
                "price": price,
                "currency": shopify_payload.get("currency", "USD"),
                "status": shopify_payload.get("status", "accepted"),
                "billing_cycle": "one_time",  # Add-ons are one-time purchases
                "pages_added": pages_added,
                "created_at": self._format_timestamp(shopify_payload.get("created_at")),
                "updated_at": self._format_timestamp(shopify_payload.get("updated_at")),
                "webhook_received_at": self._get_timestamp(),
                "raw_payload": shopify_payload,
            }

            # Store in subscription transactions table
            self.subscription_transactions_table_ref.put_item(Item=addon_data)

            logger.info(
                f"Created add-on purchase record for user {fk_user_id}: {addon_name} (charge_id: {charge_id_str})"
            )
            return addon_data

        except ClientError as e:
            logger.error(f"Error creating add-on purchase: {e}")
            return None

    def get_user_addon_purchases(self, cognito_user_id: str) -> List[Dict[str, Any]]:
        """
        Get all add-on purchases for a user from subscription transactions table

        Args:
            cognito_user_id: User's Cognito ID

        Returns:
            List of add-on purchase records
        """
        try:
            response = self.subscription_transactions_table_ref.query(
                IndexName="user-subscriptions-index",
                KeyConditionExpression=Key("fk_user_id").eq(cognito_user_id),
                FilterExpression=Attr("transaction_type").eq("addon_purchase"),
            )

            # Transform the data to match the expected format
            addon_purchases = []
            for item in response.get("Items", []):
                addon_purchases.append(
                    {
                        "charge_id": item.get(
                            "subscription_id"
                        ),  # Using subscription_id as charge_id
                        "addon_name": item.get("plan_name"),
                        "price": item.get("price"),
                        "pages_added": item.get("pages_added", 0),
                        "status": item.get("status"),
                        "currency": item.get("currency"),
                        "created_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                        "webhook_received_at": item.get("webhook_received_at"),
                    }
                )

            return addon_purchases

        except ClientError as e:
            logger.error(f"Error getting user add-on purchases: {e}")
            return []

    def get_user_total_addon_pages(self, cognito_user_id: str) -> int:
        """
        Get total pages added by all add-on purchases for a user

        Args:
            cognito_user_id: User's Cognito ID

        Returns:
            Total number of pages added by add-ons
        """
        try:
            addon_purchases = self.get_user_addon_purchases(cognito_user_id)
            total_pages = 0

            for purchase in addon_purchases:
                if purchase.get("status") == "accepted":  # Only count accepted add-ons
                    total_pages += purchase.get("pages_added", 0)

            return total_pages

        except Exception as e:
            logger.error(f"Error calculating total add-on pages: {e}")
            return 0

    def get_addon_purchases_by_charge_id(self, charge_id: str) -> List[Dict[str, Any]]:
        """
        Get add-on purchases by charge ID from subscription transactions table

        Args:
            charge_id: Shopify charge ID (will be converted to string)

        Returns:
            List of add-on purchase records
        """
        try:
            # Ensure charge_id is a string for DynamoDB consistency
            charge_id_str = str(charge_id)

            # Query by subscription_id (which is charge_id for add-ons)
            response = self.subscription_transactions_table_ref.get_item(
                Key={"subscription_id": charge_id_str}
            )

            item = response.get("Item")
            if item and item.get("transaction_type") == "addon_purchase":
                return [item]

            return []

        except ClientError as e:
            logger.error(f"Error getting add-on purchases by charge ID: {e}")
            return []

    def update_addon_purchase_status(
        self, charge_id: str, status: str, webhook_data: Dict[str, Any]
    ) -> bool:
        """
        Update the status of an add-on purchase

        Args:
            charge_id: Shopify charge ID (will be converted to string)
            status: New status
            webhook_data: Webhook data from Shopify

        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure charge_id is a string for DynamoDB consistency
            charge_id_str = str(charge_id)

            self.subscription_transactions_table_ref.update_item(
                Key={
                    "subscription_id": charge_id_str
                },  # Using subscription_id as primary key
                UpdateExpression="SET #status = :status, updated_at = :updated_at, webhook_data = :webhook_data",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": status,
                    ":updated_at": self._get_timestamp(),
                    ":webhook_data": webhook_data,
                },
            )

            logger.info(f"Updated add-on purchase status: {charge_id_str} -> {status}")
            return True

        except ClientError as e:
            logger.error(f"Error updating add-on purchase status: {e}")
            return False

    def check_subscription_expiry(self, fk_user_id: str) -> Dict[str, Any]:
        """
        Check if user's subscription has expired and update status

        Args:
            fk_user_id: User's Cognito ID

        Returns:
            Dict with subscription status and expiry info
        """
        try:
            current_subscription = self.get_user_current_subscription(fk_user_id)

            if not current_subscription:
                return {
                    "has_active_subscription": False,
                    "subscription": None,
                    "is_expired": False,
                }

            expiry_date = current_subscription.get("expiry_date")
            if not expiry_date:
                return {
                    "has_active_subscription": True,
                    "subscription": current_subscription,
                    "is_expired": False,
                }

            # Check if expired
            try:
                expiry_dt = datetime.fromisoformat(expiry_date.replace("Z", "+00:00"))
                is_expired = datetime.now(timezone.utc) >= expiry_dt

                if is_expired:
                    # Update subscription status to expired
                    self.update_subscription_transaction(
                        current_subscription["subscription_id"], {"status": "EXPIRED"}
                    )

                return {
                    "has_active_subscription": not is_expired,
                    "subscription": current_subscription,
                    "is_expired": is_expired,
                    "expiry_date": expiry_date,
                }

            except Exception as e:
                logger.error(f"Error checking expiry date: {e}")
                return {
                    "has_active_subscription": True,
                    "subscription": current_subscription,
                    "is_expired": False,
                }

        except Exception as e:
            logger.error(f"Error checking subscription expiry: {e}")
            return {
                "has_active_subscription": False,
                "subscription": None,
                "is_expired": False,
            }

    def get_subscription_transaction(
        self, subscription_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific subscription transaction by ID

        Args:
            subscription_id: Shopify subscription ID

        Returns:
            Subscription transaction data or None
        """
        try:
            response = self.subscription_transactions_table_ref.get_item(
                Key={"subscription_id": subscription_id}
            )

            return response.get("Item")

        except Exception as e:
            logger.error(
                f"Error getting subscription transaction {subscription_id}: {e}"
            )
            return None

    def update_subscription_transaction(
        self, subscription_id: str, updates: Dict[str, Any]
    ) -> bool:
        """
        Update a subscription transaction

        Args:
            subscription_id: Shopify subscription ID
            updates: Dictionary of fields to update

        Returns:
            True if successful, False otherwise
        """
        try:
            # Build update expression
            update_expression = "SET "
            expression_attribute_values = {}
            expression_attribute_names = {}

            for key, value in updates.items():
                if key in ["subscription_id"]:  # Skip primary key
                    continue

                attr_name = f"#{key}"
                attr_value = f":{key}"

                update_expression += f"{attr_name} = {attr_value}, "
                expression_attribute_names[attr_name] = key
                expression_attribute_values[attr_value] = value

            # Add updated_at timestamp
            update_expression += "#updated_at = :updated_at"
            expression_attribute_names["#updated_at"] = "updated_at"
            expression_attribute_values[":updated_at"] = self._get_timestamp()

            self.subscription_transactions_table_ref.update_item(
                Key={"subscription_id": subscription_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
            )

            return True

        except Exception as e:
            logger.error(f"Error updating subscription transaction: {e}")
            return False

    def update_user_plan_from_webhook(
        self, fk_user_id: str, subscription_name: str, status: str
    ) -> bool:
        """
        Update user's subscription plan based on webhook data

        Args:
            fk_user_id: User's Cognito ID
            subscription_name: Name of the subscription from Shopify
            status: Status of the subscription (active, cancelled, etc.)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Map subscription names to plan identifiers
            plan_mapping = {
                "Basic Plan": "basic",
                "Basic Plan (Monthly)": "basic",
                "Basic Plan (Yearly": "basic",
                "Pro Plan": "pro",
                "Pro Plan (Monthly)": "pro",
                "Pro Plan (Yearly": "pro",
                "Enterprise Plan": "enterprise",
                "Enterprise Plan (Monthly)": "enterprise",
                "Enterprise Plan (Yearly": "enterprise",
            }

            # Extract plan from subscription name
            plan = DEFAULT_PLAN  # Default to free
            for key, value in plan_mapping.items():
                if key.lower() in subscription_name.lower():
                    plan = value
                    break

            # Only update if subscription is active
            if status == "active":
                success = self.update_user_plan(fk_user_id, plan)
                if success:
                    logger.info(
                        f"Updated user {fk_user_id} to plan: {plan} (from subscription: {subscription_name})"
                    )
                    return True
                else:
                    logger.error(f"Failed to update user {fk_user_id} to plan: {plan}")
                    return False
            else:
                # If subscription is cancelled or inactive, set to free plan
                success = self.update_user_plan(fk_user_id, DEFAULT_PLAN)
                if success:
                    logger.info(
                        f"Set user {fk_user_id} to free plan (subscription status: {status})"
                    )
                    return True
                else:
                    logger.error(f"Failed to set user {fk_user_id} to free plan")
                    return False

        except Exception as e:
            logger.error(f"Error updating user plan from webhook: {e}")
            return False

    def get_recent_subscription_transactions(
        self, fk_user_id: str, time_window_minutes: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get recent subscription transactions for a user within a time window

        Args:
            fk_user_id: User's Cognito ID
            time_window_minutes: Time window in minutes to look for recent transactions

        Returns:
            List of recent subscription transactions
        """
        try:
            from datetime import datetime, timezone, timedelta

            # Calculate the time threshold
            time_threshold = datetime.now(timezone.utc) - timedelta(
                minutes=time_window_minutes
            )

            # Query subscription transactions for the user
            subscriptions_table = self.dynamodb.Table("subscription_transactions")

            # Use scan with filter since GSI might not exist
            from app.modules.database.conditions import Attr, Key

            response = subscriptions_table.scan(
                FilterExpression=Attr("fk_user_id").eq(fk_user_id)
                & Attr("webhook_received_at").gte(time_threshold.isoformat()),
                Limit=10,  # Limit to recent transactions
            )

            transactions = response.get("Items", [])

            # Sort by webhook_received_at descending (most recent first)
            transactions.sort(
                key=lambda x: x.get("webhook_received_at", ""), reverse=True
            )

            logger.info(
                f"Found {len(transactions)} recent subscription transactions for user {fk_user_id}"
            )

            return transactions

        except Exception as e:
            logger.error(
                f"Error getting recent subscription transactions for user {fk_user_id}: {e}"
            )
            return []

    def should_store_subscription_transaction(
        self, fk_user_id: str, status: str, subscription_name: str
    ) -> bool:
        """
        Determine if a subscription transaction should be stored based on recent activity

        Args:
            fk_user_id: User's Cognito ID
            status: Status of the current subscription (ACTIVE, CANCELLED, etc.)
            subscription_name: Name of the subscription

        Returns:
            True if the transaction should be stored, False otherwise
        """
        try:
            # Get recent transactions for this user
            recent_transactions = self.get_recent_subscription_transactions(
                fk_user_id, time_window_minutes=5
            )

            if not recent_transactions:
                # No recent transactions, store this one
                logger.info(
                    f"No recent transactions found for user {fk_user_id}, storing current transaction"
                )
                return True

            # Check if there are multiple recent transactions
            if len(recent_transactions) >= 1:
                # Check if there are any recent ACTIVE transactions
                has_recent_active = any(
                    t.get("status") == "ACTIVE" for t in recent_transactions
                )

                # If current status is CANCELLED and there are recent ACTIVE transactions, don't store
                if status == "CANCELLED" and has_recent_active:
                    logger.info(
                        f"Skipping CANCELLED subscription for user {fk_user_id} (plan change detected - recent ACTIVE found)"
                    )
                    return False
                # If current status is ACTIVE, always store it (new subscription)
                elif status == "ACTIVE":
                    logger.info(
                        f"Storing ACTIVE subscription for user {fk_user_id} (new subscription)"
                    )
                    return True
                # If current status is CANCELLED but no recent ACTIVE, store it (direct cancellation)
                elif status == "CANCELLED" and not has_recent_active:
                    logger.info(
                        f"Storing CANCELLED subscription for user {fk_user_id} (direct cancellation)"
                    )
                    return True
                else:
                    # Other statuses, store them
                    logger.info(f"Storing {status} subscription for user {fk_user_id}")
                    return True
            else:
                # No recent transactions, store this one
                logger.info(
                    f"No recent transactions found for user {fk_user_id}, storing current transaction"
                )
                return True

        except Exception as e:
            logger.error(
                f"Error determining if subscription should be stored for user {fk_user_id}: {e}"
            )
            # On error, default to storing the transaction
            return True

    def get_free_generated_page(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a free generated page for a user
        """
        try:
            generated_pages_table = self.pages_table_ref

            filter_expression = Attr("user_id").eq(user_id) & Attr("is_free").eq(True)
            response = generated_pages_table.scan(FilterExpression=filter_expression)
            items = response.get("Items", [])
            if items:
                return items[0]
            else:
                return None
        except Exception as e:
            logger.error(f"Error getting free generated page for user {user_id}: {e}")
            return None

    def update_shop_details(self, user_id, update_dict):
        """
        Update shop details in the 'shops' table

        Args:
            user_id: User's Cognito ID
            update_dict: Dictionary of fields to update

        Returns:
            True if successful, False otherwise
        """
        if not user_id or not update_dict:
            return False

        try:
            shop = self.get_shop_details(user_id)
            if not shop:
                return False
            shop.update(update_dict)
            self.shops_table_ref.put_item(Item=shop)
            return True
        except Exception as e:
            logger.error(f"Error updating shop details for user {user_id}: {e}")
            return False

    # ---------------------------------------------------------------
    # Brand DNA persistence (roarr_user_dna / roarr_user_dna_dev)
    # ---------------------------------------------------------------
    def save_user_dna(
        self,
        shopify_domain: str,
        brand_dna: Dict[str, Any],
        storefront_signals: Optional[Dict[str, Any]] = None,
        store_url: Optional[str] = None,
        dna_products: Optional[Any] = None,
    ) -> bool:
        """Create or replace the Brand DNA record for a shop.

        The table uses ``shopify_domain`` as the partition key (PK).

        ``dna_products`` is the catalog snapshot used for DNA (same shape as the
        app's ``buildProductsPayload``: id, title, description, images[] URL strings).
        Omit to keep any existing ``dna_products`` on update-like saves.
        """
        if not shopify_domain:
            logger.warning("save_user_dna called without a shopify_domain")
            return False

        try:
            now = self._get_timestamp()
            existing = self.get_user_dna(shopify_domain) or {}

            # Normalize: always store the flat brand-dna profile, even if the
            # caller passed it wrapped under {"BrandDNAProfile": {...}}.
            normalized_dna = brand_dna or {}
            if (
                isinstance(normalized_dna, dict)
                and "BrandDNAProfile" in normalized_dna
                and isinstance(normalized_dna["BrandDNAProfile"], dict)
            ):
                normalized_dna = normalized_dna["BrandDNAProfile"]

            if dna_products is not None:
                stored_products = dna_products
            else:
                stored_products = existing.get("dna_products") or []

            item = {
                "PK": shopify_domain,
                "user_id": shopify_domain,
                "shopify_domain": shopify_domain,
                "brand_dna": self._convert_floats_to_decimal(normalized_dna),
                "storefront_signals": self._convert_floats_to_decimal(
                    storefront_signals or {}
                ),
                "dna_products": self._convert_floats_to_decimal(stored_products),
                "store_url": store_url or existing.get("store_url") or "",
                "brand_name": normalized_dna.get("brand_name")
                or existing.get("brand_name")
                or "",
                "created_at": existing.get("created_at") or now,
                "updated_at": now,
                "version": int(existing.get("version", 0)) + 1,
            }
            self.user_dna_table_ref.put_item(Item=item)
            logger.info(f"Saved Brand DNA for shop {shopify_domain}")
            return True
        except Exception as e:
            logger.error(f"Error saving Brand DNA for shop {shopify_domain}: {e}")
            return False

    def get_user_dna(self, shopify_domain: str) -> Optional[Dict[str, Any]]:
        """Fetch the persisted Brand DNA for a shop, if any."""
        if not shopify_domain:
            return None
        try:
            response = self.user_dna_table_ref.get_item(Key={"PK": shopify_domain})
            return response.get("Item")
        except Exception as e:
            logger.error(f"Error fetching Brand DNA for shop {shopify_domain}: {e}")
            return None

    def update_user_dna(
        self, shopify_domain: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Apply partial updates to a shop's Brand DNA record.

        ``updates`` can contain top-level keys (``brand_dna``, ``brand_name``,
        ``store_url`` ...) or any subset of Brand DNA fields, in which case
        they are merged into the stored ``brand_dna`` map.

        Returns the updated item, or None on error.
        """
        if not shopify_domain or not isinstance(updates, dict) or not updates:
            return None

        try:
            existing = self.get_user_dna(shopify_domain) or {
                "PK": shopify_domain,
                "user_id": shopify_domain,
                "shopify_domain": shopify_domain,
                "brand_dna": {},
                "storefront_signals": {},
                "dna_products": [],
                "store_url": "",
                "brand_name": "",
                "created_at": self._get_timestamp(),
                "version": 0,
            }

            current_dna = dict(existing.get("brand_dna") or {})

            # Allow merging via either an explicit `brand_dna` blob or a
            # `dna_patch` dict of partial fields.
            if isinstance(updates.get("brand_dna"), dict):
                incoming = updates["brand_dna"]
                if (
                    "BrandDNAProfile" in incoming
                    and isinstance(incoming["BrandDNAProfile"], dict)
                ):
                    incoming = incoming["BrandDNAProfile"]
                current_dna.update(incoming)
            if isinstance(updates.get("dna_patch"), dict):
                current_dna.update(updates["dna_patch"])

            # Top-level field shortcuts -> map into brand_dna for convenience.
            DNA_FIELDS = {
                "brand_name",
                "tagline",
                "primary_colors",
                "accent_colors",
                "brand_values",
                "brand_aesthetic",
                "tone_chips",
                "tone_of_voice",
                "tone_description",
                "target_audience",
                "business_overview",
                "key_messages",
                "product_categories",
                "industry",
                "selling_outlook",
                "visual_style",
                "visual_description",
                "hero_products",
            }
            for k in DNA_FIELDS:
                if k in updates:
                    current_dna[k] = updates[k]

            new_item = {
                **existing,
                "PK": shopify_domain,
                "user_id": shopify_domain,
                "shopify_domain": shopify_domain,
                "brand_dna": self._convert_floats_to_decimal(current_dna),
                "brand_name": current_dna.get("brand_name")
                or existing.get("brand_name")
                or "",
                "updated_at": self._get_timestamp(),
                "version": int(existing.get("version", 0)) + 1,
            }
            if "store_url" in updates:
                new_item["store_url"] = updates["store_url"] or new_item.get(
                    "store_url", ""
                )
            if isinstance(updates.get("storefront_signals"), dict):
                new_item["storefront_signals"] = self._convert_floats_to_decimal(
                    updates["storefront_signals"]
                )
            if isinstance(updates.get("dna_products"), list):
                new_item["dna_products"] = self._convert_floats_to_decimal(
                    updates["dna_products"]
                )
            elif isinstance(updates.get("products"), list):
                new_item["dna_products"] = self._convert_floats_to_decimal(
                    updates["products"]
                )

            self.user_dna_table_ref.put_item(Item=new_item)
            logger.info(f"Updated Brand DNA for shop {shopify_domain}")
            return new_item
        except Exception as e:
            logger.error(f"Error updating Brand DNA for shop {shopify_domain}: {e}")
            return None

    # ---------------------------------------------------------------
    # Generated brand-ad campaigns (roarr_user_campaigns / dev_*)
    #
    # Schema (per row):
    #   HASH  PK (string) = campaign_id (uuid)
    #   RANGE SK (string) = campaign_id — same value as PK; Dynamo requires a
    #       composite key here; logical key is still a single ``campaign_id``.
    # Plain attributes: user_id (shop owner), creatives, idea/product snapshots,
    # timestamps.
    # ---------------------------------------------------------------

    @staticmethod
    def _user_campaign_table_key(campaign_id: str) -> Dict[str, str]:
        """Primary key for the campaigns table (PK + SK both set to campaign id)."""
        return {"PK": campaign_id, "SK": campaign_id}

    def save_user_campaign(
        self,
        user_id: str,
        campaign_data: Dict[str, Any],
        campaign_id: Optional[str] = None,
        cost_charged: int = 0,
    ) -> Optional[Dict[str, Any]]:
        """Persist a newly generated campaign row.

        ``campaign_data`` is expected to include at minimum:
            - ``brand_name``
            - ``product``  (dict snapshot of the chosen product)
            - ``idea``     (dict of the chosen campaign idea)
            - ``creatives``: ``[{ creative_id?, image_url, ... }]``

        PK is ``campaign_id`` (uuid), stored on both ``PK`` and ``SK`` for
        composite-key Dynamo layout. ``user_id`` is the owning shop /
        authenticated user id (typically myshopify domain).

        ``cost_charged`` is the credits spent on initial generation (0 for
        internal stores or fully free flows).

        Returns the created item, or None on error.
        """
        if not user_id:
            logger.warning("save_user_campaign called without user_id")
            return None

        try:
            now = self._get_timestamp()
            cid = campaign_id or str(uuid.uuid4())

            data = campaign_data or {}
            percentage = data.get("generation_percentage")
            if percentage is None:
                percentage = 100
            raw_creatives = data.get("creatives") or []
            if not isinstance(raw_creatives, list):
                raw_creatives = []

            creatives: List[Dict[str, Any]] = []
            for i, c in enumerate(raw_creatives):
                if not isinstance(c, dict):
                    continue
                row = dict(c)
                if not row.get("creative_id") and not row.get("id"):
                    row["creative_id"] = str(i)
                creatives.append(row)

            item = {
                "PK": cid,
                "SK": cid,
                "campaign_id": cid,
                "user_id": user_id,
                "brand_name": data.get("brand_name") or "",
                "product": self._convert_floats_to_decimal(data.get("product") or {}),
                "idea": self._convert_floats_to_decimal(data.get("idea") or {}),
                "creatives": self._convert_floats_to_decimal(creatives),
                "generation_cost": int(cost_charged or 0),
                "generation_status": data.get("generation_status") or "completed",
                "generation_percentage": int(percentage),
                "created_at": now,
                "updated_at": now,
                "version": 1,
            }
            if data.get("generation_error"):
                item["generation_error"] = str(data.get("generation_error"))
            if data.get("spend_ledger_id"):
                item["spend_ledger_id"] = str(data.get("spend_ledger_id"))
            self.user_campaigns_table_ref.put_item(Item=item)
            logger.info(f"Saved campaign row PK={cid} for user_id={user_id}")
            return item
        except Exception as e:
            logger.error(f"Error saving campaign for user {user_id}: {e}")
            return None

    def get_user_campaign(
        self,
        campaign_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Fetch one campaign row. If ``user_id`` is passed, enforce ownership."""
        if not campaign_id:
            return None
        try:
            response = self.user_campaigns_table_ref.get_item(
                Key=self._user_campaign_table_key(campaign_id)
            )
            item = response.get("Item")
            if not item:
                return None
            if user_id is not None and item.get("user_id") != user_id:
                return None
            return item
        except Exception as e:
            logger.error(
                f"Error fetching campaign PK={campaign_id}: {e}"
            )
            return None

    def list_user_campaigns(self, user_id: str) -> List[Dict[str, Any]]:
        """Return all campaign rows for a user (most recent first). Uses scan."""
        if not user_id:
            return []
        try:
            items: List[Dict[str, Any]] = []
            scan_kwargs: Dict[str, Any] = {
                "FilterExpression": Attr("user_id").eq(user_id),
            }
            while True:
                resp = self.user_campaigns_table_ref.scan(**scan_kwargs)
                items.extend(resp.get("Items", []))
                last_key = resp.get("LastEvaluatedKey")
                if not last_key:
                    break
                scan_kwargs["ExclusiveStartKey"] = last_key
            items.sort(key=lambda i: i.get("created_at") or "", reverse=True)
            return items
        except Exception as e:
            logger.error(f"Error listing campaigns for user_id={user_id}: {e}")
            return []

    def update_user_campaign_creatives(
        self,
        user_id: str,
        campaign_id: str,
        creatives: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """Replace the full creatives array (e.g. user-approved regen). Ownership enforced."""
        if not user_id or not campaign_id:
            return None
        try:
            item = self.get_user_campaign(campaign_id, user_id=user_id)
            if not item:
                return None
            raw = creatives or []
            if not isinstance(raw, list):
                return None
            normalized: List[Dict[str, Any]] = []
            for i, c in enumerate(raw):
                if not isinstance(c, dict):
                    continue
                row = dict(c)
                if not row.get("creative_id") and not row.get("id"):
                    row["creative_id"] = str(i)
                normalized.append(row)

            item["creatives"] = self._convert_floats_to_decimal(normalized)
            item["updated_at"] = self._get_timestamp()
            item["version"] = int(item.get("version", 0)) + 1

            self.user_campaigns_table_ref.put_item(Item=item)
            logger.info(
                f"Updated creatives for campaign {campaign_id} (user_id={user_id}, "
                f"n={len(normalized)})"
            )
            return item
        except Exception as e:
            logger.error(
                f"Error updating creatives for campaign {campaign_id}: {e}"
            )
            return None

    def update_user_campaign_generation(
        self,
        user_id: str,
        campaign_id: str,
        generation_status: Optional[str] = None,
        generation_percentage: Optional[int] = None,
        creatives: Optional[List[Dict[str, Any]]] = None,
        generation_error: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update generation lifecycle fields for a brand-ad campaign row."""
        if not user_id or not campaign_id:
            return None
        try:
            item = self.get_user_campaign(campaign_id, user_id=user_id)
            if not item:
                return None

            if generation_status is not None:
                item["generation_status"] = str(generation_status)
            if generation_percentage is not None:
                item["generation_percentage"] = int(generation_percentage)
            if creatives is not None:
                normalized: List[Dict[str, Any]] = []
                for i, c in enumerate(creatives or []):
                    if not isinstance(c, dict):
                        continue
                    row = dict(c)
                    if not row.get("creative_id") and not row.get("id"):
                        row["creative_id"] = str(i)
                    normalized.append(row)
                item["creatives"] = self._convert_floats_to_decimal(normalized)
            if generation_error is not None:
                if generation_error:
                    item["generation_error"] = str(generation_error)
                else:
                    item.pop("generation_error", None)

            item["updated_at"] = self._get_timestamp()
            item["version"] = int(item.get("version", 0)) + 1
            self.user_campaigns_table_ref.put_item(Item=item)
            logger.info(
                f"Updated generation status for campaign {campaign_id} "
                f"(user_id={user_id}, status={item.get('generation_status')})"
            )
            return item
        except Exception as e:
            logger.error(
                f"Error updating campaign generation for {campaign_id}: {e}"
            )
            return None

    def create_generated_page(
        self,
        user_id: str,
        generation_data: Optional[Dict[str, Any]] = None,
        metadata: Dict[str, Any] = None,
        page_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Store a generated page in the 'generated-pages' table

        Args:
            user_id: User's Cognito ID or Shopify domain
            generation_data: The complete generation data (text, images, color_schemes, etc.). Can be None.
            metadata: Optional metadata (product_title, category, template, etc.)
            page_id: Optional pre-minted page id. If None, a uuid4 is generated.
                     Useful when the caller needs a stable id for credit tracking
                     (so the same id is used as the wallet spend reference_id).

        Returns:
            Dict with created page data including page_id
        """
        try:

            if not page_id:
                page_id = str(uuid.uuid4())

            # Get table reference
            generated_pages_table = self.pages_table_ref

            # Check if user has any existing pages
            existing_pages_count = self.count_user_generations(user_id)
            is_free = (
                existing_pages_count == 0
            )  # Mark as free if this is the first page

            # Prepare page item
            page_item = {
                "PK": page_id,  # Primary key - unique page ID
                "user_id": user_id,
                "generation_data": generation_data,  # Can be None
                "published": False,  # Default to unpublished
                "generation_percentage": 0,  # Initialize percentage to 0
                "is_free": is_free,  # True if this is the first page, False otherwise
                "created_at": self._get_timestamp(),
                "updated_at": self._get_timestamp(),
            }

            # Add metadata if provided
            if metadata:
                page_item.update(metadata)

            # Store in DynamoDB
            generated_pages_table.put_item(Item=page_item)

            logger.info(f"Created generated page {page_id} for user {user_id}")
            return {"page_id": page_id, **page_item}

        except Exception as e:
            logger.error(f"Error creating generated page: {e}")
            raise

    def get_user_generated_pages(
        self,
        user_id: str,
        published: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Get generated pages for a user from the 'generated-pages' table with pagination

        Args:
            user_id: User's Cognito ID or Shopify domain
            published: Optional filter for published status (True/False). If None, returns both.
            limit: Maximum number of items to return (default: 20)
            offset: Number of items to skip (default: 0)

        Returns:
            Dict with 'items' (list of pages), 'total' (total count), 'limit', 'offset', 'has_more'
        """
        logger.info(
            f"Getting generated pages for user_id={user_id}, published={published}, "
            f"limit={limit}, offset={offset}"
        )
        try:
            generated_pages_table = self.pages_table_ref

            # Build filter expression
            logger.debug(f"Building filter expression for user_id={user_id}")
            filter_expression = Attr("user_id").eq(user_id)

            # Add published filter if specified
            if published is not None:
                logger.debug(f"Adding published filter: published={published}")
                filter_expression = filter_expression & Attr("published").eq(published)
            else:
                logger.debug(
                    "No published filter applied, will return both published and unpublished"
                )

            # Scan table with filter
            logger.debug("Starting initial scan operation")
            response = generated_pages_table.scan(FilterExpression=filter_expression)

            pages = response.get("Items", [])
            logger.info(f"Initial scan returned {len(pages)} items")

            # Handle pagination to get all items (for total count)
            pagination_count = 0
            while "LastEvaluatedKey" in response:
                pagination_count += 1
                logger.debug(
                    f"Pagination iteration {pagination_count}: "
                    f"LastEvaluatedKey exists, fetching more items"
                )
                response = generated_pages_table.scan(
                    FilterExpression=filter_expression,
                    ExclusiveStartKey=response["LastEvaluatedKey"],
                )
                new_items = response.get("Items", [])
                pages.extend(new_items)
                logger.debug(
                    f"Pagination iteration {pagination_count}: "
                    f"Retrieved {len(new_items)} additional items "
                    f"(total so far: {len(pages)})"
                )

            if pagination_count > 0:
                logger.info(
                    f"Completed pagination: {pagination_count} additional scan(s) "
                    f"retrieved total of {len(pages)} items"
                )

            # Sort by created_at descending (most recent first)
            logger.debug(f"Sorting {len(pages)} pages by created_at descending")
            pages.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            logger.debug("Sorting completed")

            # Get total count before pagination
            total_count = len(pages)
            logger.debug(f"Total pages after filtering and sorting: {total_count}")

            # Apply pagination (offset and limit)
            logger.debug(
                f"Applying pagination: offset={offset}, limit={limit} "
                f"to {total_count} total items"
            )
            paginated_pages = pages[offset : offset + limit]
            has_more = (offset + limit) < total_count

            logger.info(
                f"Retrieved {len(paginated_pages)} generated pages for user {user_id} "
                f"(total: {total_count}, offset: {offset}, limit: {limit}, "
                f"has_more: {has_more}, published_filter: {published})"
            )

            return {
                "items": paginated_pages,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": has_more,
            }

        except Exception as e:
            logger.error(
                f"Error getting user generated pages for user_id={user_id}, "
                f"published={published}, limit={limit}, offset={offset}: {e}",
                exc_info=True,
            )
            return {
                "items": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "has_more": False,
            }

    def has_published_store_generations(self, user_id: str) -> bool:
        """
        Check if a user has any published store generations (pages)
        """
        try:
            generated_pages_table = self.pages_table_ref
            filter_expression = (
                Attr("user_id").eq(user_id)
                & Attr("published").eq(True)
                & Attr("generation_type").eq("store")
            )
            response = generated_pages_table.scan(FilterExpression=filter_expression)
            return len(response.get("Items", [])) > 0
        except Exception as e:
            logger.error(
                f"Error checking if user has published store generations for user_id={user_id}: {e}"
            )
            return False

    def has_published_generations(self, user_id: str) -> bool:
        """
        Check if a user has any published generations (pages)
        """
        try:
            pages = self.get_user_generated_pages(
                user_id=user_id,
                published=True,
                limit=1,
                offset=0,
            )
            return len(pages.get("items", [])) > 0
        except Exception as e:
            logger.error(
                f"Error checking if user has published generations for user_id={user_id}: {e}"
            )
            return False

    def count_user_generations(self, user_id: str) -> int:
        """
        Count total number of generations (pages) created by a user

        Args:
            user_id: User's Cognito ID

        Returns:
            Total count of generations
        """
        try:
            # Use get_user_generated_pages to get total count
            result = self.get_user_generated_pages(
                user_id=user_id,
                published=None,  # Count all pages regardless of published status
                limit=1,  # We only need the total count
                offset=0,
            )
            return result.get("total", 0)
        except Exception as e:
            logger.error(f"Error counting user generations for user_id={user_id}: {e}")
            return 0

    def count_user_generations_in_month(self, user_id: str) -> int:
        """
        Count number of generations (pages) created by a user in the calendar month
        of their 1st active subscription date (UTC). If no active subscription exists,
        returns 0.

        Args:
            user_id: User's Cognito ID or Shopify domain

        Returns:
            Count of generations created in that month
        """
        try:
            store = self.get_shop_details(user_id)
            if not store:
                return 0

            last_payment_date = None

            if user_id:
                try:
                    # Query subscription_history table for this user
                    subscription = self.get_user_current_subscription(user_id)
                    subscription_start_date = self.get_user_subscription_start_date(
                        user_id
                    )
                    latest_subscription_created_date = subscription_start_date
                    # Initialize subscription_interval to None, then get it from subscription if available
                    subscription_interval = None
                    if subscription and subscription.get("status") == "ACTIVE":
                        subscription_interval = subscription.get("interval")
                        print(
                            "latest_subscription_created_date",
                            latest_subscription_created_date,
                        )
                        print("subscription_interval", subscription_interval)
                    elif subscription:
                        # Get interval even if subscription is not active (for reference)
                        subscription_interval = subscription.get("interval")

                    # Calculate last payment date based on subscription creation date and interval
                    if latest_subscription_created_date:
                        last_payment_date = latest_subscription_created_date
                        try:
                            # Parse the subscription creation date (Shopify uses ISO 8601 format)
                            subscription_date = datetime.fromisoformat(
                                latest_subscription_created_date.replace("Z", "+00:00")
                            )
                            # Get the day and month from subscription creation date
                            subscription_day = subscription_date.day
                            subscription_month = subscription_date.month

                            # Get today's date
                            today = (
                                datetime.now(subscription_date.tzinfo)
                                if subscription_date.tzinfo
                                else datetime.now()
                            )

                            # Determine if interval is annual (otherwise assume monthly)
                            is_annual = (
                                subscription_interval is not None
                                and subscription_interval.lower() == "annual"
                            )

                            if is_annual:
                                # Annual subscription: calculate based on yearly intervals
                                # If today's month/day >= subscription month/day: last payment is this year on that date
                                # If today's month/day < subscription month/day: last payment was last year on that date
                                current_year = today.year

                                # Try to create the payment date for this year
                                try:
                                    this_year_payment = today.replace(
                                        year=current_year,
                                        month=subscription_month,
                                        day=subscription_day,
                                    )
                                except ValueError:
                                    # Handle edge case where subscription_day doesn't exist in current month
                                    # (e.g., Feb 30 doesn't exist, use last day of month)
                                    if (
                                        subscription_month == 2
                                        and subscription_day > 28
                                    ):
                                        # For February, use the 28th (or 29th in leap year)
                                        last_day_feb = (
                                            29
                                            if (
                                                current_year % 4 == 0
                                                and (
                                                    current_year % 100 != 0
                                                    or current_year % 400 == 0
                                                )
                                            )
                                            else 28
                                        )
                                        this_year_payment = today.replace(
                                            year=current_year,
                                            month=subscription_month,
                                            day=min(subscription_day, last_day_feb),
                                        )
                                    else:
                                        # For other months, use last day of that month
                                        last_day = monthrange(
                                            current_year, subscription_month
                                        )[1]
                                        this_year_payment = today.replace(
                                            year=current_year,
                                            month=subscription_month,
                                            day=min(subscription_day, last_day),
                                        )

                                if today >= this_year_payment:
                                    # Last payment was this year on the subscription date
                                    last_payment_date = this_year_payment
                                else:
                                    # Last payment was last year on the subscription date
                                    last_year = current_year - 1
                                    try:
                                        last_payment_date = today.replace(
                                            year=last_year,
                                            month=subscription_month,
                                            day=subscription_day,
                                        )
                                    except ValueError:
                                        # Handle edge case for last year
                                        last_day = monthrange(
                                            last_year, subscription_month
                                        )[1]
                                        last_payment_date = today.replace(
                                            year=last_year,
                                            month=subscription_month,
                                            day=min(subscription_day, last_day),
                                        )
                            else:
                                # Monthly subscription (every_30_days or default): calculate based on monthly intervals
                                # If today's day >= subscription day: last payment is this month on that day
                                # If today's day < subscription day: last payment was last month on that day
                                if today.day >= subscription_day:
                                    # Last payment was this month on the subscription day
                                    try:
                                        last_payment_date = today.replace(
                                            day=subscription_day
                                        )
                                    except ValueError:
                                        # Handle edge case where subscription_day doesn't exist in current month
                                        # (e.g., Feb 30 doesn't exist, use last day of month)
                                        last_day = monthrange(today.year, today.month)[
                                            1
                                        ]
                                        last_payment_date = today.replace(
                                            day=min(subscription_day, last_day)
                                        )
                                else:
                                    # Last payment was last month on the subscription day
                                    # Go to first day of current month, then subtract one day to get last month
                                    first_of_month = today.replace(day=1)
                                    last_month = first_of_month - timedelta(days=1)
                                    # Set to the subscription day of last month
                                    try:
                                        last_payment_date = last_month.replace(
                                            day=subscription_day
                                        )
                                    except ValueError:
                                        # Handle edge case where subscription_day doesn't exist in last month
                                        last_payment_date = last_month.replace(
                                            day=min(subscription_day, last_month.day)
                                        )

                            # Apply the time part (hour, minute, second, microsecond, timezone) from subscription_date to last_payment_date
                            last_payment_date = last_payment_date.replace(
                                hour=subscription_date.hour,
                                minute=subscription_date.minute,
                                second=subscription_date.second,
                                microsecond=subscription_date.microsecond,
                                tzinfo=subscription_date.tzinfo,
                            )

                            # Format as ISO string for consistency
                            last_payment_date = last_payment_date.isoformat()
                        except (ValueError, AttributeError) as date_error:
                            logger.error(
                                f"Error calculating last payment date: {str(date_error)}"
                            )
                            last_payment_date = None

                except Exception as history_error:
                    logger.error(
                        f"Error fetching subscription history: {str(history_error)}"
                    )
                products_count_after_payment = 0

                # Get the pages table reference
                pages_table = self.pages_table_ref
                if last_payment_date and user_id:
                    try:

                        # Parse the payment date string to datetime object
                        current_date = datetime.now(timezone.utc)
                        payment_date_str = last_payment_date
                        if payment_date_str.endswith("Z"):
                            # Convert Z to +00:00 for parsing
                            payment_date_str = payment_date_str.replace("Z", "+00:00")

                        # Parse to datetime object
                        payment_date_obj = datetime.fromisoformat(payment_date_str)

                        # If no timezone info, assume UTC
                        if payment_date_obj.tzinfo is None:
                            payment_date_obj = payment_date_obj.replace(
                                tzinfo=timezone.utc
                            )

                        # Convert to UTC for consistent comparison (created_at is stored in UTC)
                        payment_date_utc = payment_date_obj.astimezone(timezone.utc)

                        # Format back to ISO string in UTC for DynamoDB comparison
                        payment_date_str = payment_date_utc.isoformat()

                        # Build filter expression for non-free products: user_id equals and updated_at >= last_payment_date
                        filter_expression = (
                            Attr("user_id").eq(user_id)
                            & Attr("updated_at").between(
                                payment_date_str, current_date.isoformat()
                            )
                            # & Attr("published").eq(True)
                        )

                        response = pages_table.scan(FilterExpression=filter_expression)

                        all_items = response.get("Items", [])

                        # Handle pagination to get all matching items
                        while "LastEvaluatedKey" in response:
                            response = pages_table.scan(
                                FilterExpression=filter_expression,
                                ExclusiveStartKey=response["LastEvaluatedKey"],
                            )
                            all_items.extend(response.get("Items", []))

                        # Filter out free products from the date-filtered results
                        non_free_items = []
                        for item in all_items:
                            # Exclude free products from the count (they're fetched separately)
                            if item.get("is_free") is not True:
                                non_free_items.append(item)

                        # Count only non-free products
                        products_count_after_payment = len(non_free_items)
                        published_products_count_after_payment = len(
                            [
                                item
                                for item in non_free_items
                                if item.get("published") is True
                            ]
                        )
                        return products_count_after_payment

                    except Exception as pages_error:
                        logger.error(
                            f"Error fetching generated pages for counting: {str(pages_error)}"
                        )
                        return 0
                        # Continue without product count if there's an error
                else:
                    print("No last_payment_date or user_id")
                    # Continue without subscription history if there's an error

        except Exception as e:
            logger.error(
                f"Error counting user generations in month for user_id={user_id}: {e}",
                exc_info=True,
            )
            return 0

    def get_generated_page_by_id(self, page_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a generated page by its page_id (PK)

        Args:
            page_id: The page ID (PK) to retrieve

        Returns:
            Dict with page data if found, None otherwise
        """
        try:
            logger.info(f"Getting generated page {page_id}")

            # Get table reference
            generated_pages_table = self.pages_table_ref

            # Get the page by PK
            response = generated_pages_table.get_item(Key={"PK": page_id})

            if "Item" in response:
                logger.info(f"Successfully retrieved page {page_id}")
                return response["Item"]
            else:
                logger.warning(f"Page {page_id} not found")
                return None

        except Exception as e:
            logger.error(f"Error getting generated page {page_id}: {e}", exc_info=True)
            return None

    def update_generated_page(
        self,
        page_id: str,
        generation_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        published: Optional[bool] = None,
        generation_status: Optional[str] = None,
        step: Optional[int] = None,
        **kwargs,
    ) -> bool:
        """
        Unified method to update a generated page with various fields.

        Args:
            page_id: The page ID (PK) to update
            generation_data: The complete generation data (text, images, color_schemes, etc.)
            metadata: Dict with metadata fields to update (e.g., new_product_id, product_id, etc.)
            published: Published status (True/False)
            generation_status: The generation status ("in_progress", "completed", "failed")
            step: Step number to set
            **kwargs: Additional fields to update

        Returns:
            True if successful, False otherwise
        """
        try:
            # Collect all fields to update
            fields_to_update = {}

            if generation_data is not None:
                fields_to_update["generation_data"] = generation_data

            if metadata:
                fields_to_update.update(metadata)

            if published is not None:
                fields_to_update["published"] = published

            if generation_status is not None:
                fields_to_update["generation_status"] = generation_status

            if step is not None:
                fields_to_update["step"] = step

            # Add any additional kwargs
            if kwargs:
                fields_to_update.update(kwargs)

            # boto3 DynamoDB serializer rejects Python float; nested structures (e.g.
            # generation_data.collections[].confidence) must use Decimal.
            fields_to_update = self._convert_floats_to_decimal(fields_to_update)

            if not fields_to_update:
                logger.warning(f"No fields to update for page_id={page_id}")
                return False

            logger.info(
                f"Updating page_id={page_id} with fields: {list(fields_to_update.keys())}"
            )

            # Get table reference
            generated_pages_table = self.pages_table_ref

            # Build update expression dynamically.
            # Always alias attribute names — DynamoDB rejects reserved words like
            # mode, status, step, data, name, etc. if used bare in UpdateExpression.
            update_expression_parts = []
            expression_attribute_values = {}
            expression_attribute_names = {}

            for key, value in fields_to_update.items():
                name_token = f"#f_{key}"
                value_token = f":v_{key}"
                update_expression_parts.append(f"{name_token} = {value_token}")
                expression_attribute_names[name_token] = key
                expression_attribute_values[value_token] = value

            # Always add updated_at
            update_expression_parts.append("#f_updated_at = :v_updated_at")
            expression_attribute_names["#f_updated_at"] = "updated_at"
            expression_attribute_values[":v_updated_at"] = self._get_timestamp()

            update_expression = "SET " + ", ".join(update_expression_parts)

            update_params = {
                "Key": {"PK": page_id},
                "UpdateExpression": update_expression,
                "ExpressionAttributeValues": expression_attribute_values,
                "ExpressionAttributeNames": expression_attribute_names,
            }

            # Update the page
            generated_pages_table.update_item(**update_params)

            logger.info(
                f"Successfully updated page_id={page_id} with fields: {list(fields_to_update.keys())}"
            )
            return True

        except Exception as e:
            logger.error(
                f"Error updating page_id={page_id}: {e}",
                exc_info=True,
            )
            return False

    def update_generated_page_data(
        self, page_id: str, generation_data: Dict[str, Any]
    ) -> bool:
        """
        Update the generation_data of a generated page and set step to 2

        Args:
            page_id: The page ID (PK) to update
            generation_data: The complete generation data (text, images, color_schemes, etc.)

        Returns:
            True if successful, False otherwise
        """
        return self.update_generated_page(
            page_id=page_id, generation_data=generation_data, step=2
        )

    def update_generated_page_metadata(
        self, page_id: str, metadata: Dict[str, Any]
    ) -> bool:
        """
        Update metadata fields of a generated page

        Args:
            page_id: The page ID (PK) to update
            metadata: Dict with metadata fields to update (e.g., new_product_id, product_id, etc.)

        Returns:
            True if successful, False otherwise
        """
        return self.update_generated_page(page_id=page_id, metadata=metadata)

    def update_generated_page_published_status(
        self, page_id: str, published: bool = True
    ) -> bool:
        """
        Update the published status of a generated page

        Args:
            page_id: The page ID (PK) to update
            published: Published status (True/False), default True

        Returns:
            True if successful, False otherwise
        """
        return self.update_generated_page(page_id=page_id, published=published)

    def update_generation_status(self, page_id: str, status: str) -> bool:
        """
        Update the generation_status of a generated page

        Args:
            page_id: The page ID (PK) to update
            status: The generation status ("in_progress", "completed", "failed")

        Returns:
            True if successful, False otherwise
        """
        return self.update_generated_page(page_id=page_id, generation_status=status)

    def update_generation_percentage(self, page_id: str, percentage: int) -> bool:
        """
        Update the generation_percentage of a generated page

        Args:
            page_id: The page ID (PK) to update
            percentage: The generation percentage (0-100)

        Returns:
            True if successful, False otherwise
        """
        # Ensure percentage is within valid range
        percentage = max(0, min(100, percentage))
        return self.update_generated_page(
            page_id=page_id, generation_percentage=percentage
        )

    # Coupons Management Methods
    def store_coupon(
        self,
        code: str,
        discount_percent: float = 0.0,
        description: str = "",
        valid: bool = True,
        created_at: str = None,
        updated_at: str = None,
    ) -> Optional[str]:
        """
        Store a coupon in the coupons table using coupon code as primary key

        Args:
            code: The coupon code (used as PK)
            discount_percent: Discount percentage (e.g., 10 for 10%)
            description: Coupon description
            valid: Whether the coupon is valid/active
            created_at: Creation timestamp (optional, defaults to current time)
            updated_at: Update timestamp (optional, defaults to current time)

        Returns:
            Coupon code if successful, None otherwise
        """
        try:
            current_timestamp = self._get_timestamp()
            coupon_item = {
                "PK": code,
                "code": code,
                "discount_percent": discount_percent,
                "description": description,
                "valid": valid,
                "created_at": created_at or current_timestamp,
                "updated_at": updated_at or current_timestamp,
            }
            self.coupons_table_ref.put_item(Item=coupon_item)
            logger.info(f"Stored coupon {code}")
            return code
        except Exception as e:
            logger.error(f"Error storing coupon: {e}")
            return None

    def get_coupon_by_code(self, coupon_code: str) -> Optional[Dict[str, Any]]:
        """
        Get a coupon by its code (primary key)

        Args:
            coupon_code: The coupon code

        Returns:
            Coupon dictionary or None if not found
        """
        try:
            response = self.coupons_table_ref.get_item(Key={"PK": coupon_code})
            return response.get("Item")
        except Exception as e:
            logger.error(f"Error getting coupon by code: {e}")
            return None

    def get_coupons_by_codes(self, coupon_codes: List[str]) -> List[Dict[str, Any]]:
        """
        Get multiple coupons by their codes

        Args:
            coupon_codes: List of coupon codes

        Returns:
            List of coupon dictionaries
        """
        try:
            coupons = []
            for coupon_code in coupon_codes:
                coupon = self.get_coupon_by_code(coupon_code)
                if coupon:
                    coupons.append(coupon)
            return coupons
        except Exception as e:
            logger.error(f"Error getting coupons by codes: {e}")
            return []

    def get_store_allowed_coupons(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all allowed coupons for a store by reading from allowed_coupons field

        Args:
            user_id: The user's Cognito ID (PK)

        Returns:
            List of coupon dictionaries
        """
        try:
            store = self.get_user_primary_store(user_id)
            if not store:
                return []

            coupon_codes = store.get("allowed_coupons", [])
            if not coupon_codes:
                return []

            return self.get_coupons_by_codes(coupon_codes)
        except Exception as e:
            logger.error(f"Error getting store allowed coupons: {e}")
            return []

    def update_store_allowed_coupons(
        self, user_id: str, coupon_codes: List[str]
    ) -> bool:
        """
        Update the allowed_coupons field in the store table with coupon codes

        Args:
            user_id: The user's Cognito ID (PK)
            coupon_codes: List of coupon codes to store

        Returns:
            True if successful, False otherwise
        """
        try:
            self.stores_table_ref.update_item(
                Key={"PK": user_id},
                UpdateExpression="SET allowed_coupons = :coupons, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ":coupons": coupon_codes,
                    ":updated_at": self._get_timestamp(),
                },
            )
            logger.info(
                f"Updated allowed_coupons for user {user_id} with {len(coupon_codes)} coupon codes"
            )
            return True
        except Exception as e:
            logger.error(f"Error updating allowed_coupons: {e}")
            return False

    def delete_coupons_by_codes(self, coupon_codes: List[str]) -> bool:
        """
        Delete coupons by their codes

        Args:
            coupon_codes: List of coupon codes to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            for coupon_code in coupon_codes:
                try:
                    self.coupons_table_ref.delete_item(Key={"PK": coupon_code})
                except Exception as e:
                    logger.warning(f"Error deleting coupon {coupon_code}: {e}")
            logger.info(f"Deleted {len(coupon_codes)} coupons")
            return True
        except Exception as e:
            logger.error(f"Error deleting coupons: {e}")
            return False

    # Bundle Management Methods
    def create_bundle(
        self, bundle_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """
        Create a new bundle in DynamoDB

        Args:
            bundle_data: Dictionary containing bundle data with 'id' mapped to 'PK'

        Returns:
            Created bundle dictionary
        """
        try:
            bundle_id = bundle_data.get("id")
            if not bundle_id:
                raise ValueError("Bundle ID is required")

            # Map 'id' to 'PK' for DynamoDB
            bundle_item = {
                "PK": bundle_id,
                "user_id": user_id,
                "name": bundle_data.get("name"),
                "description": bundle_data.get("description"),
                "type": bundle_data.get("type"),
                "productSelectionType": bundle_data.get("productSelectionType"),
                "productIds": bundle_data.get("productIds", []),
                "sectionHeader": bundle_data.get("sectionHeader", "Buy More Save More"),
                "isActive": bundle_data.get("isActive", True),
                "allowVariantSelection": bundle_data.get(
                    "allowVariantSelection", False
                ),
                "styleSettings": bundle_data.get("styleSettings"),
                "quantityDiscountTiers": bundle_data.get("quantityDiscountTiers"),
                "createdAt": bundle_data.get("createdAt", self._get_timestamp()),
                "updatedAt": bundle_data.get("updatedAt", self._get_timestamp()),
            }

            # Remove None values
            bundle_item = {k: v for k, v in bundle_item.items() if v is not None}

            # Convert all floats to Decimals for DynamoDB compatibility
            bundle_item = self._convert_floats_to_decimal(bundle_item)

            self.bundler_table_ref.put_item(Item=bundle_item)
            logger.info(f"Created bundle with ID: {bundle_id}")
            return bundle_item

        except ClientError as e:
            logger.error(f"Error creating bundle: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating bundle: {e}")
            raise

    def update_bundle(
        self, bundle_id: str, bundle_data: Dict[str, Any], user_id: str
    ) -> bool:
        """
        Update an existing bundle in DynamoDB

        Args:
            bundle_id: The bundle ID (PK)
            bundle_data: Dictionary containing bundle data to update

        Returns:
            True if successful, False otherwise
        """
        try:
            # Build update expression
            update_expression = "SET "
            expression_attribute_values = {}
            expression_attribute_names = {}

            # Fields that can be updated
            updatable_fields = [
                "name",
                "description",
                "type",
                "productSelectionType",
                "productIds",
                "sectionHeader",
                "isActive",
                "allowVariantSelection",
                "styleSettings",
                "quantityDiscountTiers",
            ]

            update_parts = []
            for key in updatable_fields:
                if key in bundle_data:
                    attr_name = f"#{key}"
                    attr_value = f":{key}"
                    update_parts.append(f"{attr_name} = {attr_value}")
                    expression_attribute_names[attr_name] = key
                    # Convert floats to Decimals for DynamoDB compatibility
                    original_value = bundle_data[key]
                    converted_value = self._convert_floats_to_decimal(original_value)
                    expression_attribute_values[attr_value] = converted_value
                    # Log conversion for debugging
                    if original_value != converted_value:
                        logger.debug(
                            f"Converted {key} value from {type(original_value).__name__} to {type(converted_value).__name__}"
                        )

            # Add updatedAt timestamp
            update_parts.append("#updatedAt = :updatedAt")
            expression_attribute_names["#updatedAt"] = "updatedAt"
            updated_at_value = bundle_data.get("updatedAt", self._get_timestamp())
            # Convert floats to Decimals for DynamoDB compatibility (handles strings/non-floats correctly)
            expression_attribute_values[":updatedAt"] = self._convert_floats_to_decimal(
                updated_at_value
            )

            # Add user_id
            update_parts.append("#user_id = :user_id")
            expression_attribute_names["#user_id"] = "user_id"
            expression_attribute_values[":user_id"] = user_id

            # Build final update expression
            update_expression = "SET " + ", ".join(update_parts)

            # Final validation: ensure no floats remain in expression_attribute_values
            # This is a safety check to catch any edge cases
            def validate_no_floats(obj, path=""):
                """Recursively check for floats and convert them"""
                if isinstance(obj, float):
                    logger.warning(f"Found float at path {path}, converting to Decimal")
                    return Decimal(str(obj))
                elif isinstance(obj, dict):
                    return {
                        k: validate_no_floats(v, f"{path}.{k}" if path else k)
                        for k, v in obj.items()
                    }
                elif isinstance(obj, (list, tuple)):
                    return [
                        validate_no_floats(item, f"{path}[{i}]" if path else f"[{i}]")
                        for i, item in enumerate(obj)
                    ]
                return obj

            # Apply final validation to all expression values
            for key, value in expression_attribute_values.items():
                expression_attribute_values[key] = validate_no_floats(value, key)

            # Debug log to verify no floats remain
            def check_for_floats(obj, path=""):
                """Recursively check for any remaining floats"""
                if isinstance(obj, float):
                    logger.error(f"FLOAT DETECTED at {path}: {obj} (type: {type(obj)})")
                    return True
                elif isinstance(obj, dict):
                    return any(
                        check_for_floats(v, f"{path}.{k}") for k, v in obj.items()
                    )
                elif isinstance(obj, (list, tuple)):
                    return any(
                        check_for_floats(item, f"{path}[{i}]")
                        for i, item in enumerate(obj)
                    )
                return False

            if check_for_floats(
                expression_attribute_values, "expression_attribute_values"
            ):
                logger.error(
                    "Found floats in expression_attribute_values after conversion!"
                )
                logger.error(f"Values: {expression_attribute_values}")

            self.bundler_table_ref.update_item(
                Key={"PK": bundle_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
            )

            logger.info(f"Updated bundle with ID: {bundle_id}")
            return True

        except ClientError as e:
            logger.error(f"Error updating bundle: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error updating bundle: {e}")
            return False

    def get_bundle_by_id(self, bundle_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a bundle by its ID

        Args:
            bundle_id: The bundle ID (PK)

        Returns:
            Bundle dictionary or None if not found
        """
        try:
            response = self.bundler_table_ref.get_item(Key={"PK": bundle_id})
            return response.get("Item")
        except ClientError as e:
            logger.error(f"Error getting bundle by ID: {e}")
            return None

    def delete_bundle(self, bundle_id: str) -> bool:
        """
        Soft delete a bundle by setting deleted flag to true and deletedAt timestamp

        Args:
            bundle_id: The bundle ID (PK)

        Returns:
            True if successful, False otherwise
        """
        try:
            self.bundler_table_ref.update_item(
                Key={"PK": bundle_id},
                UpdateExpression="SET #deleted = :deleted, #deletedAt = :deletedAt, #updatedAt = :updatedAt",
                ExpressionAttributeNames={
                    "#deleted": "deleted",
                    "#deletedAt": "deletedAt",
                    "#updatedAt": "updatedAt",
                },
                ExpressionAttributeValues={
                    ":deleted": True,
                    ":deletedAt": self._get_timestamp(),
                    ":updatedAt": self._get_timestamp(),
                },
            )

            logger.info(f"Soft deleted bundle with ID: {bundle_id}")
            return True

        except ClientError as e:
            logger.error(f"Error deleting bundle: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting bundle: {e}")
            return False


document_store = DocumentStore()
