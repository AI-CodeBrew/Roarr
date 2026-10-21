"""
Generate Routes: Product content generation endpoints
"""

from flask import Blueprint, request, jsonify
from werkzeug.exceptions import NotFound, BadRequest, HTTPException
import time
import logging
import json
import os
import tempfile
import threading
import uuid
from ..auth.utils import require_auth, extract_user_attributes, require_shopify_auth
from ..credits import wallet_service, InsufficientCreditsError
from ...constants.credits import (
    PURCHASE_STATUS_ACTIVE,
    get_feature_cost,
    get_page_generation_cost,
    get_store_creation_cost,
    shop_skips_credit_gates,
)
from ..database import document_store
from .generate_text import generate_text
from .generate_images import (
    cleanup_temp_directory,
    generate_and_upload_image_with_retry,
    convert_urls_to_paths,
)
from .store_single_product_service import generate_for_single_product_store
from .store_multi_product_service import generate_for_multi_product_store
from .logo_url_loader import logo_url_loader
from .detect_color_scheme import detect_color_scheme
from .store.templates.single_store.signature import (
    HomePageSingleStore,
    ProductPageSingleStore,
)
from .store.templates.multi_store.signature import (
    HomePageMultiStore,
    ProductPageMultiStore,
)
from .prompts import PRODUCT_CATEGORY_PROMPT_SYSTEM, STORE_CATEGORY_PROMPT_SYSTEM
from ...clients import openai_client as client
from .service import run_generation_task, run_store_generation_task
from .store_payload_utils import (
    collect_product_image_urls,
    product_dict_for_image_collection,
    store_description_from_shopify,
)
from ..shopify.shopify_utils import shopify_utils

logger = logging.getLogger(__name__)

# Create Blueprint for generate routes
generate_bp = Blueprint("generate", __name__)

# Short TTL cache for generated-pages list (fewer Dynamo reads on repeated navigations).
_PAGES_LIST_CACHE = {}
_PAGES_LIST_CACHE_TTL_SEC = 30

# Keep category list in one place for all detection endpoints
DETECTABLE_CATEGORIES = [
    "health_beauty",
    "fashion",
    "home_kitchen",
    "kids_toys",
    "car_accessories",
    "general",
]

# Shown with /api/generation-status polling; thresholds align with store generation progress in DynamoDB.
STORE_GENERATION_STEPS = [
    {"label": "Preparing your store", "threshold": 0},
    {"label": "Validating products", "threshold": 4},
    {"label": "Building product context", "threshold": 8},
    {"label": "Generating home page content", "threshold": 12},
    {"label": "Drafting headlines and sections", "threshold": 20},
    {"label": "Preparing image assets", "threshold": 28},
    {"label": "Generating hero and banners", "threshold": 40},
    {"label": "Rendering features and highlights", "threshold": 52},
    {"label": "Finalizing home page visuals", "threshold": 62},
    {"label": "Syncing collections", "threshold": 74},
    {"label": "Saving generated content", "threshold": 95},
    {"label": "Completed", "threshold": 100},
]


def _store_flow_mode_for_api(internal_mode: str) -> str:
    """Map Dynamo/request store mode to API field: single_product -> single, multi_product -> multi."""
    return "single" if internal_mode == "single_product" else "multi"


def _load_image_key_ratio_map() -> dict:
    """
    Build a flat image_key -> aspect_ratio map used by regenerate endpoint.
    Reads store template key configs for single and multi product store flows.
    """
    ratio_map = {}
    base_dir = os.path.join(os.path.dirname(__file__), "store", "templates")
    candidates = [
        # Amour first: shared keys (product_image_*, banner_image) keep the classic
        # ratios below; Amour-only keys (look_image_*, story_image, ...) come from here.
        os.path.join(base_dir, "packs", "amour", "image_keys.json"),
        os.path.join(base_dir, "single_store", "image_keys.json"),
        os.path.join(base_dir, "multi_store", "image_keys.json"),
        # Cinematic pack: banner_image 16:9 + banner_image_mobile 9:16
        os.path.join(base_dir, "packs", "cinematic", "image_keys.json"),
    ]

    for config_path in candidates:
        try:
            if not os.path.exists(config_path):
                continue
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f) or {}
            for section in ("home_page", "product_page"):
                section_data = data.get(section)
                if isinstance(section_data, dict):
                    for key, ratio in section_data.items():
                        if key and isinstance(ratio, str) and ratio.strip():
                            ratio_map[str(key)] = ratio.strip()
        except Exception as err:
            logger.warning(
                "Failed loading image ratio config from %s: %s", config_path, err
            )

    return ratio_map


