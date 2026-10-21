"""
Brand DNA Routes
API endpoints for Brand DNA workflows.
"""

import logging
import threading
import uuid

from flask import Blueprint, jsonify, request
from ..auth.utils import require_shopify_auth
from ..credits import wallet_service, InsufficientCreditsError
from ..database import document_store
from ...constants.credits import shop_skips_credit_gates
from .service import (
    build_dna,
    campaign_list_summary,
    generate_campaign_ideas,
    generate_creatives,
    get_brand_dna_service_status,
)


logger = logging.getLogger(__name__)

brand_dna_bp = Blueprint("brand_dna", __name__)


# One campaign generates 3 brand-ad creatives at 10 credits each = 30 credits.
BRAND_ADS_CAMPAIGN_FEATURE = "brand_ads_campaign"


def _decimal_to_native(obj):
    """Convert any Decimal values returned by DynamoDB into JSON-friendly types."""
    from decimal import Decimal

    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: _decimal_to_native(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimal_to_native(v) for v in obj]
    return obj


def _run_creatives_generation_task(
    campaign_id: str,
    user_id: str,
    data: dict,
    spend_ledger_id=None,
):
    """Generate Brand Ads creatives after the API returns a campaign handle."""
    try:
        document_store.update_user_campaign_generation(
            user_id=user_id,
            campaign_id=campaign_id,
            generation_status="in_progress",
            generation_percentage=5,
            generation_error="",
        )
        result = generate_creatives(data)
        creatives = result.get("creatives") or []
        updated = document_store.update_user_campaign_generation(
            user_id=user_id,
            campaign_id=campaign_id,
            generation_status="completed",
            generation_percentage=100,
            creatives=creatives,
            generation_error="",
        )
        if not updated:
            raise RuntimeError("Could not save generated creatives")
        logger.info(
            "Completed brand-ads creatives generation "
            f"(campaign_id={campaign_id}, user_id={user_id})"
        )
    except Exception as e:
        logger.error(
            f"Error generating brand-ads creatives (campaign_id={campaign_id}): {e}"
        )
        if spend_ledger_id:
            try:
                wallet_service.refund(
                    user_id=user_id,
                    feature=BRAND_ADS_CAMPAIGN_FEATURE,
                    reference_id=campaign_id,
                    spend_ledger_id=spend_ledger_id,
                    reason="generate_creatives_failed",
                )
            except Exception as refund_err:
                logger.error(
                    "Refund after generate_creatives failure also failed for "
                    f"campaign_id={campaign_id}: {refund_err}"
                )
        document_store.update_user_campaign_generation(
            user_id=user_id,
            campaign_id=campaign_id,
            generation_status="failed",
            generation_percentage=0,
            generation_error=str(e),
        )


@brand_dna_bp.route("/api/brand-dna/create", methods=["POST"])
@require_shopify_auth
def create_brand_dna():
    """Start Brand DNA creation flow."""
    payload = request.get_json(silent=True) or {}
    user_id = request.user_id

    try:
        store = document_store.get_shop_details(user_id)
    except Exception as e:
        return jsonify({"success": False, "error": f"Error fetching store details: {str(e)}"}), 500

    if not store:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Store not found. Please connect your Shopify store first.",
                }
            ),
            404,
        )

    store_url = (
        store.get("domain")
        or store.get("myshopify_domain")
        or store.get("shopify_domain")
        or ""
    )

    payload["store_url"] = store_url
    result = build_dna(payload)
    result["products"] = payload.get("products") or []

    # Align with GET /api/brand-dna: UI and helpers expect BrandDNAProfile nesting.
    bd = result.get("brand_dna")
    if isinstance(bd, dict) and "BrandDNAProfile" not in bd:
        result = {**result, "brand_dna": {"BrandDNAProfile": bd}}

    try:
        products_for_store = payload.get("products")
        if not isinstance(products_for_store, list):
            products_for_store = []
        document_store.save_user_dna(
            shopify_domain=user_id,
            brand_dna=result.get("brand_dna") or {},
            storefront_signals=result.get("storefront_signals") or {},
            store_url=store_url,
            dna_products=products_for_store,
        )
    except Exception as save_err:
        logger.error(f"Failed to persist Brand DNA for {user_id}: {save_err}")

    return jsonify({"success": True, "data": result}), 200


