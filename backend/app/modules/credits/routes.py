"""
Credit-system HTTP routes.

  GET  /api/credits/balance        -> wallet balance + pack/cost catalog
  GET  /api/credits/ledger         -> recent transactions
  POST /api/credits/purchase-pack  -> kick off a Shopify applicationCharge
"""
import hashlib
import hmac
import logging
import os
import time

from dotenv import load_dotenv
from flask import Blueprint, jsonify, request

from ...constants.credits import (
    FEATURE_COSTS,
    PURCHASE_STATUS_ACTIVE,
    PURCHASE_STATUS_PENDING,
    STORE_CREATION_COSTS,
    get_credit_packs_catalog,
    get_pack,
    get_promo,
    is_valid_pack,
    normalize_promo_code,
)
from ...clients.posthog_client import posthog_client
from ..auth.utils import require_shopify_auth
from ..database import document_store
from ..shopify.graphql_client import (
    ShopifyGraphQLError,
    gid_to_id,
    raise_on_user_errors,
    shopify_graphql,
    to_gid,
)
from .service import wallet_service

load_dotenv()
logger = logging.getLogger(__name__)

credits_bp = Blueprint("credits", __name__)

SHOPIFY_API_VERSION = "2026-01"


def _resolve_request_credit_pricing():
    """
    Credit pack prices use the global default catalog for all merchants.

    Returns ``(pricing_row, pricing_region, country_name)`` with no Dynamo
    regional overrides.
    """
    return None, "default", None


def _normalize_shop_domain(shop_url: str) -> str:
    """Return the bare myshopify subdomain (e.g. 'foo' from 'foo.myshopify.com')."""
    s = shop_url or ""
    s = s.replace("https://", "").replace("http://", "")
    if s.endswith(".myshopify.com"):
        s = s.replace(".myshopify.com", "")
    return s


def _capture_credits_pack_purchased(
    *,
    user_id: str,
    charge_id: str,
    purchase: dict | None,
    credits_granted,
) -> None:
    """
    Fire PostHog `credits_pack_purchased` on the first successful credit grant.

    Call from every activation path (confirm-pack return URL and reconcile).
    Otherwise reconcile can grant first; confirm then sees already_active and
    skips PostHog — checkout_started has stats while Paid stays at 0.
    """
    try:
        shop = document_store.get_shop_details(user_id) or {}
        market_type = str(
            shop.get("market_type") or shop.get("marketType") or ""
        ).strip().lower()
        ph_props = {
            "pack_name": (purchase or {}).get("pack_name"),
            "credits_granted": credits_granted,
            "charge_id": charge_id,
        }
        if market_type in ("cod", "prepaid"):
            ph_props["market_type"] = market_type
        posthog_client.capture(
            "credits_pack_purchased",
            distinct_id=user_id,
            properties=ph_props,
        )
    except Exception as ph_err:
        logger.error(f"PostHog credits_pack_purchased failed: {ph_err}")


def _fetch_charge_from_shopify(shop_user_id: str, charge_id: str):
    """
    Fetch the live one-time purchase (credit pack charge) from Shopify for a given user (shop).

    Returns (charge_dict, error_response_tuple). If error_response_tuple is not
    None, callers should return it directly. Otherwise charge_dict has
    `id`, `name`, `status` (lowercase: pending/active/declined/expired), `price`, `test`.
    """
    shop = document_store.get_shop_details(shop_user_id)
    if not shop:
        return None, (
            jsonify({"success": False, "error": "Shop not found"}),
            400,
        )

    access_token = shop.get("access_token")
    if not access_token:
        return None, (
            jsonify({"success": False, "error": "Missing Shopify access token"}),
            400,
        )

    try:
        data = shopify_graphql(
            shop_user_id,
            access_token,
            """
            query appPurchaseOneTime($id: ID!) {
              node(id: $id) {
                ... on AppPurchaseOneTime {
                  id
                  name
                  status
                  test
                  createdAt
                  price { amount currencyCode }
                }
              }
            }
            """,
            {"id": to_gid("AppPurchaseOneTime", charge_id)},
        )
    except Exception as exc:
        logger.error(f"Shopify charge fetch failed for {charge_id}: {exc}")
        return None, (
            jsonify({"success": False, "error": "Shopify request failed"}),
            502,
        )

    node = data.get("node")
    if not node:
        logger.warning(f"Shopify charge fetch found no purchase for {charge_id}")
        return None, (
            jsonify({"success": False, "error": "Shopify charge not found"}),
            502,
        )

    price = node.get("price") or {}
    return {
        "id": gid_to_id(node.get("id")),
        "name": node.get("name"),
        "status": (node.get("status") or "").lower(),
        "test": bool(node.get("test")),
        "created_at": node.get("createdAt"),
        "price": price.get("amount"),
        "currency": price.get("currencyCode"),
    }, None


