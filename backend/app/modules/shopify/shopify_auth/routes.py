"""
Shopify Auth Routes: API endpoints for Shopify OAuth and webhooks
"""

from app.clients.posthog_client import posthog_client
from flask import Blueprint, request, jsonify, redirect
from urllib.parse import urlencode
import os
import time
import threading
import logging
from calendar import monthrange
from datetime import datetime, timedelta, timezone
from app.modules.database.conditions import Attr
from .utils import decrypt_shopify_oauth_data, verify_signature
from .webhook_utils import webhook_manager
from ...auth.utils import require_auth, verify_token, require_shopify_auth
from ...credits import wallet_service
from ...database import document_store
from .store_details_payload import build_store_details_payload
from ...events.utils import publish_user_event
from ...utils.reddit_conversions import send_reddit_signup_event
from ..shopify_utils import shopify_utils
from app.clients.crisp_client import crisp_client

logger = logging.getLogger(__name__)

# Create Blueprint for shopify auth routes
shopify_auth_bp = Blueprint("shopify_auth", __name__)


@shopify_auth_bp.route("/api/app/install", methods=["POST"])
def app_install():
    """Handle Shopify App Install"""
    try:

        body = request.data
        data = request.get_json()
        signature = request.headers.get("X-Internal-Signature")
        print("signature", signature)

        if not signature or not verify_signature(body, signature):
            return jsonify({"success": False, "error": "Invalid signature"}), 401

        user_id = data.get("shop")
        logger.info(f"User ID: {user_id}")

        shop_details = data.get("shopDetails")
        shop = shop_details.get("shop")
        access_token = data.get("accessToken")
        if not shop:
            return jsonify({"success": False, "error": "Missing shop"}), 400
        shopify_domain = shop.get("myshopifyDomain")
        try:
            stored_shop = document_store.get_shop_details(shopify_domain)
            people_id = None  # Initialize to None in case Crisp API call fails
            if not stored_shop:
                try:
                    logger.info(f"Sending Reddit SignUp event for {shopify_domain}")
                    response = send_reddit_signup_event(
                        {
                            "email": shop.get("email"),
                            "store_url": shopify_domain,
                            "phone": shop.get("phone"),
                        }
                    )
                    logger.info(f"Reddit SignUp event response: {response}")

                except Exception as reddit_err:
                    logger.warning(
                        "Reddit SignUp event failed (non-fatal): %s", reddit_err
                    )
                try:
                    shop_email = shop.get("email")
                    crisp_peoples = crisp_client.search_users_profile(
                        shop_email or user_id
                    )
                    if crisp_peoples and len(crisp_peoples):
                        people_id = crisp_peoples[0].get("people_id")
                    if not people_id:
                        logger.info(
                            f"Adding new user profile to Crisp for {shopify_domain}"
                        )
                        response = crisp_client.add_new_user_profile(
                            {
                                "email": shop.get("email"),
                                "person": {
                                    "nickname": user_id,
                                    "company": shop.get("name"),
                                },
                            }
                        )
                        logger.info(f"crisp response for {shopify_domain}: {response}")
                        people_id = response.get("people_id") if isinstance(response, dict) else None

                    if people_id:
                        logger.info(
                            f"crisp people_id for {shopify_domain}: {people_id}"
                        )
                        event_respone = crisp_client.send_event(
                            people_id,
                            {
                                "text": "app:installed",
                                "data": {
                                    "store_domain": shopify_domain,
                                    "email": shop.get("email"),
                                },
                                "color": "green",
                            },
                        )
                        logger.info(
                            f"crisp event response for {shopify_domain}: {event_respone}"
                        )

                except Exception as crisp_error:
                    logger.error(f"Error adding user profile to Crisp: {crisp_error}")

            else:
                uninstalled = stored_shop.get("uninstalled")
                print("is_uninstalled", uninstalled)
                if uninstalled:
                    logger.info(f"User store already exists for {shopify_domain}")
                    try:
                        people_id = stored_shop.get("crisp_people_id")
                        if not people_id:
                            crisp_peoples = crisp_client.search_users_profile(
                                shop.get("email") or user_id
                            )
                            if crisp_peoples and len(crisp_peoples):
                                people_id = crisp_peoples[0].get("people_id")
                        if not people_id:
                            logger.info(
                                f"Adding new user profile to Crisp for {shopify_domain}"
                            )
                            response = crisp_client.add_new_user_profile(
                                {
                                    "email": shop.get("email"),
                                    "person": {
                                        "nickname": user_id,
                                        "company": shop.get("name"),
                                    },
                                }
                            )
                            logger.info(f"crisp response for {shopify_domain}: {response}")
                            people_id = response.get("people_id") if isinstance(response, dict) else None

                        if people_id:
                            logger.info(
                                f"crisp people_id for {shopify_domain}: {people_id}"
                            )
                            event_respone = crisp_client.send_event(
                                people_id,
                                {
                                    "text": "app:reinstalled",
                                    "data": {
                                        "store_domain": shopify_domain,
                                        "email": shop.get("email"),
                                    },
                                    "color": "green",
                                },
                            )
                            logger.info(
                                f"crisp event response for {shopify_domain}: {event_respone}"
                            )
                    except Exception as crisp_error:
                        logger.error(f"Error updating Crisp profile on reinstall: {crisp_error}")
            # Store shop details in the database
            shop_id = document_store.store_shop_details(
                {**shop, "crisp_people_id": people_id}, access_token
            )
            logger.info(f"Successfully stored shop details for shop_id: {shop_id}")

            # Initialize the credit wallet (300-credit signup bonus) for brand-new
            # shops only. We skip this for reinstalls / existing shops to avoid
            # interfering with the legacy-user migration which is handled
            # separately. ensure_wallet is idempotent, so a retried install for
            # the same shop won't double-grant.
            if not stored_shop:
                try:
                    posthog_client.capture(
                        "app_installed",
                        distinct_id=shopify_domain,
                        properties={
                            "store_domain": shopify_domain,
                            "email": shop.get("email"),
                        },
                    )
                except Exception as ph_err:
                    logger.error(
                        f"PostHog app_installed failed for {shopify_domain}: {ph_err}"
                    )
                try:
                    wallet_service.ensure_wallet(shopify_domain)
                    logger.info(
                        f"Initialized credit wallet for new shop {shopify_domain}"
                    )
                except Exception as wallet_err:
                    # Don't fail the install if wallet creation fails — log and
                    # the next authenticated request will retry via
                    # ensure_wallet on first credit-related action.
                    logger.error(
                        f"Failed to initialize credit wallet for {shopify_domain}: {wallet_err}"
                    )

            # Verify shop details were stored
            stored_shop = document_store.get_shop_details(shopify_domain)
            if stored_shop:
                logger.info(f"Verified shop details stored: {stored_shop.get('name')}")
            else:
                logger.warning(
                    f"Shop details not found after storage for shop_id: {shop_id}"
                )

            # Return success response with shop_id

            subscription_exists = document_store.get_user_subscription_history(
                user_id, count_only=True
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Shop details stored successfully",
                        "shop_id": shop_id,
                        "subscription_exists": subscription_exists,
                    }
                ),
                200,
            )

        except Exception as e:
            logger.error(f"Error storing shop details: {str(e)}")
            return (
                jsonify({"success": False, "error": "Failed to store shop details"}),
                500,
            )

    except Exception as e:
        logger.error(f"Error in shopify_oauth_callback: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/app/uninstall", methods=["POST"])