IMAGE_KEY_RATIO_MAP = _load_image_key_ratio_map()
# Brand Ads creatives are generated at 9:16; regenerate must match (keys from Shopify app).
for _slot in range(1, 4):
    IMAGE_KEY_RATIO_MAP[f"brand_ads_creative_{_slot}"] = "9:16"


def _enrich_store_payload_with_shopify_products(data, mode, product_ids, user_id):
    if not product_ids:
        return
    ids = [str(x).strip() for x in product_ids if x is not None and str(x).strip()]
    if not ids:
        return

    if mode == "single_product":
        pid = ids[0]
        if len(ids) > 1:
            logger.info(
                "single_product store generation: multiple productIds; using %s",
                pid,
            )
        pd = shopify_utils.get_product(pid, user_id)
        shaped = product_dict_for_image_collection(pd)
        imgs = collect_product_image_urls(shaped)
        desc = store_description_from_shopify(pd)
        handle = (pd.get("handle") or "").strip()
        data["productTitle"] = pd.get("title") or data.get("productTitle") or ""
        data["productHandle"] = handle
        data["productDescription"] = desc or (data.get("productDescription") or "")
        data["productImages"] = imgs
        data["handle"] = handle
        data["product"] = {
            "id": pd.get("id"),
            "title": pd.get("title"),
            "description": desc,
            "descriptionHtml": pd.get("description_html") or "",
            "handle": handle,
            "productHandle": handle,
            "images": imgs,
            "productImages": imgs,
        }
        data["shopify_product"] = pd
        return

    if mode == "multi_product":
        slice_ids = ids[:3]
        products = []
        for pid in slice_ids:
            pd = shopify_utils.get_product(pid, user_id)
            shaped = product_dict_for_image_collection(pd)
            imgs = collect_product_image_urls(shaped)
            desc = store_description_from_shopify(pd)
            handle = (pd.get("handle") or "").strip()
            products.append(
                {
                    "id": pd.get("id"),
                    "title": pd.get("title") or "",
                    "productHandle": handle,
                    "description": desc,
                    "image": imgs[0] if imgs else None,
                    "images": imgs,
                }
            )
        data["products"] = products