@brand_dna_bp.route("/api/brand-dna", methods=["GET"])
@require_shopify_auth
def get_brand_dna():
    """Return the persisted Brand DNA for the authenticated shop, if any."""
    user_id = request.user_id
    try:
        item = document_store.get_user_dna(user_id)
    except Exception as e:
        logger.error(f"Error fetching Brand DNA for {user_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

    if not item:
        return jsonify({"success": True, "data": None}), 200

    item = _decimal_to_native(item)
    raw_dna = item.get("brand_dna") or {}
    # Frontend dnaHelpers expect data.brand_dna.BrandDNAProfile.* — normalize
    # so both flat and pre-wrapped shapes are returned in the wrapped form.
    if isinstance(raw_dna, dict) and "BrandDNAProfile" in raw_dna:
        wrapped_dna = raw_dna
    else:
        wrapped_dna = {"BrandDNAProfile": raw_dna}

    return (
        jsonify(
            {
                "success": True,
                "data": {
                    "brand_dna": wrapped_dna,
                    "storefront_signals": item.get("storefront_signals") or {},
                    "store_url": item.get("store_url") or "",
                    "shop": item.get("shopify_domain") or user_id,
                    "brand_name": item.get("brand_name") or "",
                    "created_at": item.get("created_at"),
                    "updated_at": item.get("updated_at"),
                    "version": item.get("version", 0),
                    "products": item.get("dna_products") or [],
                },
            }
        ),
        200,
    )


@brand_dna_bp.route("/api/brand-dna/update", methods=["PUT", "POST"])
@require_shopify_auth
def update_brand_dna():
    """Update the persisted Brand DNA for the authenticated shop.

    Accepts either a full ``brand_dna`` blob or a ``dna_patch`` partial map,
    or top-level Brand DNA fields (``brand_name``, ``tagline``, ...).
    """
    user_id = request.user_id
    payload = request.get_json(silent=True) or {}

    if not payload:
        return (
            jsonify({"success": False, "error": "No update payload provided"}),
            400,
        )

    updated = document_store.update_user_dna(user_id, payload)
    if updated is None:
        return (
            jsonify({"success": False, "error": "Failed to update Brand DNA"}),
            500,
        )

    updated = _decimal_to_native(updated)
    return (
        jsonify(
            {
                "success": True,
                "data": {
                    "brand_dna": updated.get("brand_dna") or {},
                    "storefront_signals": updated.get("storefront_signals") or {},
                    "store_url": updated.get("store_url") or "",
                    "shop": updated.get("shopify_domain") or user_id,
                    "brand_name": updated.get("brand_name") or "",
                    "created_at": updated.get("created_at"),
                    "updated_at": updated.get("updated_at"),
                    "version": updated.get("version", 0),
                    "products": updated.get("dna_products") or [],
                },
            }
        ),
        200,
    )


@brand_dna_bp.route("/api/brand-dna/campaign-ideas", methods=["POST"])
@require_shopify_auth
def campaign_ideas():
    """Generate 3 campaign ideas from Brand DNA and selected product."""
    data = request.get_json(silent=True) or {}
    dna = data.get("dna") or {}
    product = data.get("product") or {}

    if not dna:
        return jsonify({"success": False, "error": "dna is required"}), 400
    if not product:
        return jsonify({"success": False, "error": "product is required"}), 400

    try:
        result = generate_campaign_ideas(data)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@brand_dna_bp.route("/api/brand-dna/generate-creatives", methods=["POST"])
@require_shopify_auth
def generate_creatives_route():
    """Generate text creatives and render images in one response (Gemini text + image).

    Credits: spends `brand_ads_campaign` (30) up-front. Refunds if creative
    generation fails so a system error never leaves the user out-of-pocket.
    Internal stores bypass the credit check.
    """
    data = request.get_json(silent=True) or {}
    dna = data.get("dna") or {}
    product = data.get("product") or {}
    idea = data.get("idea") or {}

    if not dna:
        return jsonify({"success": False, "error": "dna is required"}), 400
    if not product:
        return jsonify({"success": False, "error": "product is required"}), 400
    if not idea:
        return jsonify({"success": False, "error": "idea is required"}), 400

    user_id = request.user_id
    try:
        shop = document_store.get_shop_details(user_id)
        skip_credit_gates = shop_skips_credit_gates(shop)
    except Exception:
        skip_credit_gates = False

    # PK for the campaign row and wallet reference (stable across spend + persist).
    campaign_id = str(uuid.uuid4())
    spend_ledger_id = None
    charged_cost = 0

    if not skip_credit_gates:
        try:
            spend_result = wallet_service.spend(
                user_id=user_id,
                feature=BRAND_ADS_CAMPAIGN_FEATURE,
                reference_id=campaign_id,
                metadata={
                    "brand": dna.get("brand_name"),
                    "product_title": product.get("title"),
                    "idea_title": idea.get("title") if isinstance(idea, dict) else None,
                    "campaign_id": campaign_id,
                },
            )
            spend_ledger_id = spend_result["spend_ledger_id"]
            charged_cost = int(spend_result.get("cost") or 0)
            logger.info(
                f"Charged {spend_result['cost']} credits for brand_ads_campaign "
                f"(user={user_id}, campaign_id={campaign_id}, balance={spend_result['balance']})"
            )
        except InsufficientCreditsError as e:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": (
                            f"Insufficient credits. You need {e.required} credits "
                            f"to generate a brand ads campaign but have {e.balance}. "
                            f"Please purchase a credit pack to continue."
                        ),
                        "balance": e.balance,
                        "required": e.required,
                        "feature": e.feature,
                    }
                ),
                402,
            )

    saved = document_store.save_user_campaign(
        user_id=user_id,
        campaign_id=campaign_id,
        campaign_data={
            "brand_name": (dna.get("brand_name") or "")
            if isinstance(dna, dict)
            else "",
            "product": product,
            "idea": idea,
            "creatives": [],
            "generation_status": "queued",
            "generation_percentage": 0,
            "spend_ledger_id": spend_ledger_id,
        },
        cost_charged=charged_cost,
    )
    if saved is None:
        if spend_ledger_id:
            try:
                wallet_service.refund(
                    user_id=user_id,
                    feature=BRAND_ADS_CAMPAIGN_FEATURE,
                    reference_id=campaign_id,
                    spend_ledger_id=spend_ledger_id,
                    reason="campaign_row_create_failed",
                )
            except Exception as refund_err:
                logger.error(
                    "Refund after campaign row create failure also failed for "
                    f"campaign_id={campaign_id}: {refund_err}"
                )
        return (
            jsonify({"success": False, "error": "Could not create campaign row"}),
            500,
        )

    generation_thread = threading.Thread(
        target=_run_creatives_generation_task,
        args=(campaign_id, user_id, data, spend_ledger_id),
        daemon=True,
    )
    generation_thread.start()
    logger.info(
        "Started background brand-ads creatives generation "
        f"(campaign_id={campaign_id}, user_id={user_id})"
    )

    return (
        jsonify(
            {
                "success": True,
                "data": {
                    "campaign_id": campaign_id,
                    "campaign_saved": True,
                    "generation_status": "queued",
                    "generation_percentage": 0,
                },
                "message": "Brand ads generation started in background",
            }
        ),
        202,
    )