def app_uninstall():
    """Handle Shopify App Uninstall"""
    try:
        body = request.data
        signature = request.headers.get("X-Internal-Signature")

        if not signature or not verify_signature(body, signature):
            return jsonify({"success": False, "error": "Invalid signature"}), 401

        payload = request.get_json()
        user_id = payload.get("shop")

        if not user_id:
            return jsonify({"success": False, "error": "Missing user_id"}), 400
        try:
            shop = document_store.get_shop_details(user_id)
            document_store.mark_shopify_roarr_uninstalled(user_id)
            logger.info(f"Marked shop {user_id} as uninstalled")
            if shop:
                logger.info(f"Sending app_uninstalled posthog event for {user_id}")
                try:
                    posthog_client.capture(
                        "app_uninstalled",
                        distinct_id=user_id,
                        properties={"store_domain": user_id, "email": shop.get("email")},
                    )
                except Exception as e:
                    logger.error(f"Error sending app_uninstalled posthog event for {user_id}: {e}")
                people_id = shop.get("crisp_people_id")
                if not people_id:
                    response = crisp_client.search_users_profile(
                        shop.get("email") or user_id
                    )
                    if response and len(response):
                        people_id = response[0].get("people_id")
                logger.info(
                    f"[Uninstall] crisp people_id for shop {shop.get('name')}: {people_id}"
                )

                if people_id:
                    crisp_client.send_event(
                        people_id,
                        {
                            "text": "app:uninstalled",
                            "data": {
                                "store_domain": user_id,
                                "email": shop.get("email"),
                            },
                            "color": "red",
                        },
                    )
            return (
                jsonify({"success": True, "message": "User uninstalled successfully"}),
                200,
            )
        except Exception as shop_error:
            logger.error(f"Error marking shop {user_id} as uninstalled: {shop_error}")
            return (
                jsonify(
                    {"success": False, "error": "Failed to mark shop as uninstalled"}
                ),
                500,
            )
    except Exception as e:
        logger.error(f"Error in app_uninstall: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/shopify/auth", methods=["GET"])