@generate_bp.route("/api/generation", methods=["POST"])
@require_shopify_auth
# @require_auth
def generation():
    """
    Generate product content (text and images) with store configuration data
    Starts generation in background and returns immediately with page_id
    """
    try:
        user_id = request.user_id
        # Get the request data
        data = request.get_json()
        # Generate content for the magic process
        if (
            data.get("productTitle") is None
            or data.get("productDescription") is None
            or data.get("productImages") is None
        ):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "productTitle and productDescription are required",
                    }
                ),
                400,
            )

        try:
            store = document_store.get_shop_details(user_id)
            if store and not store.get("is_onboarding"):
                document_store.set_shop_onboarding_true(user_id)
                store["is_onboarding"] = True

        except Exception as e:
            logger.error(f"Error checking free products: {str(e)}")
            return (
                jsonify({"success": False, "error": "Error checking free products"}),
                500,
            )

        product_title = data.get("productTitle")
        product_description = data.get("productDescription")
        product_id = data.get("productId")
        store_name = data.get("storeName")
        page_id = data.get("pageId")
        product_images = data.get("productImages", [])

        # Map frontend category format to backend format
        category = data.get("category", "general")
        # Map frontend template format (int) to backend format
        frontend_template = data.get("selectedTemplate", 1)
        template = f"template_{frontend_template}"
        # Generation language (e.g. "Spanish", "French") – optional
        language = data.get("language") or data.get("generationLanguage")

        # Store product details in database with null generation_data
        stored_page = None
        spend_ledger_id = None
        skip_credit_gates = shop_skips_credit_gates(store)

        if not page_id:
            if not user_id:
                return (
                    jsonify(
                        {"success": False, "error": "Could not determine user_id"}
                    ),
                    400,
                )

            # Pre-mint the page_id so we can use it as the wallet spend
            # reference_id. Internal / allow_bypass shops skip credit gating.
            page_id = str(uuid.uuid4())

            if not skip_credit_gates:
                try:
                    page_cost = wallet_service.resolve_gated_spend_cost(
                        user_id, get_page_generation_cost(category, frontend_template)
                    )
                    spend_result = wallet_service.spend(
                        user_id=user_id,
                        feature="page_generation",
                        reference_id=page_id,
                        cost=page_cost,
                        metadata={
                            "product_id": product_id,
                            "product_title": product_title,
                            "store_name": store_name,
                            "cost": page_cost,
                        },
                    )
                    spend_ledger_id = spend_result["spend_ledger_id"]
                    logger.info(
                        f"Charged {spend_result['cost']} credits for page_generation "
                        f"(user={user_id}, page_id={page_id}, balance={spend_result['balance']})"
                    )
                except InsufficientCreditsError as e:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": (
                                    f"Insufficient credits. You need {e.required} credits "
                                    f"to generate a product page but have {e.balance}. "
                                    f"Please purchase a credit pack to continue."
                                ),
                                "balance": e.balance,
                                "required": e.required,
                                "feature": e.feature,
                            }
                        ),
                        402,  # Payment Required
                    )

            metadata = {
                "product_id": product_id,
                "product_title": product_title,
                "product_description": product_description,
                "category": category,
                "template": template,
                "selectedTemplate": frontend_template,
                "store_name": store_name,
                "language": language,
                "step": 1,
                "spend_ledger_id": spend_ledger_id,
            }
            try:
                stored_page = document_store.create_generated_page(
                    user_id=user_id,
                    generation_data=None,
                    metadata=metadata,
                    page_id=page_id,
                )
            except Exception as e:
                # If we charged but failed to persist the page row, refund so
                # we don't strand the user's credits.
                if spend_ledger_id:
                    try:
                        wallet_service.refund(
                            user_id=user_id,
                            feature="page_generation",
                            reference_id=page_id,
                            spend_ledger_id=spend_ledger_id,
                            reason="page_row_create_failed",
                        )
                    except Exception as refund_err:
                        logger.error(
                            f"Refund after create_generated_page failure also failed for {page_id}: {refund_err}"
                        )
                logger.error(f"Error storing initial page in database: {str(e)}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Error storing initial page: {str(e)}",
                        }
                    ),
                    500,
                )
            logger.info(
                f"Stored initial page {page_id} for user {user_id} at step 1"
            )

        generation_thread = threading.Thread(
            target=run_generation_task,
            args=(
                page_id,
                product_title,
                product_description,
                product_id,
                store_name,
                category,
                template,
                product_images,
                language,
            ),
            kwargs={
                "user_id": user_id,
                "spend_ledger_id": spend_ledger_id,
            },
            daemon=True,
        )
        generation_thread.start()
        logger.info(f"Started background generation task for page_id={page_id}")

        # Return immediately with page_id
        return (
            jsonify(
                {
                    "success": True,
                    "page_id": page_id,
                    "message": "Generation started in background",
                }
            ),
            202,  # Accepted status code
        )

    except Exception as e:
        logger.error(f"Error in generation: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/generation-status/<page_id>", methods=["GET"])