@credits_bp.route("/api/credits/balance", methods=["GET"])
@require_shopify_auth
def get_balance():
    """
    Return the user's wallet balance and the catalog of packs/feature costs
    so the UI can render everything from one call.
    """
    try:
        user_id = request.user_id
        wallet_service.ensure_wallet(user_id)
        wallet_service.apply_daily_topup(user_id)
        wallet = wallet_service.get_wallet(user_id) or {}
        pricing_row, pricing_region, pricing_country_name = (
            _resolve_request_credit_pricing()
        )
        active_purchases = wallet_service.list_purchases_for_user(
            user_id, limit=1, status=PURCHASE_STATUS_ACTIVE
        )
        has_active_purchase = bool(active_purchases)
        promo_pending = bool(wallet.get("promo_roarr2x_pending"))
        promo_redeemed = bool(wallet.get("promo_roarr2x_redeemed_at"))

        return (
            jsonify(
                {
                    "success": True,
                    "balance": wallet.get("balance", 0),
                    "lifetime_granted": wallet.get("lifetime_granted", 0),
                    "lifetime_spent": wallet.get("lifetime_spent", 0),
                    "has_active_purchase": has_active_purchase,
                    "feature_costs": FEATURE_COSTS,
                    "store_creation_costs": STORE_CREATION_COSTS,
                    "packs": get_credit_packs_catalog(pricing_row),
                    "pricing_region": pricing_region,
                    "pricing_country_name": pricing_country_name or "",
                    "promo_roarr2x_pending": promo_pending,
                    "promo_roarr2x_redeemed": promo_redeemed,
                    "active_promo": "ROARR2X" if promo_pending else None,
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error fetching credit balance: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@credits_bp.route("/api/credits/ledger", methods=["GET"])
@require_shopify_auth
def get_ledger():
    """Return recent ledger entries for the wallet UI."""
    try:
        user_id = request.user_id
        try:
            limit = int(request.args.get("limit", 50))
        except (TypeError, ValueError):
            limit = 50
        limit = max(1, min(limit, 200))

        entries = wallet_service.get_ledger(user_id, limit=limit)
        return jsonify({"success": True, "entries": entries, "count": len(entries)}), 200
    except Exception as e:
        logger.error(f"Error fetching credit ledger: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@credits_bp.route("/api/credits/redeem-promo", methods=["POST"])
@require_shopify_auth
def redeem_promo():
    """
    Redeem a lifetime promo code once per shop.

    Body: { "code": "ROARR2X" }
    Does not grant credits immediately — arms a 2x multiplier for the next
    paid pack purchase confirmation.
    """
    try:
        data = request.get_json(silent=True) or {}
        code = normalize_promo_code(data.get("code"))
        if not code:
            return jsonify({"success": False, "error": "Promo code is required"}), 400
        if not get_promo(code):
            return jsonify({"success": False, "error": "Invalid promo code"}), 400

        result = wallet_service.redeem_promo(request.user_id, code)
        return jsonify({"success": True, **result}), 200
    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 409
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error redeeming promo: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@credits_bp.route("/api/credits/purchase-pack", methods=["POST"])
@require_shopify_auth
def purchase_pack():
    """
    Initiate a one-time Shopify applicationCharge for a credit pack.

    Flow:
      1. Validate pack name.
      2. Look up the user's Shopify creds.
      3. Create a one-time charge with the appPurchaseOneTimeCreate GraphQL mutation.
      4. Persist a `pending` row in roarr_credit_purchases keyed on charge_id.
      5. Return the confirmation_url; user is redirected there to approve.
      6. On approval, Shopify sends a webhook -> we call
         wallet_service.confirm_pack_purchase(charge_id) which grants credits.
    """
    try:
        data = request.get_json(silent=True) or {}
        pack_name = (data.get("pack_name") or "").lower()
        # Caller-supplied return URL (e.g. embedded-app callback inside Shopify
        # admin). When omitted, fall back to FRONTEND_URL (useful for tests
        # and non-embedded contexts).
        return_url_override = (data.get("return_url") or "").strip() or None
        user_id = request.user_id

        if not pack_name:
            return jsonify({"success": False, "error": "pack_name is required"}), 400
        if not is_valid_pack(pack_name):
            return jsonify({"success": False, "error": f"Invalid pack: {pack_name}"}), 400

        pricing_row, pricing_region, _ = _resolve_request_credit_pricing()
        pack = get_pack(pack_name, pricing_row)

        # In Shopify-app context, request.user_id is the myshopify domain itself
        # (set by require_shopify_auth). Look up the shop record to get the
        # access token.
        shop = document_store.get_shop_details(user_id)
        if not shop:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Shop not found. Please reinstall the app.",
                    }
                ),
                400,
            )

        access_token = shop.get("access_token")
        if not access_token:
            return jsonify({"success": False, "error": "Missing Shopify access token"}), 400

        shop_domain = _normalize_shop_domain(user_id)

        # Shopify automatically appends `?charge_id=<id>` to the return URL
        # after the merchant approves the charge. The callback page should
        # read `charge_id` from the query string and POST it to
        # /api/credits/confirm-pack/<charge_id> to grant credits.
        #
        # When the caller (the Shopify-embedded Remix app) supplies its own
        # return_url it'll point to the embedded admin route so the user
        # lands back inside the app iframe. Otherwise use FRONTEND_URL.
        if return_url_override:
            return_url = return_url_override
        else:
            return_url = (
                f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}"
                f"/credits/callback?pack={pack_name}"
            )
        is_test_mode = os.getenv("SHOPIFY_TEST_MODE", "false").lower() == "true"

        # If ROARR2X (or similar) is armed, Shopify's approve page should show
        # the credits that will actually be granted after approval.
        wallet = wallet_service.get_wallet(user_id) or {}
        promo_pending = bool(wallet.get("promo_roarr2x_pending"))
        charge_credits = int(pack["credits"]) * (2 if promo_pending else 1)
        charge_name = f"{pack['name']} credit pack ({charge_credits} credits)"
        if promo_pending:
            charge_name = (
                f"{pack['name']} credit pack ({charge_credits} credits, 2x promo)"
            )

        logger.info(
            f"Creating credit pack charge for user={user_id} shop={shop_domain} "
            f"pack={pack_name} pricing_region={pricing_region} price={pack['price']} "
            f"credits={charge_credits} promo_pending={promo_pending}"
        )

        try:
            data = shopify_graphql(
                user_id,
                access_token,
                """
                mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
                  appPurchaseOneTimeCreate(name: $name, price: $price, returnUrl: $returnUrl, test: $test) {
                    appPurchaseOneTime { id name status createdAt }
                    confirmationUrl
                    userErrors { field message }
                  }
                }
                """,
                {
                    "name": charge_name,
                    "price": {"amount": str(pack["price"]), "currencyCode": "USD"},
                    "returnUrl": return_url,
                    "test": is_test_mode,
                },
            )
            result = data.get("appPurchaseOneTimeCreate") or {}
            raise_on_user_errors(result)
        except ShopifyGraphQLError as exc:
            logger.error(f"Shopify rejected pack charge for {shop_domain}: {exc}")
            return (
                jsonify({"success": False, "error": f"Shopify error: {exc}"}),
                502,
            )

        purchase = result.get("appPurchaseOneTime") or {}
        # Numeric id: it is what Shopify appends to the return URL as `charge_id`.
        charge_id = gid_to_id(purchase.get("id"))
        confirmation_url = result.get("confirmationUrl")
        charge = {
            "id": charge_id,
            "name": purchase.get("name") or charge_name,
            "status": (purchase.get("status") or "").lower(),
            "price": str(pack["price"]),
            "created_at": purchase.get("createdAt"),
            "test": is_test_mode,
        }

        if not charge_id or not confirmation_url:
            logger.error(f"Malformed Shopify response for pack charge: {result}")
            return (
                jsonify({"success": False, "error": "Malformed Shopify response"}),
                502,
            )

        # Persist a pending purchase record. The webhook (or manual confirmation
        # endpoint) flips this to 'active' and grants credits.
        wallet_service.record_pending_purchase(
            charge_id=charge_id,
            user_id=user_id,
            pack_name=pack_name,
            shopify_payload=charge,
            pricing_row=pricing_row,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "charge_id": charge_id,
                    "confirmation_url": confirmation_url,
                    "pack_name": pack_name,
                    "credits": charge_credits,
                    "price": pack["price"],
                    "pricing_region": pricing_region,
                    "promo_pending": promo_pending,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error initiating pack purchase: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@credits_bp.route("/api/credits/confirm-pack/<charge_id>", methods=["POST"])
@require_shopify_auth
def confirm_pack(charge_id: str):
    """
    Manual / fallback confirmation endpoint. Useful when:
      - The user lands on the return_url and we want to grant credits
        immediately rather than wait for the webhook.
      - The webhook is delayed or missed.

    This endpoint is idempotent — re-calling it will not double-grant.
    """
    try:
        user_id = request.user_id
        purchase = wallet_service.get_purchase(charge_id)
        if not purchase:
            return jsonify({"success": False, "error": "Unknown charge_id"}), 404
        if purchase.get("user_id") != user_id:
            return jsonify({"success": False, "error": "Forbidden"}), 403

        charge, err = _fetch_charge_from_shopify(user_id, charge_id)
        if err:
            return err

        status = (charge.get("status") or "").lower()
        if status not in ("active", "accepted"):
            # 'pending' / 'declined' / 'expired' — don't grant.
            if status in ("declined", "expired"):
                wallet_service.mark_purchase_declined(charge_id, charge)
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Charge not approved (status={status})",
                        "status": status,
                    }
                ),
                400,
            )

        result = wallet_service.confirm_pack_purchase(
            charge_id=charge_id, shopify_payload=charge
        )
        if not result.get("already_active"):
            _capture_credits_pack_purchased(
                user_id=user_id,
                charge_id=charge_id,
                purchase=purchase,
                credits_granted=result.get("credits_granted"),
            )
        return (
            jsonify(
                {
                    "success": True,
                    "balance": wallet_service.get_balance(user_id),
                    "already_active": result.get("already_active", False),
                    "credits_granted": result.get("credits_granted"),
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error confirming pack purchase {charge_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@credits_bp.route("/api/credits/purchases", methods=["GET"])
@require_shopify_auth
def list_purchases():
    """
    List a user's recent credit-pack purchases (newest first), optionally
    filtered by status. Used by the wallet UI to render purchase history and
    surface in-flight (pending) charges.

    Query params:
      ?status=pending|active|declined|expired   (optional)
      ?limit=N                                   (default 50, capped at 200)
    """
    try:
        user_id = request.user_id
        status = (request.args.get("status") or "").strip().lower() or None
        try:
            limit = int(request.args.get("limit", 50))
        except (TypeError, ValueError):
            limit = 50
        purchases = wallet_service.list_purchases_for_user(
            user_id, limit=limit, status=status
        )
        return (
            jsonify(
                {"success": True, "purchases": purchases, "count": len(purchases)}
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error listing purchases: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@credits_bp.route("/api/credits/reconcile", methods=["POST"])
@require_shopify_auth
def reconcile_purchases():
    """
    Safety-net reconciliation for credit-pack purchases.

    Sweeps the user's `pending` purchase rows, fetches each charge's live
    status from Shopify, and:
      - active/accepted -> calls wallet.confirm_pack_purchase (idempotent grant)
      - declined/expired -> marks purchase as declined
      - still pending -> left alone

    The frontend should call this on mount of the billing page (and after the
    return-URL callback) so credits land even if the user closed the tab
    mid-flow or the return-URL callback never fired.
    """
    try:
        user_id = request.user_id
        pending = wallet_service.list_purchases_for_user(
            user_id, limit=50, status=PURCHASE_STATUS_PENDING
        )
        if not pending:
            return (
                jsonify(
                    {
                        "success": True,
                        "reconciled": 0,
                        "granted": [],
                        "declined": [],
                        "still_pending": [],
                        "balance": wallet_service.get_balance(user_id),
                    }
                ),
                200,
            )

        granted, declined, still_pending = [], [], []

        for purchase in pending:
            charge_id = purchase.get("charge_id")
            if not charge_id:
                continue

            charge, err = _fetch_charge_from_shopify(user_id, charge_id)
            if err:
                # Network/credentials issue — skip this one and let the next
                # reconciliation attempt try again.
                still_pending.append(charge_id)
                continue

            status = (charge.get("status") or "").lower()
            try:
                if status in ("active", "accepted"):
                    result = wallet_service.confirm_pack_purchase(
                        charge_id=charge_id, shopify_payload=charge
                    )
                    if not result.get("already_active"):
                        _capture_credits_pack_purchased(
                            user_id=user_id,
                            charge_id=charge_id,
                            purchase=purchase,
                            credits_granted=result.get("credits_granted"),
                        )
                    granted.append(
                        {
                            "charge_id": charge_id,
                            "credits_granted": result.get("credits_granted"),
                            "already_active": result.get("already_active", False),
                        }
                    )
                elif status in ("declined", "expired"):
                    wallet_service.mark_purchase_declined(charge_id, charge)
                    declined.append({"charge_id": charge_id, "status": status})
                else:
                    still_pending.append(charge_id)
            except Exception as inner:
                logger.error(
                    f"Reconcile failed for charge {charge_id}: {inner}"
                )
                still_pending.append(charge_id)

        return (
            jsonify(
                {
                    "success": True,
                    "reconciled": len(granted) + len(declined),
                    "granted": granted,
                    "declined": declined,
                    "still_pending": still_pending,
                    "balance": wallet_service.get_balance(user_id),
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error reconciling pack purchases: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


def _support_admin_secret() -> str:
    return (
        os.environ.get("SUPPORT_ADMIN_TOKEN_SECRET")
        or os.environ.get("SUPPORT_ADMIN_PASSWORD")
        or ""
    )


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _issue_support_token() -> str:
    exp = str(int(time.time()) + 12 * 60 * 60)
    sig = hmac.new(
        _support_admin_secret().encode("utf-8"),
        exp.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{exp}.{sig}"


def _support_authorized() -> bool:
    header = request.headers.get("Authorization") or ""
    if not header.startswith("Bearer "):
        return False
    token = header[7:].strip()
    secret = _support_admin_secret()
    if not secret or "." not in token:
        return False
    exp, sig = token.split(".", 1)
    try:
        if int(exp) < int(time.time()):
            return False
    except ValueError:
        return False
    expected = hmac.new(
        secret.encode("utf-8"), exp.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(sig, expected)


def _wallet_shop_domain(shop: str) -> str:
    """Wallet key is the full myshopify domain, same as support_grant_credits.py."""
    s = (shop or "").strip().lower()
    s = s.replace("https://", "").replace("http://", "").split("/")[0]
    if s and not s.endswith(".myshopify.com"):
        s = f"{s}.myshopify.com"
    return s


@credits_bp.route("/api/support/login", methods=["POST"])
def support_admin_login():
    """Password login for the Vercel support grant form. No Shopify session."""
    expected = os.environ.get("SUPPORT_ADMIN_PASSWORD") or ""
    if not expected:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Support admin login is not configured",
                }
            ),
            503,
        )
    body = request.get_json(silent=True) or {}
    given = str(body.get("password") or "")
    if not hmac.compare_digest(_digest(given), _digest(expected)):
        return jsonify({"success": False, "error": "Wrong password"}), 401
    return jsonify({"success": True, "token": _issue_support_token()})


@credits_bp.route("/api/support/grant-credits", methods=["POST"])
def support_admin_grant_credits():
    """
    Grant support credits to a shop wallet.

    Body: shop (myshopify domain), credits (positive int), note (optional).
    Authorization: Bearer token from /api/support/login.
    """
    if not _support_authorized():
        return jsonify({"success": False, "error": "Login required"}), 401

    body = request.get_json(silent=True) or {}
    shop = _wallet_shop_domain(body.get("shop") or body.get("shopDomain") or "")
    if not shop or not shop.endswith(".myshopify.com") or shop == ".myshopify.com":
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Enter a shop domain like store-name.myshopify.com",
                }
            ),
            400,
        )

    try:
        amount = int(body.get("credits") or body.get("amount") or 0)
    except (TypeError, ValueError):
        amount = 0
    if amount <= 0:
        return (
            jsonify({"success": False, "error": "Credits must be a positive number"}),
            400,
        )

    note = str(body.get("note") or "Support manual grant").strip() or "Support manual grant"
    try:
        result = wallet_service.grant(
            user_id=shop,
            amount=amount,
            entry_type="grant_support",
            reference_id=None,
            metadata={"source": "support_admin", "note": note},
        )
    except Exception as e:
        logger.error(f"Support grant failed for {shop}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

    return jsonify(
        {
            "success": True,
            "shop": shop,
            "granted": amount,
            "balance": result.get("balance"),
            "entry_id": result.get("entry_id"),
        }
    )