def shopify_oauth_callback():
    """Handle Shopify OAuth callback and register webhooks"""
    try:
        encoded_data = request.args.get("data")
        if not encoded_data:
            return jsonify({"success": False, "error": "Missing OAuth data"}), 400

        try:
            oauth_data = decrypt_shopify_oauth_data(encoded_data)
        except ValueError as e:
            return (
                jsonify({"success": False, "error": f"Invalid OAuth data: {str(e)}"}),
                400,
            )

        shop_url = oauth_data["shop_url"]
        access_token = oauth_data["access_token"]

        # Register uninstall webhook
        webhook_url = os.getenv("WEBHOOK_ENDPOINT_URL")
        if webhook_url:
            uninstall_webhook_endpoint = f"{webhook_url}/webhook/shopify/unInstall"
            success = shopify_utils.register_uninstall_webhook(
                shop_url, access_token, uninstall_webhook_endpoint
            )
            if success:
                logger.info(
                    f"Successfully registered uninstall webhook for store: {shop_url}"
                )
                logger.info(f"Uninstall webhook endpoint: {uninstall_webhook_endpoint}")
            else:
                logger.error(
                    f"Failed to register uninstall webhook for store: {shop_url}"
                )
        else:
            logger.warning(
                "WEBHOOK_ENDPOINT_URL not configured, skipping uninstall webhook registration"
            )

        # Register subscription webhook
        try:
            webhook_result = webhook_manager.ensure_subscription_webhook_registered(
                shop_url, access_token
            )

            if webhook_result["success"]:
                logger.info(
                    f"Successfully registered subscription webhook for store: {shop_url}"
                )
            else:
                logger.warning(
                    f"Failed to register subscription webhook for store: {shop_url}: {webhook_result.get('error')}"
                )
        except Exception as webhook_error:
            logger.error(
                f"Error registering subscription webhook for store: {shop_url}: {webhook_error}"
            )

        try:
            session_id = document_store.create_shopify_session(shop_url, access_token)
            verify_session = document_store.get_shopify_session(session_id)
            if verify_session:
                pass
            else:
                pass

        except Exception as e:
            return jsonify({"success": False, "error": "Failed to create session"}), 500

        # Redirect to connected accounts to complete binding (frontend will show appropriate modal/flow)
        params = urlencode({"fromshopifyInstall": "true", "sessionId": session_id})
        redirect_url = f"{os.getenv('FRONTEND_URL')}/connected-accounts?{params}"
        return redirect(redirect_url, code=302)

    except Exception as e:
        logger.error(f"Error in shopify_oauth_callback: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/shopify/check-auth", methods=["GET"])