@require_shopify_auth
def get_generation_status(page_id):
    """
    Get the generation status for a specific page_id

    Returns:
        - generation_status: "in_progress", "completed", or "failed"
        - page data if available
    """
    try:
        if not page_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "page_id is required",
                    }
                ),
                400,
            )

        # Get page from database
        page = document_store.get_generated_page_by_id(page_id)

        if not page:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Page not found",
                    }
                ),
                404,
            )

        # Get generation status (default to None if not set)
        generation_status = page.get("generation_status", None)
        # Get generation percentage (default to 0 if not set)
        generation_percentage = page.get("generation_percentage", 0)

        response_data = {
            "success": True,
            "page_id": page_id,
            "generation_status": generation_status,
            "generation_percentage": generation_percentage,
            "published": bool(page.get("published")),
            "publish_status": page.get("publish_status"),
            "publish_error": page.get("publish_error") or None,
            "theme_id": page.get("theme_id"),
            "preview_link": page.get("preview_link"),
        }

        if page.get("generation_type") == "store":
            stored_mode = page.get("mode")
            if stored_mode in ("single_product", "multi_product"):
                response_data["mode"] = _store_flow_mode_for_api(stored_mode)

        # Include generation_data if status is completed
        if generation_status == "completed" and page.get("generation_data"):
            response_data["generation_data"] = page.get("generation_data")

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error getting generation status for page_id={page_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/detect-category", methods=["POST"])
@require_shopify_auth
def detect_category():
    """Detect product category using AI based on product title and optional description"""
    try:
        user_id = request.user_id
        data = request.get_json(force=True)

        if not data or "title" not in data:
            return (
                jsonify({"success": False, "error": "Product title is required"}),
                400,
            )

        product_title = data["title"]
        product_description = data.get("description", "")  # Optional description

        # Build user message with title and description (if provided)
        user_content = f"Product Title: {product_title}"
        if product_description:
            user_content += f"\nProduct Description: {product_description}"

        # Ask AI with structured response schema
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": PRODUCT_CATEGORY_PROMPT_SYSTEM},
                {
                    "role": "user",
                    "content": user_content,
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "category_schema",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "category": {
                                "type": "string",
                                "enum": DETECTABLE_CATEGORIES,
                            }
                        },
                        "required": ["category"],
                        "additionalProperties": False,
                    },
                },
            },
        )

        # Model guarantees structured JSON here
        choice = response.choices[0].message

        # If response_format=json_schema was used:
        if hasattr(choice, "parsed") and choice.parsed is not None:
            structured_output = choice.parsed
        else:
            # Fallback: manually parse the string
            structured_output = json.loads(choice.content)

        detected_category = structured_output["category"]

        log_message = (
            f"Detected category '{detected_category}' for product '{product_title}'"
        )
        if product_description:
            log_message += f" with description"
        log_message += f" by user {user_id}"
        logger.info(log_message)

        response_data = {
            "success": True,
            "category": detected_category,
            "title": product_title,
        }
        if product_description:
            response_data["description"] = product_description

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error detecting category for user {user_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/detect-store-category", methods=["POST"])
@require_shopify_auth
def detect_store_category():
    """Detect store category from 1 to 5 product title/description pairs."""
    user_id = None
    try:
        user_id = request.user_id
        data = request.get_json(force=True) or {}
        products = data.get("products")

        if not isinstance(products, list):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "products must be an array with 1 to 5 items",
                    }
                ),
                400,
            )

        if len(products) < 1 or len(products) > 5:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Provide between 1 and 5 products",
                    }
                ),
                400,
            )

        normalized_products = []
        for idx, product in enumerate(products, start=1):
            if not isinstance(product, dict):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Product {idx} must be an object with title and description",
                        }
                    ),
                    400,
                )

            title = str(product.get("title", "")).strip()
            description = str(product.get("description", "")).strip()

            if not title:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Product {idx} title is required",
                        }
                    ),
                    400,
                )

            if "description" not in product:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Product {idx} description is required",
                        }
                    ),
                    400,
                )

            normalized_products.append(
                {
                    "title": title,
                    "description": description,
                }
            )

        product_lines = []
        for idx, product in enumerate(normalized_products, start=1):
            product_lines.append(
                (
                    f"Product {idx}:\n"
                    f"Title: {product['title']}\n"
                    f"Description: {product['description']}"
                )
            )
        user_content = "\n\n".join(product_lines)

        store_category_schema = {
            "name": "store_category_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": DETECTABLE_CATEGORIES,
                    },
                    "confidence_percentage": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 100,
                    },
                },
                "required": ["category", "confidence_percentage"],
                "additionalProperties": False,
            },
        }

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": STORE_CATEGORY_PROMPT_SYSTEM},
                {"role": "user", "content": user_content},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": store_category_schema,
            },
        )

        choice = response.choices[0].message
        if hasattr(choice, "parsed") and choice.parsed is not None:
            structured_output = choice.parsed
        else:
            structured_output = json.loads(choice.content)

        detected_category = structured_output["category"]
        confidence_percentage = float(structured_output["confidence_percentage"])

        if confidence_percentage < 0:
            confidence_percentage = 0.0
        elif confidence_percentage > 100:
            confidence_percentage = 100.0

        logger.info(
            f"Detected store category '{detected_category}' with confidence "
            f"{confidence_percentage:.2f}% for user {user_id}"
        )

        return (
            jsonify(
                {
                    "success": True,
                    "category": detected_category,
                    "confidence_percentage": round(confidence_percentage, 2),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error detecting store category for user {user_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/generate-for-store", methods=["POST"])
@require_shopify_auth
def generate_for_store():
    """
    Generate store-level content (home + product pages) as an async job.
    Mirrors the product generation job lifecycle: creates a page_id, starts a
    background thread, updates generation_status/percentage, and stores generation_data.
    """
    try:
        user_id = request.user_id
        data = request.get_json(force=True) or {}

        mode_raw = data.get("mode")
        mode = str(mode_raw).strip().lower()
        page_id = data.get("pageId")
        if mode not in {"single_product", "multi_product"}:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "mode must be 'single_product' or 'multi_product'",
                    }
                ),
                400,
            )

        try:
            store = document_store.get_shop_details(user_id)
            if store and not store.get("is_onboarding"):
                document_store.set_shop_onboarding_true(user_id)
        except Exception as e:
            logger.error(
                f"Error setting shop onboarding for store generation: {str(e)}"
            )
            return (
                jsonify({"success": False, "error": "Error checking shop onboarding"}),
                500,
            )

        skip_credit_gates = shop_skips_credit_gates(store)
        spend_ledger_id = None

        store_category = data.get("storeCategory")
        category_key = str(store_category or "").strip().lower() or "general"
        language = data.get("language") or data.get("generationLanguage")
        market_type_raw = data.get("market_type") or data.get("marketType") or "prepaid"
        market_type = str(market_type_raw).strip().lower()
        if market_type not in {"cod", "prepaid"}:
            market_type = "prepaid"
        country_code_raw = data.get("country_code") or data.get("countryCode")
        country_code = (
            str(country_code_raw).strip().upper()[:2] if country_code_raw else None
        )
        # Product page template: 1 = Sleek, 2 = Vibe (same as PDP generate).
        selected_template_raw = data.get("selectedTemplate") or data.get(
            "selected_template"
        )
        try:
            selected_template = int(selected_template_raw)
        except (TypeError, ValueError):
            selected_template = 1
        if selected_template not in {1, 2}:
            selected_template = 1
        # Persist on payload for background workers / generation_data
        data["market_type"] = market_type
        data["country_code"] = country_code
        data["selectedTemplate"] = selected_template
        data["selected_template"] = selected_template
        from .store.pack_utils import (
            SINGLE_PRODUCT_ONLY_STORE_TEMPLATE_PACKS,
            normalize_store_template_pack,
        )

        store_template_pack = normalize_store_template_pack(
            data.get("storeTemplatePack") or data.get("store_template_pack")
        )
        # Cinematic and Amour packs are single-product only (COD + prepaid).
        if (
            store_template_pack in SINGLE_PRODUCT_ONLY_STORE_TEMPLATE_PACKS
            and mode != "single_product"
        ):
            store_template_pack = "classic"
        data["storeTemplatePack"] = store_template_pack
        data["store_template_pack"] = store_template_pack
        product_ids = data.get("productIds", [])
        premium_product_ids = (
            data.get("premiumProductIds")
            or data.get("premium_product_ids")
            or []
        )
        if not isinstance(premium_product_ids, list):
            premium_product_ids = []
        data["premiumProductIds"] = premium_product_ids
        data["premium_product_ids"] = premium_product_ids
        style_preferences_data = data.get("stylePreferences", {})
        style_preferences = {
            "selected_color": style_preferences_data.get("dynamicColor"),
            "body_font": style_preferences_data.get("bodyFont"),
            "heading_font": style_preferences_data.get("headingFont"),
        }

        if not page_id:
            # Pre-mint page_id so the wallet spend reference_id matches the
            # eventual page_id in DynamoDB. Internal / allow_bypass shops skip
            # purchase and credit gating.
            page_id = str(uuid.uuid4())

            store_creation_cost = get_store_creation_cost(
                mode,
                market_type,
                store_template_pack,
                include_premium_pdps=(
                    bool(premium_product_ids)
                    if (
                        mode == "multi_product"
                        or "premiumProductIds" in data
                        or "premium_product_ids" in data
                    )
                    else True
                ),
                selected_template=selected_template,
            )

            if not skip_credit_gates:
                # Pack purchase required only for multi WITH premium PDPs (900-credit tier).
                if mode == "multi_product" and premium_product_ids:
                    active_purchases = wallet_service.list_purchases_for_user(
                        user_id, limit=1, status=PURCHASE_STATUS_ACTIVE
                    )
                    if not active_purchases:
                        return (
                            jsonify(
                                {
                                    "success": False,
                                    "error": (
                                        "To generate a multi-product store with premium "
                                        "product pages, please purchase a credit pack first. "
                                        f"This option requires {store_creation_cost} credits "
                                        "after purchase."
                                    ),
                                    "code": "purchase_required",
                                    "required": store_creation_cost,
                                    "feature": "store_creation",
                                }
                            ),
                            402,
                        )

                try:
                    store_creation_cost = wallet_service.resolve_gated_spend_cost(
                        user_id, store_creation_cost
                    )
                    spend_result = wallet_service.spend(
                        user_id=user_id,
                        feature="store_creation",
                        reference_id=page_id,
                        cost=store_creation_cost,
                        metadata={
                            "mode": mode,
                            "store_category": category_key,
                            "product_count": len(product_ids or []),
                            "market_type": market_type,
                            "cost": store_creation_cost,
                        },
                    )
                    spend_ledger_id = spend_result["spend_ledger_id"]
                    logger.info(
                        f"Charged {spend_result['cost']} credits for store_creation "
                        f"(user={user_id}, page_id={page_id}, balance={spend_result['balance']})"
                    )
                except InsufficientCreditsError as e:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": (
                                    f"Insufficient credits. You need {e.required} credits "
                                    f"to generate a store but have {e.balance}. "
                                    f"Please purchase a credit pack to continue."
                                ),
                                "balance": e.balance,
                                "required": e.required,
                                "feature": e.feature,
                            }
                        ),
                        402,
                    )

            metadata = {
                "generation_type": "store",
                "mode": mode,
                "store_category": category_key,
                "language": language,
                "market_type": market_type,
                "country_code": country_code,
                "selectedTemplate": selected_template,
                "storeTemplatePack": store_template_pack,
                "step": 1,
                "product_ids": product_ids,
                "spend_ledger_id": spend_ledger_id,
            }

            try:
                stored_page = document_store.create_generated_page(
                    user_id=user_id,
                    generation_data={
                        "mode": _store_flow_mode_for_api(mode),
                        "style_preferences": style_preferences,
                        "market_type": market_type,
                        "country_code": country_code,
                        "selectedTemplate": selected_template,
                        "storeTemplatePack": store_template_pack,
                    },
                    metadata=metadata,
                    page_id=page_id,
                )
            except Exception as e:
                if spend_ledger_id:
                    try:
                        wallet_service.refund(
                            user_id=user_id,
                            feature="store_creation",
                            reference_id=page_id,
                            spend_ledger_id=spend_ledger_id,
                            reason="page_row_create_failed",
                        )
                    except Exception as refund_err:
                        logger.error(
                            f"Refund after store create_generated_page failure also failed for {page_id}: {refund_err}"
                        )
                logger.error(f"Error storing initial store page: {str(e)}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Error storing initial page: {str(e)}",
                        }
                    ),
                    500,
                )
        else:
            # Regenerate / edit existing store: apply request settings (products,
            # pack, template, mode) instead of freezing the original page snapshot.
            stored_page = document_store.get_generated_page_by_id(page_id)
            if not stored_page:
                return jsonify({"success": False, "error": "Page not found"}), 404
            if stored_page.get("user_id") != user_id:
                return jsonify({"success": False, "error": "Unauthorized"}), 401
            request_product_ids = data.get("productIds") or data.get("product_ids") or []
            if isinstance(request_product_ids, list) and len(request_product_ids) > 0:
                product_ids = [
                    str(x).strip()
                    for x in request_product_ids
                    if x is not None and str(x).strip()
                ]
            else:
                product_ids = stored_page.get("product_ids", []) or []
            try:
                document_store.update_generated_page_metadata(
                    page_id,
                    {
                        "mode": mode,
                        "store_category": category_key,
                        "category": category_key,
                        "language": language,
                        "market_type": market_type,
                        "country_code": country_code,
                        "selectedTemplate": selected_template,
                        "storeTemplatePack": store_template_pack,
                        "store_template_pack": store_template_pack,
                        "product_ids": product_ids,
                        "premiumProductIds": premium_product_ids,
                        "premium_product_ids": premium_product_ids,
                        "step": 1,
                        "generation_status": "in_progress",
                        "generation_percentage": 0,
                    },
                )
            except Exception as meta_err:
                logger.error(
                    "Failed updating store page metadata before regenerate "
                    f"(page_id={page_id}): {meta_err}"
                )
        print("product_ids-print", product_ids)
        if product_ids:
            try:
                _enrich_store_payload_with_shopify_products(
                    data, mode, product_ids, user_id
                )
            except Exception as fetch_err:
                logger.error(
                    "Failed fetching Shopify products for store generation: %s",
                    fetch_err,
                )
                if spend_ledger_id:
                    try:
                        wallet_service.refund(
                            user_id=user_id,
                            feature="store_creation",
                            reference_id=page_id,
                            spend_ledger_id=spend_ledger_id,
                            reason="shopify_enrich_failed",
                        )
                    except Exception as refund_err:
                        logger.error(
                            f"Refund after Shopify-enrich failure also failed for {page_id}: {refund_err}"
                        )
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": (
                                "Failed to load products from Shopify: " f"{fetch_err}"
                            ),
                        }
                    ),
                    502,
                )

        # Start store generation in background
        generation_thread = threading.Thread(
            target=run_store_generation_task,
            args=(
                page_id,
                mode,
                category_key,
                data,
                language,
                user_id,
                style_preferences,
            ),
            kwargs={
                "spend_ledger_id": spend_ledger_id,
            },
            daemon=True,
        )
        generation_thread.start()

        return (
            jsonify(
                {
                    "success": True,
                    "page_id": page_id,
                    "message": "Store generation started in background",
                    "generation_steps": STORE_GENERATION_STEPS,
                    "mode": _store_flow_mode_for_api(mode),
                }
            ),
            202,
        )

    except Exception as e:
        logger.error(f"Error in generate_for_store: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/regenerate-image", methods=["POST"])