@brand_dna_bp.route("/api/brand-dna/campaigns", methods=["GET"])
@require_shopify_auth
def list_brand_dna_campaigns():
    """List saved brand-ads campaigns for the shop (newest first, no image blobs)."""
    user_id = request.user_id
    try:
        rows = document_store.list_user_campaigns(user_id)
        summaries = [campaign_list_summary(r) for r in rows if r.get("campaign_id")]
        summaries = _decimal_to_native(summaries)
        return (
            jsonify({"success": True, "data": {"campaigns": summaries}}),
            200,
        )
    except Exception as e:
        logger.error(f"Error listing campaigns for {user_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@brand_dna_bp.route("/api/brand-dna/campaigns/<campaign_id>/creatives", methods=["PUT", "POST"])
@require_shopify_auth
def update_brand_dna_campaign_creatives(campaign_id: str):
    """Persist creatives after edits (e.g. approved image regeneration)."""
    user_id = request.user_id
    if not campaign_id or not str(campaign_id).strip():
        return jsonify({"success": False, "error": "campaign_id is required"}), 400
    payload = request.get_json(silent=True) or {}
    creatives = payload.get("creatives")
    if not isinstance(creatives, list):
        return (
            jsonify({"success": False, "error": "creatives must be an array"}),
            400,
        )
    updated = document_store.update_user_campaign_creatives(
        user_id=user_id,
        campaign_id=str(campaign_id).strip(),
        creatives=creatives,
    )
    if not updated:
        return jsonify({"success": False, "error": "Campaign not found"}), 404
    return (
        jsonify(
            {
                "success": True,
                "data": _decimal_to_native(
                    {
                        "campaign_id": updated.get("campaign_id"),
                        "updated_at": updated.get("updated_at"),
                        "version": updated.get("version"),
                    }
                ),
            }
        ),
        200,
    )


@brand_dna_bp.route("/api/brand-dna/campaigns/<campaign_id>", methods=["GET"])
@require_shopify_auth
def get_brand_dna_campaign(campaign_id: str):
    """Return one campaign row (including creatives) if owned by the shop."""
    user_id = request.user_id
    if not campaign_id or not str(campaign_id).strip():
        return jsonify({"success": False, "error": "campaign_id is required"}), 400
    try:
        item = document_store.get_user_campaign(str(campaign_id).strip(), user_id=user_id)
        if not item:
            return jsonify({"success": False, "error": "Campaign not found"}), 404
        return jsonify({"success": True, "data": _decimal_to_native(item)}), 200
    except Exception as e:
        logger.error(f"Error fetching campaign {campaign_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