def check_user_auth():
    """Check if user is authenticated"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return (
                jsonify(
                    {
                        "success": False,
                        "authenticated": False,
                        "error": "No valid authorization token",
                    }
                ),
                401,
            )

        token = auth_header.split(" ")[1]

        try:
            user_info = verify_token(token)
            return jsonify(
                {
                    "success": True,
                    "authenticated": True,
                    "user_id": user_info.get("sub"),
                    "email": user_info.get("email"),
                }
            )
        except Exception as e:
            return (
                jsonify(
                    {"success": False, "authenticated": False, "error": "Invalid token"}
                ),
                401,
            )

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "authenticated": False,
                    "error": "Internal server error",
                }
            ),
            500,
        )


@shopify_auth_bp.route("/webhook/shopify/app-charges-update", methods=["POST"])
def handle_app_charges_webhook():
    """
    Handle Shopify app charges webhook for add-on purchases
    Saves add-on transactions in the same user_subscription_transaction table
    """
    try:
        # Get the raw webhook data
        webhook_data = request.get_json()
        if not webhook_data:
            logger.error("No webhook data received")
            return jsonify({"error": "No data received"}), 400

        logger.info(f"Received app charges webhook: {webhook_data}")

        # Extract charge information
        # `app_purchases_one_time/update` nests the charge under `app_purchase_one_time`
        # (GraphQL id and status); older payloads carried the fields at the top level.
        charge = webhook_data.get("app_purchase_one_time") or webhook_data
        charge_id = charge.get("id") or (
            str(charge.get("admin_graphql_api_id") or "").rsplit("/", 1)[-1] or None
        )
        status = (charge.get("status") or "").lower() or None
        name = charge.get("name", "")
        price = charge.get("price", "0.00")
        currency = charge.get("currency", "USD")

        if not charge_id:
            logger.error("No charge ID in webhook data")
            return jsonify({"error": "No charge ID"}), 400

        # Ensure charge_id is a string for DynamoDB consistency
        charge_id_str = str(charge_id)

        # Find the user by charge ID in our database
        # We store the charge_id -> user_id mapping when creating the add-on purchase
        try:
            # Query the subscription transactions table to find the user by charge_id
            # Using subscription_id as the primary key for add-on purchases
            addon_transaction = document_store.get_subscription_transaction(
                charge_id_str
            )

            if not addon_transaction:
                logger.warning(
                    f"No add-on purchase found for charge ID: {charge_id_str}"
                )
                return (
                    jsonify({"success": True, "message": "No matching purchase found"}),
                    200,
                )

            user_id = addon_transaction.get("fk_user_id")
            if not user_id:
                logger.warning(f"No user ID found for charge ID: {charge_id_str}")
                return (
                    jsonify({"success": True, "message": "No user found for charge"}),
                    200,
                )

            # Update the add-on purchase status in subscription transactions table
            document_store.update_subscription_transaction(
                subscription_id=charge_id_str,  # Using charge_id as subscription_id for add-ons
                updates={
                    "status": status,
                    "updated_at": document_store._get_timestamp(),
                    "webhook_data": webhook_data,
                },
            )

            logger.info(
                f"Updated add-on purchase for user {user_id}: {charge_id_str} -> {status}"
            )

            # If the charge was accepted, the add-on is now active
            if status in ("accepted", "active"):
                addon_name = addon_transaction.get("plan_name", "Unknown Add-on")
                logger.info(
                    f"Add-on purchase activated for user {user_id}: {addon_name}"
                )

        except Exception as e:
            logger.error(f"Error processing add-on purchase webhook: {e}")
            # Don't fail the webhook, just log the error

        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error processing app charges webhook: {str(e)}")
        return jsonify({"error": str(e)}), 500


@shopify_auth_bp.route("/webhook/shopify/app-subscriptions-update", methods=["POST"])
@shopify_auth_bp.route(
    "/api/webhook/shopify/app-subscriptions-update", methods=["POST"]
)
def shopify_app_subscriptions_webhook():
    """
    Handle Shopify APP_SUBSCRIPTIONS_UPDATE webhook
    This webhook is triggered when a user's subscription plan changes
    """
    try:
        # Get the webhook payload
        webhook_data = request.get_json()

        if not webhook_data:
            logger.warning("Empty webhook payload received")
            return jsonify({"success": False, "error": "Empty payload"}), 400

        logger.info("=" * 50)
        logger.info("SHOPIFY SUBSCRIPTION WEBHOOK RECEIVED")
        logger.info("=" * 50)
        logger.info(f"Webhook endpoint: {request.url}")
        logger.info(f"Request path: {request.path}")
        logger.info(f"Full webhook payload: {webhook_data}")

        # Extract subscription information from the nested structure
        app_subscription = webhook_data.get("app_subscription", {})

        # Extract subscription ID from the GraphQL ID
        admin_graphql_api_id = app_subscription.get("admin_graphql_api_id")
        subscription_id = (
            admin_graphql_api_id.split("/")[-1] if admin_graphql_api_id else None
        )

        admin_graphql_api_shop_id = app_subscription.get("admin_graphql_api_shop_id")
        shop_id = (
            admin_graphql_api_shop_id.split("/")[-1]
            if admin_graphql_api_shop_id
            else None
        )

        status = app_subscription.get("status")
        name = app_subscription.get("name")
        price = app_subscription.get("price")
        currency = app_subscription.get("currency")
        created_at = app_subscription.get("created_at")
        updated_at = app_subscription.get("updated_at")

        logger.info(f"Subscription ID: {subscription_id}")
        logger.info(f"Shop ID: {shop_id}")
        logger.info(f"Status: {status}")
        logger.info(f"Name: {name}")
        logger.info(f"Price: {price} {currency}")
        logger.info(f"Created: {created_at}")
        logger.info(f"Updated: {updated_at}")

        if not subscription_id:
            logger.error("No subscription ID in webhook payload")
            return jsonify({"success": False, "error": "No subscription ID"}), 400

        # Find the user associated with this shop
        target_user_id = None
        target_store = None

        if shop_id:
            logger.info(f"Looking for store with shop_id: {shop_id}")
            target_store = document_store.get_store_by_shop_id(shop_id)
            if target_store:
                target_user_id = target_store.get("fk_user_id")
                logger.info(
                    f"Found store by shop_id: {target_store.get('store_url')} -> User: {target_user_id}"
                )
            else:
                logger.warning(f"No store found with shop_id: {shop_id}")

        if not target_user_id:
            logger.error(f"Could not find user for shop_id: {shop_id}")
            placeholder_user_id = f"shop_{shop_id}" if shop_id else "unknown"

            # Create a properly structured payload for the database
            structured_payload = {
                "status": status,
                "name": name,
                "admin_graphql_api_id": admin_graphql_api_id,
                "admin_graphql_api_shop_id": admin_graphql_api_shop_id,
                "currency": currency,
                "capped_amount": app_subscription.get("capped_amount", "0.00"),
                "created_at": created_at,
                "updated_at": updated_at,
                "price": price,
                "interval": app_subscription.get("interval", ""),
                "plan_handle": app_subscription.get("plan_handle", ""),
                "raw_payload": webhook_data,  # Store the full original payload
            }

            transaction_data = document_store.create_subscription_transaction(
                subscription_id=subscription_id,
                fk_user_id=placeholder_user_id,
                shopify_payload=structured_payload,
            )

            logger.info(
                f"Created subscription transaction with placeholder user: {transaction_data}"
            )

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Webhook processed but user not found",
                        "subscription_id": subscription_id,
                        "status": status,
                        "warning": "User association failed",
                    }
                ),
                200,
            )

        # Process the subscription for the found user
        logger.info(f"Processing subscription for user: {target_user_id}")

        # Check if we should store this subscription transaction
        should_store = document_store.should_store_subscription_transaction(
            target_user_id, status, name
        )

        if not should_store:
            logger.info(
                f"Skipping subscription transaction storage for user {target_user_id} (status: {status})"
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Webhook processed but transaction not stored (duplicate plan change)",
                        "subscription_id": subscription_id,
                        "status": status,
                        "user_id": target_user_id,
                        "skipped": True,
                    }
                ),
                200,
            )

        # Create a properly structured payload for the database
        structured_payload = {
            "status": status,
            "name": name,
            "admin_graphql_api_id": admin_graphql_api_id,
            "admin_graphql_api_shop_id": admin_graphql_api_shop_id,
            "currency": currency,
            "capped_amount": app_subscription.get("capped_amount", "0.00"),
            "created_at": created_at,
            "updated_at": updated_at,
            "price": price,
            "interval": app_subscription.get("interval", ""),
            "plan_handle": app_subscription.get("plan_handle", ""),
            "raw_payload": webhook_data,  # Store the full original payload
        }

        # Create subscription transaction record
        transaction_data = document_store.create_subscription_transaction(
            subscription_id=subscription_id,
            fk_user_id=target_user_id,
            shopify_payload=structured_payload,
        )

        logger.info(f"Created subscription transaction: {transaction_data}")

        # Update user's subscription plan based on webhook data
        if name and status:
            logger.info(
                f"Updating user plan based on subscription: {name} (status: {status})"
            )
            plan_update_success = document_store.update_user_plan_from_webhook(
                target_user_id, name, status
            )

            if plan_update_success:
                logger.info(f"Successfully updated user {target_user_id} plan")
            else:
                logger.error(f"Failed to update user {target_user_id} plan")
        else:
            logger.warning(
                "No subscription name or status provided, skipping plan update"
            )

        logger.info("=" * 50)
        logger.info("WEBHOOK PROCESSING COMPLETED")
        logger.info("=" * 50)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Webhook processed successfully",
                    "subscription_id": subscription_id,
                    "status": status,
                    "user_id": target_user_id,
                    "store_url": (
                        target_store.get("store_url") if target_store else None
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error processing APP_SUBSCRIPTIONS_UPDATE webhook: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_auth_bp.route("/api/webhook/shopify/subscription-update", methods=["POST"])
def subscription_update_webhook():
    """
    Handle Shopify subscription update webhook
    Requires Shopify authentication
    Stores all fields from app_subscription to roarr_subscription_history table
    """
    try:
        # Get the webhook payload
        body = request.data
        webhook_data = request.get_json()
        signature = request.headers.get("X-Internal-Signature")
        print(signature)

        if not signature or not verify_signature(body, signature):
            return jsonify({"success": False, "error": "Invalid signature"}), 401

        user_id = webhook_data.get("shop")
        logger.info(f"User ID: {user_id}")

        if not webhook_data:
            logger.warning("Empty webhook payload received")
            return jsonify({"success": False, "error": "Empty payload"}), 400

        logger.info("=" * 50)
        logger.info("SHOPIFY SUBSCRIPTION UPDATE WEBHOOK RECEIVED")
        logger.info("=" * 50)
        logger.info(f"Webhook endpoint: {request.url}")
        logger.info(f"Request path: {request.path}")
        logger.info(f"Full webhook payload: {webhook_data}")

        # Extract subscription information from the nested structure
        app_subscription = webhook_data.get("app_subscription", {})

        if not app_subscription:
            logger.error("No app_subscription in webhook payload")
            return (
                jsonify({"success": False, "error": "No app_subscription in payload"}),
                400,
            )

        # Log subscription details
        logger.info(f"Subscription details: {app_subscription}")

        # Store all fields to roarr_subscription_history table
        try:
            shop = document_store.get_shop_details(user_id)
            subscriptions_history = document_store.get_user_subscription_history(
                user_id, uninstalled=False
            )
            subscriptions_history = sorted(
                subscriptions_history,
                key=lambda x: x.get("webhook_received_at"),
                reverse=True,
            )
            previous_plan = "free"
            if subscriptions_history:
                subscription_history = subscriptions_history[0]
                previous_plan = subscription_history.get("name", "free")

            people_id = shop.get("crisp_people_id")
            current_plan = app_subscription.get("name", "free")
            status = app_subscription.get("status")
            created_at = app_subscription.get("created_at")
            if previous_plan != current_plan and status == "ACTIVE":
                # Crisp event for plan upgrade
                if not people_id:
                    response = crisp_client.search_users_profile(
                        shop.get("email") or user_id
                    )
                    if response and len(response):
                        people_id = response[0].get("people_id")
                logger.info(
                    f"[Subscription-update-webhook] Crisp People ID for {user_id}: {people_id}"
                )
                if people_id:
                    crisp_client.send_event(
                        people_id,
                        {
                            "text": "app:plan_upgrade",
                            "data": {
                                "from": previous_plan,
                                "to": current_plan,
                                "store_domain": user_id,
                                "status": status,
                                "email": shop.get("email", ""),
                            },
                            "color": "blue",
                        },
                    )

                # Posthog event for plan upgrade
                posthog_client.capture(
                    "plan_upgraded",
                    distinct_id=user_id,
                    properties={
                        "from": previous_plan,
                        "to": current_plan,
                    },
                )

                posthog_client.set(
                    distinct_id=user_id,
                    properties={
                        "plan": current_plan,
                    },
                )

                posthog_client.set_once(
                    distinct_id=user_id,
                    properties={
                        "first_plan_upgraded_at:": created_at,
                    },
                )

            history_data = document_store.create_subscription_history(
                app_subscription, user_id=user_id
            )
            logger.info(f"Successfully stored subscription history: {history_data}")

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Subscription history stored successfully",
                        "subscription_id": history_data.get("subscription_id"),
                        "status": history_data.get("status"),
                    }
                ),
                200,
            )

        except Exception as db_error:
            logger.error(f"Error storing subscription history: {db_error}")
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Failed to store subscription history: {str(db_error)}",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error processing subscription update webhook: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_auth_bp.route("/webhook/shopify/unInstall", methods=["POST"])
def shopify_uninstall_webhook():
    """Handle Shopify app uninstall webhook"""
    try:
        data = request.get_json()
        if not data or not data.get("myshopify_domain"):
            return (
                jsonify(
                    {"success": False, "error": "store_url is required in request body"}
                ),
                400,
            )

        store_url = data.get("myshopify_domain")
        store = document_store.get_store_by_shop_url(store_url)
        print(store)

        if not store:
            return (
                jsonify(
                    {"success": True, "message": "Store not found, nothing to archive"}
                ),
                200,
            )

        store_id = store.get("PK")
        fk_user_id = store.get("fk_user_id")
        access_token = store.get("access_token")
        # store_url is the shops table PK; we use it to mark uninstalled + wipe token
        # (store token is wiped when the store is archived below).

        if store_id and fk_user_id:
            # Remove webhook before archiving store
            if access_token:
                try:
                    webhook_result = webhook_manager.remove_app_subscriptions_webhook(
                        store_url, access_token
                    )

                    if webhook_result["success"]:
                        logger.info(
                            f"Webhook removed successfully for store {store_url}"
                        )
                    else:
                        logger.warning(
                            f"Failed to remove webhook for store {store_url}: {webhook_result.get('error')}"
                        )
                except Exception as webhook_error:
                    logger.error(
                        f"Error removing webhook for store {store_url}: {webhook_error}"
                    )

            # Mark shop as uninstalled AND wipe token in shops table
            try:
                document_store.mark_shopify_roarr_uninstalled(store_url)
            except Exception:
                pass

            # Use the new remove_user_store method to handle store removal properly
            success = document_store.remove_user_store(fk_user_id, store_id)
            if success:
                # Mark uninstall notice on the owning user for frontend polling/UX
                user_pk = store.get("PK")
                if user_pk:
                    try:
                        document_store.mark_shopify_uninstalled(user_pk)
                        # Push real-time event to frontend subscribers
                        try:
                            publish_user_event(
                                user_pk,
                                {
                                    "type": "shopify_uninstalled",
                                    "store_url": store_url,
                                    "ts": int(time.time()),
                                },
                            )
                        except Exception:
                            pass
                    except Exception as _:
                        pass

                return (
                    jsonify({"success": True, "message": "Store removed successfully"}),
                    200,
                )
            else:
                return (
                    jsonify({"success": False, "error": "Failed to remove store"}),
                    500,
                )
        else:
            return (
                jsonify({"success": False, "error": "Store ID or user ID not found"}),
                500,
            )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_auth_bp.route("/api/shopify/disconnect-store", methods=["POST"])
@require_auth
def disconnect_shopify_store():
    """Disconnect Shopify store by archiving it and removing access token"""
    try:
        user_id = request.user_id

        # Disconnect the store using shopify_utils
        success = shopify_utils.disconnect_store(user_id)

        if success:
            try:
                document_store.mark_shopify_uninstalled(user_id)
            except Exception:
                pass
            return (
                jsonify(
                    {"success": True, "message": "Store disconnected successfully"}
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No store found to disconnect or disconnection failed",
                    }
                ),
                404,
            )

    except Exception as e:
        logger.error(f"Error disconnecting Shopify store: {str(e)}")
        return jsonify({"success": False, "error": "Failed to disconnect store"}), 500


@shopify_auth_bp.route("/api/shopify/bind-store", methods=["POST"])
@require_auth
def bind_store_to_user():
    """Bind a Shopify store to the authenticated user"""
    try:
        user_id = request.user_id
        data = request.get_json()

        # Guard: prevent binding if user already has a connected store
        try:
            existing_stores = document_store.get_user_stores(user_id)
        except Exception:
            existing_stores = []
        if existing_stores:
            existing_store = existing_stores[0]
            return (
                jsonify(
                    {
                        "success": False,
                        "code": "USER_ALREADY_CONNECTED",
                        "error": "You are already connected to a store",
                        "currentStoreUrl": existing_store.get("store_url"),
                    }
                ),
                409,
            )

        if not data or "session_id" not in data:
            return jsonify({"success": False, "error": "Session ID is required"}), 400

        session_id = data["session_id"]

        session_data = document_store.get_shopify_session(session_id)
        if not session_data:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Session not found or has expired. Please restart the installation process.",
                    }
                ),
                400,
            )

        shop_url = session_data["shop_url"]
        access_token = session_data["access_token"]

        # Get shop information including shop_id for webhook registration
        shop_info = shopify_utils.get_shop_info(shop_url, access_token)
        shop_id = None

        if shop_info.get("success"):
            shop_id = shop_info.get("shop_id")
            logger.info(f"Retrieved shop_id: {shop_id} for store: {shop_url}")
        else:
            logger.warning(f"Failed to get shop info: {shop_info.get('error')}")

        try:
            store_id = document_store.create_store(
                shop_url, access_token, user_id, shop_id
            )
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

        # Fetch and store live theme ID immediately after store creation
        try:
            logger.info("Fetching live theme ID for newly bound store")
            live_theme_result = shopify_utils.get_live_theme(user_id)

            if live_theme_result.get("success") and live_theme_result.get("theme"):
                live_theme_id = live_theme_result["theme"].get("id")
                logger.info(
                    f"✅ Live theme found: {live_theme_result['theme'].get('name')} (ID: {live_theme_id})"
                )

                # Update store with live_theme_id
                store = document_store.get_user_primary_store(user_id)
                if store:
                    store_id = store.get("PK")
                    document_store.stores_table_ref.update_item(
                        Key={"PK": store_id},
                        UpdateExpression="SET live_theme_id = :theme_id, updated_at = :updated_at",
                        ExpressionAttributeValues={
                            ":theme_id": str(live_theme_id),
                            ":updated_at": document_store._get_timestamp(),
                        },
                    )
                    logger.info(
                        f"✅ Stored live_theme_id: {live_theme_id} for store {store_id}"
                    )
                else:
                    logger.warning(
                        "Store not found after creation, cannot store live_theme_id"
                    )
            else:
                logger.warning(
                    f"⚠️ Failed to get live theme: {live_theme_result.get('error', 'Unknown error')}"
                )
        except Exception as theme_error:
            logger.error(
                f"Error fetching live theme ID during store binding: {str(theme_error)}"
            )
            # Continue even if theme fetch fails - it can be fetched later

        # Mark app installed for this user
        try:
            document_store.mark_shopify_installed(user_id)
        except Exception:
            pass

        # Enrich store with metadata via GraphQL
        try:
            metadata = shopify_utils.get_shop_metadata(user_id)
            if metadata:
                document_store.update_store_metadata(user_id, metadata)
        except Exception:
            pass

        def delayed_register_webhook():
            try:
                time.sleep(3)

                # Register uninstall webhook
                webhook_url = os.getenv("WEBHOOK_ENDPOINT_URL")
                if webhook_url:
                    uninstall_webhook_endpoint = (
                        f"{webhook_url}/webhook/shopify/unInstall"
                    )
                    success = shopify_utils.register_uninstall_webhook(
                        shop_url, access_token, uninstall_webhook_endpoint
                    )
                    if success:
                        logger.info(
                            f"Successfully registered uninstall webhook for store: {shop_url}"
                        )
                        logger.info(
                            f"Uninstall webhook endpoint: {uninstall_webhook_endpoint}"
                        )
                    else:
                        logger.error(
                            f"Failed to register uninstall webhook for store: {shop_url}"
                        )
                else:
                    logger.warning(
                        "WEBHOOK_ENDPOINT_URL not configured, skipping uninstall webhook registration"
                    )

                # Register subscription webhook
                try:
                    logger.info(
                        f"Attempting to register subscription webhook for store: {shop_url}"
                    )
                    logger.info(f"Webhook endpoint: {webhook_manager.webhook_endpoint}")
                    logger.info(f"Base URL: {webhook_manager.base_url}")

                    webhook_result = (
                        webhook_manager.ensure_subscription_webhook_registered(
                            shop_url, access_token
                        )
                    )

                    logger.info(f"Webhook registration result: {webhook_result}")

                    if webhook_result["success"]:
                        logger.info(
                            f"Successfully registered subscription webhook for store: {shop_url}"
                        )
                        logger.info(f"Webhook ID: {webhook_result.get('webhook_id')}")
                    else:
                        logger.error(
                            f"Failed to register subscription webhook for store: {shop_url} - {webhook_result.get('error')}"
                        )
                        logger.error(f"Full error response: {webhook_result}")
                except Exception as subscription_webhook_error:
                    logger.error(
                        f"Error registering subscription webhook for store {shop_url}: {subscription_webhook_error}"
                    )
                    import traceback

                    logger.error(f"Traceback: {traceback.format_exc()}")

            except Exception as e:
                logger.error(
                    f"Error registering webhooks for store {shop_url}: {str(e)}"
                )

        def delayed_deactivate_session():
            try:
                time.sleep(3)
                document_store.deactivate_shopify_session(session_id)
            except Exception as e:
                pass

        # webhook_thread = threading.Thread(target=delayed_register_webhook, daemon=True)
        # webhook_thread.start()
        deactivation_thread = threading.Thread(
            target=delayed_deactivate_session, daemon=True
        )
        deactivation_thread.start()

        return jsonify(
            {
                "success": True,
                "message": "Store successfully integrated",
                "store_id": store_id,
                "shop_url": shop_url,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/shopify/store-details", methods=["GET"])
@require_shopify_auth
def get_store_details():
    """Get details of the current store"""
    try:
        shop_domain = request.user_id
        payload, status = build_store_details_payload(shop_domain)
        return jsonify(payload), status
    except Exception as e:
        logger.error(f"Error getting store details: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/shopify/pages-bootstrap", methods=["GET"])
@require_shopify_auth
def pages_bootstrap():
    """
    Store-details payload plus generated pages in one response (embedded app).
    Query: published (optional), limit (default 20, max 100), offset (default 0).
    """
    shop_domain = request.user_id
    try:
        payload, status = build_store_details_payload(shop_domain)
        if status != 200:
            return jsonify(payload), status

        published_param = request.args.get("published", None)
        limit_param = request.args.get("limit", "20")
        offset_param = request.args.get("offset", "0")

        published = None
        if published_param is not None:
            pl = published_param.lower()
            if pl == "true":
                published = True
            elif pl == "false":
                published = False
            else:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "published parameter must be 'true' or 'false'",
                        }
                    ),
                    400,
                )

        try:
            limit = int(limit_param)
            if limit < 1:
                limit = 20
            elif limit > 100:
                limit = 100
        except ValueError:
            limit = 20

        try:
            offset = int(offset_param)
            if offset < 0:
                offset = 0
        except ValueError:
            offset = 0

        result = document_store.get_user_generated_pages(
            user_id=shop_domain, published=published, limit=limit, offset=offset
        )

        payload["data"] = result["items"]
        payload["pagination"] = {
            "total": result["total"],
            "limit": result["limit"],
            "offset": result["offset"],
            "has_more": result["has_more"],
        }
        return jsonify(payload), 200
    except Exception as e:
        logger.error(f"Error in pages_bootstrap: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500
@shopify_auth_bp.route("/api/shopify/is-store-onboarded", methods=["POST"])
def is_store_onboarded():
    """Check if the store is onboarded"""
    try:

        body = request.data
        data = request.get_json()
        signature = request.headers.get("X-Internal-Signature")

        print("signature", signature)
        user_id = data.get("shop")
        if not signature or not verify_signature(body, signature):
            return jsonify({"success": False, "error": "Invalid signature"}), 401

        store = document_store.get_shop_details(user_id)
        if not store:
            return (
                jsonify({"success": True, "is_onboarded": False}),
                200,
            )
        return (
            jsonify(
                {"success": True, "is_onboarded": store.get("is_onboarding", True)}
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error checking if store is onboarded: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/shopify/set-store-onboarded", methods=["POST"])
@require_shopify_auth
def set_store_onboarded():
    """Set the store as onboarded"""
    try:
        user_id = request.user_id
        document_store.set_shop_onboarding_true(user_id)
        return (
            jsonify({"success": True, "message": "Store onboarded successfully"}),
            200,
        )
    except Exception as e:
        logger.error(f"Error setting store as onboarded: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


def _normalize_shop_market_preferences(payload: dict | None) -> dict | None:
    if not isinstance(payload, dict):
        return None
    market_type = str(
        payload.get("market_type") or payload.get("marketType") or ""
    ).strip().lower()
    if market_type not in {"cod", "prepaid"}:
        return None
    country_code = str(
        payload.get("country_code") or payload.get("countryCode") or ""
    ).strip().upper()[:2]
    if not country_code or len(country_code) != 2:
        return None
    language = str(
        payload.get("language")
        or payload.get("store_language")
        or payload.get("storeLanguage")
        or ""
    ).strip()
    if not language:
        return None
    return {
        "market_type": market_type,
        "country_code": country_code,
        "language": language,
    }


def _shop_market_preferences_from_store(store: dict | None) -> dict | None:
    if not isinstance(store, dict):
        return None
    return _normalize_shop_market_preferences(
        {
            "market_type": store.get("market_type") or store.get("marketType"),
            "country_code": store.get("country_code") or store.get("countryCode"),
            "language": store.get("store_language")
            or store.get("language")
            or store.get("storeLanguage"),
        }
    )


@shopify_auth_bp.route("/api/shopify/shop-market-preferences", methods=["GET", "POST"])
@require_shopify_auth
def shop_market_preferences():
    """
    Get or update shop-level market preferences (COD/prepaid, country, language).
    Stored on the shops DynamoDB record and reused by onboarding, Settings, and store revamp.
    """
    try:
        user_id = request.user_id
        store = document_store.get_shop_details(user_id)
        if not store:
            return jsonify({"success": False, "error": "Shop not found"}), 404

        if request.method == "GET":
            prefs = _shop_market_preferences_from_store(store)
            return (
                jsonify(
                    {
                        "success": True,
                        "preferences": prefs,
                        "market_type": (prefs or {}).get("market_type"),
                        "country_code": (prefs or {}).get("country_code"),
                        "language": (prefs or {}).get("language"),
                    }
                ),
                200,
            )

        data = request.get_json(force=True, silent=True) or {}
        prefs = _normalize_shop_market_preferences(data)
        if not prefs:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "market_type, country_code, and language are required",
                    }
                ),
                400,
            )

        ok = document_store.update_shop_details(
            user_id,
            {
                "market_type": prefs["market_type"],
                "country_code": prefs["country_code"],
                "store_language": prefs["language"],
                "updated_at": document_store._get_timestamp(),
            },
        )
        if not ok:
            return jsonify({"success": False, "error": "Failed to save preferences"}), 500

        return (
            jsonify(
                {
                    "success": True,
                    "preferences": prefs,
                    "market_type": prefs["market_type"],
                    "country_code": prefs["country_code"],
                    "language": prefs["language"],
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error in shop_market_preferences: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


@shopify_auth_bp.route("/api/shopify/shop-market-preferences-internal", methods=["POST"])
def shop_market_preferences_internal():
    """Internal signed read of shop market prefs (used by Remix app-data)."""
    try:
        body = request.data
        data = request.get_json(force=True, silent=True) or {}
        signature = request.headers.get("X-Internal-Signature")
        user_id = data.get("shop")
        if not signature or not verify_signature(body, signature):
            return jsonify({"success": False, "error": "Invalid signature"}), 401
        if not user_id:
            return jsonify({"success": False, "error": "shop is required"}), 400

        store = document_store.get_shop_details(user_id)
        prefs = _shop_market_preferences_from_store(store)
        return (
            jsonify(
                {
                    "success": True,
                    "preferences": prefs,
                    "market_type": (prefs or {}).get("market_type"),
                    "country_code": (prefs or {}).get("country_code"),
                    "language": (prefs or {}).get("language"),
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error in shop_market_preferences_internal: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500