@require_shopify_auth
# @require_auth
def regenerate_image():
    """
    Regenerate a single image based on a user prompt and existing image URL.

    Credits: spends image_regenerate (5) up-front; refunds on any backend
    failure after the spend (download, generate, S3 upload).
    """
    temp_dir = None
    user_id = request.user_id  # canonical identity (shopify domain)
    spend_ledger_id = None
    spent = False
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Request data is required"}), 400

        image_url = data.get("image_url")
        prompt = data.get("prompt")
        image_key = data.get(
            "image_key"
        )  # Optional: to identify which image is being regenerated

        print("image_url", image_url)
        print("prompt", prompt)
        print("image_key", image_key)

        if not image_url:
            raise BadRequest("image_url is required")

        if not prompt:
            raise BadRequest("prompt is required")

        # Internal / allow_bypass shops skip credit gating.
        try:
            shop = document_store.get_shop_details(user_id)
            skip_credit_gates = shop_skips_credit_gates(shop)
        except Exception:
            skip_credit_gates = False

        if not skip_credit_gates:
            try:
                spend_result = wallet_service.spend(
                    user_id=user_id,
                    feature="image_regenerate",
                    metadata={"image_key": image_key, "prompt_preview": (prompt or "")[:80]},
                )
                spend_ledger_id = spend_result["spend_ledger_id"]
                spent = True
                logger.info(
                    f"Charged {spend_result['cost']} credits for image_regenerate "
                    f"(user={user_id}, balance={spend_result['balance']})"
                )
            except InsufficientCreditsError as e:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": (
                                f"Insufficient credits. You need {e.required} credits "
                                f"to regenerate an image but have {e.balance}. "
                                f"Please purchase a credit pack to continue."
                            ),
                            "balance": e.balance,
                            "required": e.required,
                            "feature": e.feature,
                        }
                    ),
                    402,
                )

        # Create temporary directory
        temp_dir = tempfile.mkdtemp()

        # Download the existing image
        logger.info(f"Downloading image from {image_url} for regeneration")
        image_paths = convert_urls_to_paths([image_url], temp_dir)

        if not image_paths or not image_paths[0]:
            raise BadRequest("Failed to download image from URL")

        base_image_path = image_paths[0]

        fidelity_prefix = (
            "Instruction: Below is what user requested, do not change and its fidelity is "
            "absolutely crucial.\n"
            "Do changes only what user asks for, and try to keep edits minimal.\n"
            "The product is the unchanged central hero, with perfectly preserved geometry, "
            "materials, proportions, and branding, exactly as shown in the provided "
            "reference image.\n"
            "Do not generate anything on your own beyond what is explicitly requested.\n\n"
            "User request:\n"
        )
        composed_prompt = f"{fidelity_prefix}{prompt}"

        # Generate new image using the strict instruction-prefixed prompt
        logger.info(f"Regenerating image with prompt: {composed_prompt[:50]}...")
        ar_from_body = data.get("aspect_ratio")
        if isinstance(ar_from_body, str) and ar_from_body.strip():
            aspect_ratio = ar_from_body.strip()
        else:
            aspect_ratio = (
                IMAGE_KEY_RATIO_MAP.get(str(image_key).strip()) if image_key else None
            ) or "1:1"
        new_image_url = generate_and_upload_image_with_retry(
            base_image_path,
            composed_prompt,
            temp_dir,
            filename_base=image_key.replace("_", "_") if image_key else None,
            aspect_ratio_override=aspect_ratio,
            slot_label=f"regenerate:{image_key or 'image'}",
        )

        if not new_image_url:
            raise NotFound("Generated image not found")

        logger.info(f"Successfully regenerated image. New URL: {new_image_url}")
        try:
            logger.info(
                f"Cleaning up temp directory after regeneration for user {user_id}: {temp_dir}"
            )
            cleanup_temp_directory(temp_dir)
            logger.info(
                f"Temp directory cleaned up after regeneration for user {user_id}: {temp_dir}"
            )
        except Exception as e:
            logger.error(f"Error cleaning up temp directory: {str(e)}")

        return (
            jsonify(
                {
                    "success": True,
                    "image_url": new_image_url,
                    "image_key": image_key,
                    "aspect_ratio": aspect_ratio,
                }
            ),
            200,
        )

    except HTTPException as e:

        logger.error(f"Error in regenerate_image: {str(e)}")
        # Refund credits if we already spent them and this failure is a server-
        # side issue (5xx) or a 404 (we couldn't produce/upload the image).
        # 4xx client errors (400 BadRequest "image_url required") are raised
        # BEFORE spend so they won't reach here with spent=True.
        if spent and spend_ledger_id and e.code and e.code >= 400:
            try:
                wallet_service.refund(
                    user_id=user_id,
                    feature="image_regenerate",
                    reference_id=spend_ledger_id,
                    spend_ledger_id=spend_ledger_id,
                    reason=f"http_{e.code}",
                )
            except Exception as refund_err:
                logger.error(f"Refund after HTTPException failed: {refund_err}")

        if temp_dir:
            try:
                logger.info(
                    f"Cleaning up temp directory after regeneration for user {user_id}: {temp_dir}"
                )
                cleanup_temp_directory(temp_dir)
                logger.info(
                    f"Temp directory cleaned up after regeneration for user {user_id}: {temp_dir}"
                )
            except Exception as cleanup_err:
                logger.error(f"Error cleaning up temp directory: {str(cleanup_err)}")

        return jsonify(error=e.name, message=e.description, status=e.code), e.code

    except Exception as e:
        logger.error(f"Unexpected error in regenerate_image: {str(e)}")
        if spent and spend_ledger_id:
            try:
                wallet_service.refund(
                    user_id=user_id,
                    feature="image_regenerate",
                    reference_id=spend_ledger_id,
                    spend_ledger_id=spend_ledger_id,
                    reason="unexpected_exception",
                )
            except Exception as refund_err:
                logger.error(f"Refund after unexpected error failed: {refund_err}")
        if temp_dir:
            try:
                cleanup_temp_directory(temp_dir)
            except Exception:
                pass
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/update-generated-content", methods=["POST"])
@require_shopify_auth
def update_generated_content():
    """
    Update the generation_data of a generated page with new content
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Request data is required"}), 400

        page_id = data.get("pageId")
        magic_content = data.get("magicContent")
        shop = data.get("shop")  # Optional shop domain for context

        if not page_id:
            return jsonify({"success": False, "error": "pageId is required"}), 400

        if not magic_content:
            return jsonify({"success": False, "error": "magicContent is required"}), 400

        # Update the page's generation_data
        try:
            update_success = document_store.update_generated_page(
                page_id=page_id, generation_data=magic_content, step=2
            )
            if update_success:
                logger.info(f"Successfully updated generation_data for page {page_id}")
                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Generated content updated successfully",
                            "page_id": page_id,
                        }
                    ),
                    200,
                )
            else:
                logger.warning(f"Failed to update generation_data for page {page_id}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Failed to update generated content",
                        }
                    ),
                    500,
                )
        except Exception as update_error:
            logger.error(
                f"Error updating generation_data for page {page_id}: {str(update_error)}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Error updating generated content: {str(update_error)}",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error in update_generated_content: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@generate_bp.route("/api/generated-pages", methods=["GET"])
@require_shopify_auth
def get_generated_pages():
    """
    Get generated pages for the current user with optional filtering and pagination

    Query Parameters:
        published: Filter by published status (true/false). If not provided, returns both.
        limit: Number of items per page (default: 20, max: 100)
        offset: Number of items to skip (default: 0)
    """
    try:
        user_id = request.user_id

        if not user_id:
            return (
                jsonify({"success": False, "error": "Could not determine user_id"}),
                400,
            )

        # Get query parameters
        published_param = request.args.get("published", None)
        limit_param = request.args.get("limit", "20")
        offset_param = request.args.get("offset", "0")

        # Parse published filter
        published = None
        if published_param is not None:
            if published_param.lower() == "true":
                published = True
            elif published_param.lower() == "false":
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

        # Parse pagination parameters
        try:
            limit = int(limit_param)
            if limit < 1:
                limit = 20
            elif limit > 100:
                limit = 100  # Cap at 100 for performance
        except ValueError:
            limit = 20

        try:
            offset = int(offset_param)
            if offset < 0:
                offset = 0
        except ValueError:
            offset = 0

        cache_key = (user_id, published, limit, offset)
        now = time.time()
        cached = _PAGES_LIST_CACHE.get(cache_key)
        if cached and (now - cached[0]) < _PAGES_LIST_CACHE_TTL_SEC:
            return jsonify(cached[1]), 200

        # Get generated pages with filters and pagination
        result = document_store.get_user_generated_pages(
            user_id=user_id, published=published, limit=limit, offset=offset
        )

        payload = {
            "success": True,
            "data": result["items"],
            "pagination": {
                "total": result["total"],
                "limit": result["limit"],
                "offset": result["offset"],
                "has_more": result["has_more"],
            },
        }
        _PAGES_LIST_CACHE[cache_key] = (now, payload)

        return jsonify(payload), 200

    except Exception as e:
        logger.error(f"Error getting generated pages: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
