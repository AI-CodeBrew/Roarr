"""
Shopify Core Routes: API endpoints for Shopify store, product, and theme operations
"""

from app.clients.posthog_client import posthog_client
from app.modules.generate.generate_images import cleanup_temp_directory
from app.clients.crisp_client import crisp_client
from flask import Blueprint, request, jsonify
from pathlib import Path
import time
import tempfile
import os
import shutil
import json
import copy
import base64
import mimetypes
import hashlib
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from datetime import datetime, timezone
from urllib.parse import urlencode, quote, urlparse
from .utils import process_images
from ...shopify.shopify_auth.webhook_utils import webhook_manager
from ...auth.utils import require_auth, extract_user_attributes, require_shopify_auth
from ....constants.credits import PURCHASE_STATUS_ACTIVE, shop_skips_credit_gates
from ...credits import wallet_service
from ...database import document_store
from ...generate.generate_images import upload_images_to_cdn
from ..shopify_utils import shopify_utils
from ..font_mapping import SHOPIFY_FONTS
from ..collections_agent_service import run_collections_agent
from .image_upload_handler import ImageUploadHandler

logger = logging.getLogger(__name__)

# Create Blueprint for shopify core routes
shopify_core_bp = Blueprint("shopify_core", __name__)


def extract_shop_name(shop_url: str) -> str:
    """
    Extract shop name from various Shopify URL formats.

    Handles:
    - https://admin.shopify.com/store/{shop-name}/...
    - https://{shop-name}.myshopify.com
    - {shop-name}.myshopify.com
    - {shop-name}

    Args:
        shop_url: The shop URL in any format

    Returns:
        The shop name (e.g., "burhan-dev")
    """
    if not shop_url:
        return ""

    # Handle: https://admin.shopify.com/store/{shop-name}/...
    if "/store/" in shop_url:
        parts = shop_url.split("/store/")
        if len(parts) > 1:
            shop_name = parts[1].split("/")[0].split("?")[0]
            return shop_name

    # Handle: https://{shop-name}.myshopify.com or just {shop-name}
    shop_name = (
        shop_url.replace("https://", "")
        .replace("http://", "")
        .replace(".myshopify.com", "")
        .strip("/")
    )

    # Clean up any remaining path components
    if "/" in shop_name:
        shop_name = shop_name.split("/")[0]

    return shop_name


def _normalize_publish_category(detected_category: str) -> str:
    """Map request category to backend category key (e.g. health_beauty, general)."""
    if not detected_category:
        return "general"
    c = (detected_category or "").strip().lower()
    if "health" in c or "beauty" in c:
        return "health_beauty"
    if "home" in c or "kitchen" in c:
        return "home_kitchen"
    if "kids" in c or "toys" in c:
        return "kids_toys"
    if "car" in c or "accessor" in c:
        return "car_accessories"
    if "fashion" in c or "apparel" in c:
        return "fashion"
    return "general"


# Actual filenames on disk use hyphen in the suffix, e.g. product.kluck-health-beauty-1.json
# (not health_beauty). Folder names: health-beauty, home-kitchen, kids-toys, car_accessories, fashion, general.
# Category -> templates_files subfolder name (as on disk)
_TEMPLATE_FOLDER_MAP = {
    "health_beauty": "health-beauty",
    "home_kitchen": "home-kitchen",
    "kids_toys": "kids-toys",
    "car_accessories": "car-accessories",
    "fashion": "fashion",
    "general": "general",
}

# Sections re-uploaded on every publish even when the theme already has them.
# The per-file "skip if present" rule leaves stale copies in themes published
# before a fix shipped: kluck-ai-product-hero-section rendered its blocks with a
# `case block.type` that had no `@app` branch, so the bundle app block was
# silently dropped on Kluck's simple product page.
_FORCE_UPDATE_SECTIONS = {
    "kluck-ai-product-hero-section.liquid",
    # Play keeps per-section colors. Older copies paint every band from color_schema.
    "kluck-ai-hero-section-1.liquid",
    "kluck-ai-marquee-section-1.liquid",
    "kluck-ai-empty-section.liquid",
    "kluck-ai-faq-section.liquid",
    "kluck-ai-trust-badge-section.liquid",
}


# Classic homepage sections. Cinematic and Amour stores do not use them.
_CLASSIC_HOME_ONLY_SECTIONS = {
    "kluck-ai-home-hero-section.liquid",
    "kluck-ai-feature-product-section.liquid",
    "kluck-ai-features-center-section.liquid",
    "kluck-ai-headline-section.liquid",
    "kluck-ai-faq-section-home-1.liquid",
    "kluck-ai-promotion-banner-section.liquid",
    "kluck-ai-shopable-bundle-section.liquid",
    "kluck-ai-tabbed-grid-section.liquid",
    "kluck-ai-testimonials-section.liquid",
    "kluck-ai-product-column-section.liquid",
    "kluck-ai-image-with-text-1-section.liquid",
    "kluck-ai-image-with-text-2-section.liquid",
    "kluck-ai-image-with-text-3-section.liquid",
    "kluck-ai-marquee-section-2.liquid",
}


def _should_force_update_section(liquid_file: str) -> bool:
    """Always re-upload cinematic (and other force-listed) sections so schema fixes ship."""
    name = str(liquid_file or "")
    return (
        name in _FORCE_UPDATE_SECTIONS
        or name.startswith("kluck-ai-cinematic-")
        or name.startswith("kluck-ai-play-")
        or name.startswith("kluck-ai-glow-")
        or name.startswith("kluck-ai-amour-")
    )


def _force_reupload_cinematic_section_liquids(user_id, theme_id):
    """Push fixed cinematic section liquids (dynamic color_scheme class) to a live theme."""
    try:
        shopify_files_dir = (
            Path(__file__).resolve().parents[4]
            / "data"
            / "assets"
            / "shopify_files"
        )
        # routes.py is at app/modules/shopify/shopify_core/routes.py → parents[4] = backend/
        liquid_files_dir = shopify_files_dir / "liquid_files"
        if not liquid_files_dir.exists():
            # Fallback relative to backend package root used elsewhere in this file
            return {"success": False, "error": f"missing {liquid_files_dir}"}

        uploaded = []
        failed = []
        for liquid_path in sorted(liquid_files_dir.glob("kluck-ai-cinematic-*.liquid")):
            asset_key = f"sections/{liquid_path.name}"
            upload_result = shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(liquid_path),
                asset_key=asset_key,
                user_id=user_id,
            )
            if upload_result.get("success"):
                uploaded.append(liquid_path.name)
            else:
                failed.append(
                    {
                        "file": liquid_path.name,
                        "error": upload_result.get("error"),
                    }
                )
        logger.info(
            "force-reupload cinematic liquids: "
            f"uploaded={len(uploaded)} failed={len(failed)} theme_id={theme_id}"
        )
        return {
            "success": len(failed) == 0,
            "uploaded": uploaded,
            "failed": failed,
        }
    except Exception as err:
        logger.warning(f"force-reupload cinematic liquids failed: {err}")
        return {"success": False, "error": str(err)}


def _force_reupload_kluck_color_snippet(user_id, theme_id):
    """Push Kluck snippets (color CSS vars + UI i18n) to the live theme."""
    try:
        snippet_dir = (
            Path(__file__).resolve().parents[4]
            / "data"
            / "assets"
            / "shopify_files"
            / "snippet_files"
        )
        for snippet_name in (
            "kluck-ai-font-and-color.liquid",
            "kluck-ui-string.liquid",
        ):
            snippet_path = snippet_dir / snippet_name
            if not snippet_path.exists():
                if snippet_name == "kluck-ai-font-and-color.liquid":
                    return {"success": False, "error": f"missing {snippet_path}"}
                continue
            upload_result = shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(snippet_path),
                asset_key=f"snippets/{snippet_name}",
                user_id=user_id,
            )
            if upload_result.get("success"):
                logger.info(
                    "force-reupload snippet ok %s theme_id=%s",
                    snippet_name,
                    theme_id,
                )
            else:
                logger.warning(
                    "force-reupload snippet %s failed: %s",
                    snippet_name,
                    upload_result.get("error"),
                )
                return {"success": False, "error": upload_result.get("error")}

        hero_path = snippet_dir.parents[0] / "liquid_files" / "kluck-ai-product-hero-section.liquid"
        if hero_path.exists():
            hero_upload = shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(hero_path),
                asset_key="sections/kluck-ai-product-hero-section.liquid",
                user_id=user_id,
            )
            if not hero_upload.get("success"):
                logger.warning(
                    "force-reupload product hero failed: %s",
                    hero_upload.get("error"),
                )
                return {"success": False, "error": hero_upload.get("error")}
            logger.info("force-reupload product hero ok theme_id=%s", theme_id)
        return {"success": True}
    except Exception as err:
        logger.warning(f"force-reupload color snippet failed: {err}")
        return {"success": False, "error": str(err)}


def _get_template_paths(category: str, selected_template: int | None):
    """Return (template_category, templates_folder, json_filename). Filename suffix always uses hyphen (e.g. health-beauty)."""
    template_category = _normalize_publish_category(category)
    folder = _TEMPLATE_FOLDER_MAP.get(
        template_category, _TEMPLATE_FOLDER_MAP["general"]
    )
    # Filename on disk always has hyphen in suffix, e.g. product.kluck-health-beauty-1.json
    filename_suffix = folder.replace("_", "-")
    if selected_template:
        json_filename = f"product.kluck-{filename_suffix}-{selected_template}.json"
    else:
        json_filename = f"product.kluck-{filename_suffix}.json"
    return template_category, folder, json_filename


def _get_product_template_suffix_for_view(
    category: str, selected_template: int | None
) -> str:
    """Legacy shared suffix (kluck-health-beauty-1). Kept for pages published before per-product templates."""
    _, _, json_filename = _get_template_paths(category, selected_template)
    return json_filename.replace("product.", "").replace(".json", "")


def _parse_template_number(selected_template):
    """Return 1, 2, or 3. Accepts ints and strings like '3' or 'template_3'."""
    raw = selected_template
    if isinstance(raw, str):
        raw = raw.strip().lower()
        if raw.startswith("template_"):
            raw = raw.split("_", 1)[-1]
    try:
        number = int(raw)
    except (TypeError, ValueError):
        return None
    return number if number in (1, 2, 3) else None


def _layout_template_number(selected_template) -> int:
    """Which on-disk layout to copy. Never used as the Shopify suffix."""
    return _parse_template_number(selected_template) or 1


def _numeric_product_id(product_id) -> str:
    raw = str(product_id or "").strip()
    if "/" in raw:
        raw = raw.rsplit("/", 1)[-1]
    digits = "".join(ch for ch in raw if ch.isdigit())
    return digits or "product"


def _unique_product_template_names(category: str, product_id, selected_template):
    """
    One Shopify template per product.

    The layout comes from template 1, 2, or 3. The uploaded file is
    product.kluck-{category}-{productId}.json so two products never share a suffix.
    """
    layout = _layout_template_number(selected_template)
    _, folder, source_filename = _get_template_paths(category, layout)
    source_path = (
        Path(__file__).resolve().parents[4]
        / "data"
        / "assets"
        / "shopify_files"
        / "templates_files"
        / folder
        / source_filename
    )
    if layout == 3 and not source_path.is_file():
        layout = 2
        _, folder, source_filename = _get_template_paths(category, layout)
    suffix = f"kluck-{folder}-{_numeric_product_id(product_id)}"
    json_filename = f"product.{suffix}.json"
    source_path = (
        Path(__file__).resolve().parents[4]
        / "data"
        / "assets"
        / "shopify_files"
        / "templates_files"
        / folder
        / source_filename
    )
    return suffix, json_filename, source_path


def _strip_template_comment(text: str) -> str:
    """Shopify prepends a /* auto-generated */ comment to template JSON it writes."""
    stripped = (text or "").lstrip()
    if stripped.startswith("/*"):
        end = stripped.find("*/")
        if end != -1:
            stripped = stripped[end + 2 :]
    return stripped


def _sync_missing_template_sections(*, generated_page, product_id, user_id) -> dict:
    """
    Add layout sections the product's live template is missing.

    A product published before a section was added to its layout (e.g. Aura FAQ)
    keeps the old template, and update-publish-page only writes metafields, so the
    new section never appears. Existing sections and their order are kept as-is so
    merchant edits in the theme editor survive.
    """
    if not isinstance(generated_page, dict):
        return {"success": True, "skipped": True, "reason": "page not found"}
    category = generated_page.get("category")
    selected_template = _parse_template_number(generated_page.get("selectedTemplate"))
    _, _, source_path = _unique_product_template_names(
        category, product_id, selected_template
    )
    if not source_path.is_file():
        return {"success": True, "skipped": True, "reason": "no layout file"}

    live_theme_result = shopify_utils.get_live_theme(user_id)
    theme = live_theme_result.get("theme") if live_theme_result.get("success") else None
    if not theme:
        return {"success": False, "error": "live theme not found"}
    theme_id = shopify_utils._from_gid(theme.get("id"))

    suffix = _stored_or_legacy_template_suffix(
        generated_page, category, selected_template
    )
    asset_key = f"templates/product.{suffix}.json"
    current = shopify_utils.get_theme_asset(
        theme_id=theme_id, asset_key=asset_key, user_id=user_id
    )
    if not current.get("exists"):
        return {"success": True, "skipped": True, "reason": f"{asset_key} not in theme"}

    live_template = json.loads(
        _strip_template_comment((current.get("asset") or {}).get("value") or "")
    )
    layout = json.loads(source_path.read_text(encoding="utf-8"))
    live_sections = live_template.setdefault("sections", {})
    live_order = live_template.setdefault("order", [])

    added = []
    for key in layout.get("order", []):
        if key in live_sections or key not in layout.get("sections", {}):
            continue
        live_sections[key] = layout["sections"][key]
        live_order.append(key)
        added.append(key)
    if not added:
        return {"success": True, "added": []}

    # The section file must exist before a template can reference it.
    liquid_files_dir = Path(__file__).resolve().parents[4] / "data" / "assets" / "shopify_files" / "liquid_files"
    for key in added:
        liquid_path = liquid_files_dir / f"{layout['sections'][key].get('type')}.liquid"
        if liquid_path.is_file():
            shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(liquid_path),
                asset_key=f"sections/{liquid_path.name}",
                user_id=user_id,
            )

    upload_result = shopify_utils.update_theme_asset_content(
        theme_id=str(theme_id),
        asset_key=asset_key,
        user_id=user_id,
        text_value=json.dumps(live_template, indent=2),
    )
    logger.info(
        "update-publish-page: added sections %s to %s (success=%s)",
        added,
        asset_key,
        upload_result.get("success"),
    )
    return {
        "success": bool(upload_result.get("success")),
        "added": added,
        "error": upload_result.get("error"),
    }


def _stored_or_legacy_template_suffix(generated_page, category, selected_template) -> str:
    """Preview uses the suffix saved at publish. Older pages keep the shared slot they already have."""
    if isinstance(generated_page, dict):
        stored = generated_page.get("kluck_template_suffix")
        if isinstance(stored, str) and stored.strip():
            return stored.strip()
    return _get_product_template_suffix_for_view(category, selected_template)


def _publish_unique_product_template(
    *,
    category: str,
    product_id,
    selected_template,
    theme_id,
    user_id: str,
) -> dict:
    """Copy this product's layout onto its own theme template and assign that suffix."""
    suffix, json_filename, source_path = _unique_product_template_names(
        category, product_id, selected_template
    )
    if not source_path.exists():
        return {
            "success": False,
            "error": f"Layout template not found: {source_path.name}",
            "template_suffix": suffix,
            "template_file": json_filename,
        }
    if not theme_id:
        return {
            "success": False,
            "error": "Theme id is required to upload a product template",
            "template_suffix": suffix,
            "template_file": json_filename,
        }

    upload_result = shopify_utils.update_theme_asset_content(
        theme_id=str(theme_id),
        asset_key=f"templates/{json_filename}",
        user_id=user_id,
        text_value=source_path.read_text(encoding="utf-8"),
    )
    if not upload_result.get("success"):
        return {
            "success": False,
            "error": upload_result.get("error") or "Template upload failed",
            "template_suffix": suffix,
            "template_file": json_filename,
        }

    bind_result = shopify_utils.update_product_template(
        product_id=str(product_id),
        template_file=json_filename,
        user_id=user_id,
    )
    return {
        "success": bool(bind_result.get("success")),
        "error": bind_result.get("error"),
        "template_suffix": suffix,
        "template_file": json_filename,
        "result": bind_result,
    }


# =============================================================================
# Store Management Routes
# =============================================================================


@shopify_core_bp.route("/api/connect-shopify-store", methods=["POST"])
@require_auth
def connect_shopify_store():
    """Store Shopify store connection in database and return success."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Request data is required"}), 400

        shop_domain = data.get("shop_domain")
        access_token = data.get("access_token")

        if not shop_domain or not access_token:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Both shop_domain and access_token are required",
                    }
                ),
                400,
            )

        user_id = request.user_id

        shop_url = f"{shop_domain}.myshopify.com"
        # Validate Shopify credentials before proceeding
        is_valid = shopify_utils.validate_shopify_connection(shop_url, access_token)

        if not is_valid:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid Shopify credentials. Please check your domain and access token.",
                    }
                ),
                400,
            )

        # Get shop information including shop_id
        shop_info = shopify_utils.get_shop_info(shop_url, access_token)
        shop_id = None

        if shop_info.get("success"):
            shop_id = shop_info.get("shop_id")
            logger.info(f"Retrieved shop_id: {shop_id} for store: {shop_url}")
        else:
            logger.warning(f"Failed to get shop info: {shop_info.get('error')}")

        # store_shopify_credentials now handles store creation internally
        result = document_store.store_shopify_credentials(
            user_id, shop_url, access_token, shop_id
        )

        # Fetch and store live theme ID immediately after store connection
        try:
            logger.info("Fetching live theme ID for newly connected store")
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
                f"Error fetching live theme ID during store connection: {str(theme_error)}"
            )
            # Continue even if theme fetch fails - it can be fetched later

        # Register webhooks for subscription updates and add-on purchases
        try:
            # Register subscription webhook
            webhook_result = webhook_manager.ensure_subscription_webhook_registered(
                shop_url, access_token
            )

            if webhook_result["success"]:
                logger.info(
                    f"Subscription webhook registered successfully for user {user_id}"
                )
            else:
                logger.warning(
                    f"Failed to register subscription webhook for user {user_id}: {webhook_result.get('error')}"
                )

            # Register add-on webhook
            addon_webhook_result = webhook_manager.ensure_addon_webhook_registered(
                shop_url, access_token
            )

            if addon_webhook_result["success"]:
                logger.info(
                    f"Add-on webhook registered successfully for user {user_id}"
                )
            else:
                logger.warning(
                    f"Failed to register add-on webhook for user {user_id}: {addon_webhook_result.get('error')}"
                )

        except Exception as webhook_error:
            logger.error(
                f"Error registering webhooks for user {user_id}: {webhook_error}"
            )

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

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Shopify store connected successfully",
                    "store_id": result.get("store_id"),
                    "store_url": shop_url,
                }
            ),
            200,
        )

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in connect_shopify_store: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/user-stores", methods=["GET"])
@require_auth
def get_user_stores():
    """Get user's connected stores"""
    try:
        user_id = request.user_id

        # Get user stores from DynamoDB
        stores = document_store.get_user_stores(user_id)

        # Format the response
        formatted_stores = []
        for store in stores:
            formatted_stores.append(
                {
                    "store_url": store.get("store_url"),
                }
            )

        return jsonify({"success": True, "stores": formatted_stores})

    except Exception as e:
        logger.error(f"Error getting user stores: {str(e)}")
        return (
            jsonify({"success": False, "error": "Failed to retrieve user stores"}),
            500,
        )


@shopify_core_bp.route("/api/shopify/connection-status", methods=["GET"])
@require_auth
def get_shopify_connection_status():
    """Get Shopify connection status for the authenticated user"""
    try:
        user_id = request.user_id
        stores = document_store.get_user_stores(user_id) or []
        status = document_store.get_user_shopify_app_status(user_id) or {}

        uninstalled_at = status.get("shopify_app_uninstall_dt")
        recently_uninstalled = False
        if uninstalled_at:
            try:
                from datetime import datetime, timezone

                ts = (
                    uninstalled_at.replace("Z", "+00:00")
                    if isinstance(uninstalled_at, str)
                    else None
                )
                if ts:
                    t = datetime.fromisoformat(ts)
                    now = datetime.now(timezone.utc)
                    recently_uninstalled = (now - t).total_seconds() <= 600
            except Exception:
                recently_uninstalled = False

        return (
            jsonify(
                {
                    "success": True,
                    "connected": len(stores) > 0,
                    "storeCount": len(stores),
                    "storeUrls": [s.get("store_url") for s in stores],
                    "recentlyUninstalled": recently_uninstalled,
                    "uninstalledAt": uninstalled_at,
                    "shopify_app_installed": status.get("shopify_app_installed", False),
                    "shopify_app_install_dt": status.get("shopify_app_install_dt"),
                    "shopify_app_uninstall_dt": status.get("shopify_app_uninstall_dt"),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting Shopify connection status: {str(e)}")
        return (
            jsonify({"success": False, "error": "Failed to get connection status"}),
            500,
        )


@shopify_core_bp.route("/api/shopify/check-app-status", methods=["POST"])
def check_app_status():
    """Check if the app is installed for a given store"""
    try:
        data = request.get_json()
        if not data or not data.get("store_url"):
            return (
                jsonify(
                    {"success": False, "error": "store_url is required in request body"}
                ),
                400,
            )

        store_url = data.get("store_url")
        store = document_store.get_store_by_shop_url(store_url)
        print(store)

        if not store or store.get("archived", False):
            # Only report not installed; no user-based logic here
            return (
                jsonify({"status": True, "appInstalled": False, "redirectUrl": None}),
                200,
            )

        # Store is installed (not archived) - include masked owner email
        # Email is stored on the store item metadata
        owner_email = store.get("email", "Unknown")
        if isinstance(owner_email, str) and "@" in owner_email:
            name, domain = owner_email.split("@", 1)
            masked_email = f"{name[:3]}***@{domain}"
        else:
            masked_email = owner_email

        # Scenario B: Store is already installed elsewhere (attachedWith)
        status_ok = False
        redirect_url = None
        try:
            params = urlencode(
                {"guard": "STORE_CONNECTED_ELSEWHERE", "who": masked_email}
            )
            redirect_url = f"{os.getenv('FRONTEND_URL')}/connected-accounts?{params}"
        except Exception:
            redirect_url = None

        return (
            jsonify(
                {
                    "status": False,
                    "appInstalled": True,
                    "attachedWith": masked_email,
                    "redirectUrl": redirect_url,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/shopify/store-insights", methods=["GET"])
@require_auth
def get_store_insights():
    """Get comprehensive store insights including products, orders, and sales"""
    try:
        # Get user ID from authenticated token
        user_id = request.user_id

        # Check if user has Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No Shopify store connected. Please connect your store first.",
                    }
                ),
                400,
            )

        # Get store insights
        insights = shopify_utils.get_store_insights(user_id)

        return jsonify({"success": True, "insights": insights})

    except Exception as e:
        logger.error(f"Error in get_store_insights: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# =============================================================================
# Product Routes
# =============================================================================


@shopify_core_bp.route("/api/shopify-products", methods=["GET"])
@require_auth
def get_shopify_products():
    """Get products from the user's Shopify store"""
    try:
        # Get user ID from authenticated token
        user_id = request.user_id

        # Check if user has Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No Shopify store configured. Please connect your store first.",
                    }
                ),
                400,
            )

        # Use the actual Shopify utils to get products from the store
        try:
            products = shopify_utils.get_products(user_id, limit=50)
            logger.info(
                f"Retrieved {len(products)} products from Shopify store for user {user_id}"
            )

            return jsonify({"success": True, "products": products}), 200

        except Exception as shopify_error:
            logger.error(
                f"Error fetching products from Shopify for user {user_id}: {str(shopify_error)}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Failed to fetch products from Shopify: {str(shopify_error)}",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error getting Shopify products: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/shopify/collections-agent", methods=["POST"])
@require_shopify_auth
def run_shopify_collections_agent():
    """
    Build quality-first collection recommendations for multi-product stores.

    Request body (optional):
    - products: explicit catalog override for testing
    - collections: explicit collections override for testing
    """
    user_id = None
    try:
        user_id = request.user_id
        payload = request.get_json(silent=True) or {}

        # Allow payload overrides for deterministic testing.
        input_products = payload.get("products")
        input_collections = payload.get("collections")

        if isinstance(input_products, list):
            products = input_products
        else:
            # Fetch a larger page-size so we can properly create collections.
            products = shopify_utils.get_products(user_id, limit=250)

        if isinstance(input_collections, list):
            collections = input_collections
        else:
            collections = shopify_utils.get_collections_with_products(
                user_id=user_id,
                per_collection_product_limit=250,
            )

        if not products:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No products found. Add products before running Collections Agent.",
                    }
                ),
                400,
            )

        result = run_collections_agent(
            products_raw=products,
            collections_raw=collections or [],
            user_id=user_id,
            target_cards=3,
        )
        return jsonify({"success": True, "collections_agent": result}), 200
    except Exception as e:
        logger.error(f"Error running collections agent for user {user_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/get-shopify-product", methods=["GET"])
@require_auth
def get_shopify_product():
    """Get detailed information for a specific Shopify product"""
    try:
        # Get user ID from authenticated token
        user_id = request.user_id
        logger.info(f"User ID: {user_id}")

        # Get product ID from query parameters
        product_id = request.args.get("product_id")

        if not product_id:
            return jsonify({"success": False, "error": "Product ID is required"}), 400

        # Get product details using shopify_utils
        product_details = shopify_utils.get_product(product_id, user_id)

        return jsonify({"success": True, "product": product_details}), 200

    except Exception as e:
        logger.error(
            f"Error getting Shopify product {product_id} for user {user_id}: {str(e)}"
        )
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/add-shopify-product", methods=["POST"])
@require_auth
def add_shopify_product():
    """Add a new product to Shopify store"""
    try:
        data = request.get_json()
        title = data.get("title", "")
        description = data.get("description", "")
        price = data.get("price", "")
        category = data.get("category", "")
        tags = data.get("tags", "")
        status = data.get("status", "draft")
        inventory_quantity = data.get("inventory_quantity", 0)
        images = data.get("images", [])

        if isinstance(description, list):
            description = "\n".join(description)

        if not title:
            return jsonify({"success": False, "error": "Title is required"}), 400

        # Get user ID from authenticated token
        user_id = request.user_id

        # Check if user has Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No Shopify store configured. Please connect your store first.",
                    }
                ),
                400,
            )

        # Validate and format price
        try:
            # Convert price to float and back to string to ensure proper format
            price_float = float(price) if price else 0.0
            formatted_price = f"{price_float:.2f}"
        except (ValueError, TypeError):
            formatted_price = "0.00"
            logger.warning(f"Invalid price format '{price}', using default '0.00'")

        # Prepare product data for Shopify
        product_data = {
            "title": title,
            "body_html": description,
            "product_type": category if category else "General",
            "tags": tags if isinstance(tags, str) else ",".join(tags) if tags else "",
            "status": status,
            "price": formatted_price,
            "inventory_quantity": int(inventory_quantity) if inventory_quantity else 0,
            "inventory_management": "shopify",
        }

        # Log the product data for debugging
        logger.info(f"Prepared product data for Shopify: {product_data}")
        logger.info(f"Images received: {len(images) if images else 0}")

        # Process images (convert base64 to temp files)
        temp_files_to_cleanup = []
        if images and len(images) > 0:
            try:
                logger.info(f"Starting to process {len(images)} images")
                processed_images, temp_files = process_images(images)
                temp_files_to_cleanup = temp_files

                logger.info(f"Processed {len(processed_images)} images")
                logger.info(f"Temp files created: {temp_files}")

                product_data["images"] = processed_images  # Pass base64 images directly

                logger.info(f"Total images prepared: {len(product_data['images'])}")
            except Exception as e:
                logger.error(f"Error processing images: {str(e)}")
                logger.error(f"Exception type: {type(e)}")
                import traceback

                logger.error(f"Traceback: {traceback.format_exc()}")
                product_data["images"] = []
        else:
            logger.info("No images provided")

        # Create the product in Shopify
        try:
            logger.info(f"Creating product with data: {product_data}")
            logger.info(f"Product title: {product_data.get('title')}")
            logger.info(f"Product description: {product_data.get('body_html')}")
            logger.info(f"Product price: {product_data.get('price')}")
            logger.info(
                f"Product tags: {product_data.get('tags')} (type: {type(product_data.get('tags'))})"
            )

            new_product = shopify_utils.create_product(product_data, user_id)

            logger.info(
                f"Successfully created product {new_product.get('id')} in Shopify store for user {user_id}"
            )

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Product created successfully",
                        "product": new_product,
                    }
                ),
                200,
            )

        except Exception as shopify_error:
            logger.error(f"Error creating product in Shopify: {str(shopify_error)}")
            logger.error(f"Product data that caused error: {product_data}")
            logger.error(f"Error type: {type(shopify_error)}")
            logger.error(f"Error details: {shopify_error}")
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Failed to create product in Shopify: {str(shopify_error)}",
                    }
                ),
                500,
            )
        finally:
            # Clean up temporary files
            for temp_file in temp_files_to_cleanup:
                try:
                    os.unlink(temp_file)
                    logger.info(f"Cleaned up temp file: {temp_file}")
                except Exception as e:
                    logger.error(f"Error cleaning up temp file {temp_file}: {str(e)}")

    except Exception as e:
        logger.error(f"Error creating Shopify product: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/update-shopify-product", methods=["PUT"])
@require_auth
def update_shopify_product():
    """Update a product in Shopify store"""
    try:
        data = request.get_json()
        product_id = data.get("product_id")
        title = data.get("title")
        description = data.get("description")
        price = data.get("price")
        inventory_quantity = data.get("inventory_quantity")
        status = data.get("status")
        category = data.get("category")
        tags = data.get("tags")
        images = data.get("images")

        if not product_id:
            return jsonify({"success": False, "error": "Product ID is required"}), 400

        # Get user ID from authenticated token
        user_id = request.user_id

        # Check if user has Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No Shopify store configured. Please connect your store first.",
                    }
                ),
                400,
            )

        # Update product using Shopify utils
        try:
            # Prepare product data for update
            product_data = {
                "id": product_id,
                "title": title,
                "body_html": description,
                "status": status,
                "product_type": category,
                "tags": (
                    tags if isinstance(tags, str) else ",".join(tags) if tags else ""
                ),
                "variants": [
                    {
                        "price": price,
                        "inventory_quantity": (
                            int(inventory_quantity) if inventory_quantity else 0
                        ),
                    }
                ],
            }

            # Process images if provided
            temp_files_to_cleanup = []
            logger.info(f"Images received for update: {len(images) if images else 0}")
            if images and len(images) > 0:
                try:
                    logger.info(f"Starting to process {len(images)} images for update")
                    logger.info(f"First image type: {type(images[0])}")
                    logger.info(
                        f"First image preview: {str(images[0])[:100] if isinstance(images[0], str) else 'Not a string'}"
                    )

                    processed_images, temp_files = process_images(images)
                    temp_files_to_cleanup = temp_files

                    logger.info(f"Processed {len(processed_images)} images for update")
                    product_data["images"] = processed_images

                except Exception as image_error:
                    logger.error(
                        f"Error processing images for update: {str(image_error)}"
                    )
                    # Continue without images if processing fails
                    product_data["images"] = []
            else:
                logger.info("No images provided for update")

            # Update the product in Shopify
            updated_product = shopify_utils.update_product(product_data, user_id)

            # Clean up temporary files
            for temp_file in temp_files_to_cleanup:
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                        logger.info(f"Cleaned up temp file: {temp_file}")
                except Exception as cleanup_error:
                    logger.warning(
                        f"Failed to cleanup temp file {temp_file}: {str(cleanup_error)}"
                    )

            logger.info(f"Successfully updated product {product_id} in Shopify store")

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Product updated successfully",
                        "product": updated_product,
                    }
                ),
                200,
            )

        except Exception as shopify_error:
            logger.error(f"Error updating product in Shopify: {str(shopify_error)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Failed to update product in Shopify: {str(shopify_error)}",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error updating Shopify product: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/delete-shopify-product", methods=["DELETE"])
@require_auth
def delete_shopify_product():
    """Delete a product from Shopify store"""
    try:
        data = request.get_json()
        product_id = data.get("product_id")

        if not product_id:
            return jsonify({"success": False, "error": "Product ID is required"}), 400

        # Get user ID from authenticated token
        user_id = request.user_id

        # Check if user has Shopify credentials
        shopify_credentials = document_store.get_shopify_credentials(user_id)
        if not shopify_credentials:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No Shopify store configured. Please connect your store first.",
                    }
                ),
                400,
            )

        # Delete product using Shopify utils
        try:
            # Delete the product in Shopify
            shopify_utils.delete_product(product_id, user_id)

            logger.info(
                f"Successfully deleted product {product_id} from Shopify store for user {user_id}"
            )

            return (
                jsonify({"success": True, "message": "Product deleted successfully"}),
                200,
            )

        except Exception as shopify_error:
            logger.error(f"Error deleting product from Shopify: {str(shopify_error)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Failed to delete product from Shopify: {str(shopify_error)}",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error deleting Shopify product: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# =============================================================================
# Theme Routes
# =============================================================================


def _normalize_theme_id_for_compare(theme_id):
    """Compare theme ids whether stored as numeric string or Shopify GID."""
    if theme_id is None:
        return None
    s = str(theme_id).strip()
    if not s:
        return None
    if s.startswith("gid://"):
        return shopify_utils._from_gid(s) or s
    return s


def _shopify_theme_id_exists(user_id: str, theme_id) -> bool:
    """Return True if the theme still exists on the shop (Admin REST GET themes/{id})."""
    tid = _normalize_theme_id_for_compare(theme_id)
    if not tid:
        return False
    result = shopify_utils.check_if_preview_ready(theme_id=tid, user_id=user_id)
    return bool(result.get("success") and result.get("theme"))


def _theme_asset_string_value(asset_result):
    """Extract text body from get_theme_asset response (value or base64 attachment)."""
    if not asset_result or not asset_result.get("success") or not asset_result.get(
        "exists"
    ):
        return None
    obj = asset_result.get("asset") or {}
    val = obj.get("value")
    if val and isinstance(val, str):
        return val
    attachment = obj.get("attachment")
    if isinstance(attachment, str) and attachment.strip():
        try:
            return base64.b64decode(attachment).decode("utf-8")
        except Exception:
            return None
    return None


def _index_json_readable_on_theme(shopify_utils, theme_id, user_id):
    """
    Check that templates/index.json exists on the theme and is non-empty valid JSON.
    Does not compare to local file (Shopify may normalize JSON). Returns (ok, error_message).
    """
    res = shopify_utils.get_theme_asset(
        theme_id=str(theme_id),
        asset_key="templates/index.json",
        user_id=user_id,
    )
    remote_text = _theme_asset_string_value(res)
    if not remote_text or not str(remote_text).strip():
        return False, "templates/index.json missing on theme or empty"

    try:
        json.loads(remote_text)
    except json.JSONDecodeError as e:
        return False, f"remote index.json is not valid JSON: {e}"

    return True, None


def _upload_templates_index_json(shopify_utils, theme_id, user_id, local_index_path):
    """Push store index.json to the theme as templates/index.json. Returns (ok, error_message)."""
    upload_result = shopify_utils.update_theme_asset(
        theme_id=str(theme_id),
        file_path=str(local_index_path),
        asset_key="templates/index.json",
        user_id=user_id,
    )
    if upload_result.get("success"):
        return True, None
    return False, upload_result.get("error") or "unknown error"


_COD_HOME_PRODUCT_HERO_SECTION_TYPES = {
    "kluck-ai-product-hero-section",
    "pf-new-default-product-hero",
}


def _strip_product_hero_from_index_json(index_data: dict) -> dict:
    """
    COD single-product homes must not include the Product Hero / checkout section;
    checkout lives on the separate premium product page.
    """
    if not isinstance(index_data, dict):
        return index_data
    out = copy.deepcopy(index_data)
    sections = out.get("sections")
    if not isinstance(sections, dict):
        return out
    remove_keys = [
        key
        for key, spec in sections.items()
        if isinstance(spec, dict)
        and (
            key in _COD_HOME_PRODUCT_HERO_SECTION_TYPES
            or str(spec.get("type") or "") in _COD_HOME_PRODUCT_HERO_SECTION_TYPES
        )
    ]
    for key in remove_keys:
        sections.pop(key, None)
    order = out.get("order")
    if isinstance(order, list) and remove_keys:
        remove_set = set(remove_keys)
        out["order"] = [sid for sid in order if sid not in remove_set]
    return out


def _cod_premium_pages_for_publish(
    generation_data: dict,
    generated_page: dict | None,
    mode: str,
) -> list:
    """
    Build list of {id, text, images, selected_color} for COD premium PDP bind.
    Multi: generation_data.product_pages (selected 3 only).
    Single: product_page + product_ids[0] from the generated page.
    Other catalog products keep simple templates/product.json (no templateSuffix).
    """
    if not isinstance(generation_data, dict):
        return []
    pages = generation_data.get("product_pages")
    if isinstance(pages, list) and pages:
        out = []
        for entry in pages:
            if not isinstance(entry, dict):
                continue
            pid = entry.get("id")
            if pid is None:
                continue
            out.append(entry)
        return out

    if mode != "single_product":
        return []

    product_page = generation_data.get("product_page")
    if not isinstance(product_page, dict):
        return []

    product_ids = []
    if isinstance(generated_page, dict):
        raw_ids = generated_page.get("product_ids") or generated_page.get("productIds")
        if isinstance(raw_ids, list):
            product_ids = [x for x in raw_ids if x is not None and str(x).strip()]
    if not product_ids:
        # Fall back to id embedded on the premium PDP payload itself.
        embedded_id = product_page.get("id") or product_page.get("product_id")
        if embedded_id is not None and str(embedded_id).strip():
            product_ids = [embedded_id]

    if not product_ids:
        return []

    return [
        {
            "id": product_ids[0],
            "text": product_page.get("text")
            if isinstance(product_page.get("text"), dict)
            else {},
            "images": product_page.get("images")
            if isinstance(product_page.get("images"), dict)
            else {},
            "selected_color": product_page.get("selected_color"),
        }
    ]


def _bind_cod_premium_product_to_shopify(
    *,
    product_entry: dict,
    category: str,
    selected_template: int,
    selected_color: str | None,
    user_id: str,
    theme_id: str | None = None,
) -> dict:
    """Upload PDP images, set metafields, assign this product its own template."""
    product_id = product_entry.get("id")
    if product_id is None:
        return {"success": False, "error": "missing product id"}

    product_id = str(product_id)
    text_content = (
        product_entry.get("text")
        if isinstance(product_entry.get("text"), dict)
        else {}
    )
    images_dict = (
        product_entry.get("images")
        if isinstance(product_entry.get("images"), dict)
        else {}
    )
    body_images = (
        images_dict.get("body_images")
        if isinstance(images_dict.get("body_images"), dict)
        else {}
    )
    color = product_entry.get("selected_color") or selected_color

    body_image_metafields = {}
    for image_key, image_url in (body_images or {}).items():
        if not isinstance(image_url, str) or not (
            image_url.startswith("http://") or image_url.startswith("https://")
        ):
            continue
        try:
            ext = image_url.split("?")[0].split(".")[-1]
            if not ext or len(ext) > 6:
                ext = "jpg"
            filename = f"kluck_ai_store_pdp_{product_id}_{image_key}.{ext}"
            upload_result = shopify_utils.upload_image_to_shopify(
                image_url=image_url,
                filename=filename,
                alt_text=f"Kluck AI {str(image_key).replace('_', ' ').title()}",
                user_id=user_id,
            )
            if upload_result.get("success") and upload_result.get("file_id"):
                body_image_metafields[image_key] = upload_result.get("file_id")
            time.sleep(0.35)
        except Exception as upload_err:
            logger.warning(
                f"publish-store COD PDP: image upload failed for {product_id}/{image_key}: {upload_err}"
            )

    if text_content:
        try:
            shopify_utils.set_product_metafields_bulk(
                product_id=product_id,
                fields=text_content,
                user_id=user_id,
                namespace="kluck_ai",
            )
        except Exception as meta_err:
            logger.warning(
                f"publish-store COD PDP: text metafields failed for {product_id}: {meta_err}"
            )

    if color:
        try:
            shopify_utils.set_product_metafields_bulk(
                product_id=product_id,
                fields={"color_schema": color},
                user_id=user_id,
                namespace="kluck_ai",
            )
        except Exception as color_err:
            logger.warning(
                f"publish-store COD PDP: color metafield failed for {product_id}: {color_err}"
            )

    if body_image_metafields:
        try:
            shopify_utils.set_product_file_metafields_bulk(
                product_id=product_id,
                file_references=body_image_metafields,
                user_id=user_id,
                namespace="kluck_ai",
            )
        except Exception as file_err:
            logger.warning(
                f"publish-store COD PDP: file metafields failed for {product_id}: {file_err}"
            )

    bind_result = _publish_unique_product_template(
        category=category,
        product_id=product_id,
        selected_template=selected_template,
        theme_id=theme_id,
        user_id=user_id,
    )
    return {
        "success": bool(bind_result.get("success")),
        "product_id": product_id,
        "template": bind_result.get("template_file"),
        "template_suffix": bind_result.get("template_suffix"),
        "error": bind_result.get("error"),
    }


def _set_page_publish_status(page_id, status, error=None, extra=None):
    """Persist async publish job state on the generated page (separate from generation_status)."""
    if not page_id:
        return
    fields = {"publish_status": status}
    if error is not None:
        fields["publish_error"] = str(error)[:2000]
    elif status in {"in_progress", "completed"}:
        fields["publish_error"] = ""
    if extra:
        fields.update(extra)
    published = fields.pop("published", None)
    try:
        document_store.update_generated_page(
            page_id=str(page_id),
            published=published,
            **fields,
        )
    except Exception as persist_err:
        logger.warning(
            "publish-store: failed to persist publish_status=%s for page_id=%s: %s",
            status,
            page_id,
            persist_err,
        )


def _run_publish_store_task(user_id, data):
    page_id = (data or {}).get("page_id") or (data or {}).get("pageId")
    try:
        _execute_publish_store(user_id, data)
    except Exception as e:
        logger.error(f"Error in publish_store task: {str(e)}")
        _set_page_publish_status(page_id, "failed", error=str(e))


def _execute_publish_store(user_id, data):
    """Push theme assets, bind PDPs, and go live. Runs on a background thread."""
    data = data or {}
    try:
        # Determine store mode: single_product or multi_product (default single_product)
        mode_raw = (
            data.get("mode")
            or data.get("storeMode")
            or data.get("store_mode")
            or "single_product"
        )
        mode = str(mode_raw).strip().lower()
        if mode not in {"single_product", "multi_product"}:
            mode = "single_product"

        generation_data = data.get("generation_data") or data.get("generationData") or {}
        if not isinstance(generation_data, dict):
            generation_data = {}
        market_type = str(
            data.get("market_type")
            or data.get("marketType")
            or generation_data.get("market_type")
            or generation_data.get("marketType")
            or "prepaid"
        ).strip().lower()
        if market_type not in {"cod", "prepaid"}:
            market_type = "prepaid"

        from app.modules.generate.store.pack_utils import (
            SINGLE_PRODUCT_ONLY_STORE_TEMPLATE_PACKS,
            normalize_store_template_pack,
            resolve_store_templates_dir,
        )

        store_template_pack = normalize_store_template_pack(
            data.get("storeTemplatePack")
            or data.get("store_template_pack")
            or generation_data.get("storeTemplatePack")
            or generation_data.get("store_template_pack")
        )
        # Cinematic and Amour packs are single-product only (COD + prepaid).
        if (
            store_template_pack in SINGLE_PRODUCT_ONLY_STORE_TEMPLATE_PACKS
            and mode != "single_product"
        ):
            store_template_pack = "classic"

        # STEP 1: Live theme = duplication source. Reuse store.duplicated_theme_id
        # when that theme still exists; otherwise duplicate once and persist the id.
        source_live_theme_id = None
        try:
            live_theme_result = shopify_utils.get_live_theme(user_id)
            if live_theme_result.get("success") and live_theme_result.get("theme"):
                source_live_theme_id = str(live_theme_result["theme"].get("id"))
        except Exception as theme_error:
            logger.error(
                f"Error fetching live theme when publishing store templates: {theme_error}"
            )

        if not source_live_theme_id:
            raise RuntimeError("Could not resolve live theme for this store")

        store = document_store.get_user_primary_store(user_id)
        stored_duplicated_theme_id = (
            store.get("duplicated_theme_id") if isinstance(store, dict) else None
        )

        # Reuse the Kluck duplicated theme whenever it still exists on the shop.
        # Duplicate from live only when there is no stored id or the theme was removed in Shopify.
        reuse_existing = bool(
            stored_duplicated_theme_id
            and shopify_utils.check_if_theme_exists(stored_duplicated_theme_id, user_id)
        )

        duplicated_theme_this_run = False
        if reuse_existing:
            live_theme_id = str(
                _normalize_theme_id_for_compare(stored_duplicated_theme_id)
            )
            logger.info(
                f"publish-store: reusing duplicated_theme_id={live_theme_id} from store "
                f"(theme still exists on shop)"
            )
        else:
            if stored_duplicated_theme_id:
                logger.info(
                    f"publish-store: duplicated_theme_id={stored_duplicated_theme_id} "
                    f"missing or not on shop; duplicating from live theme {source_live_theme_id}"
                )
            duplicate_result = shopify_utils.duplicate_theme(
                theme_id=source_live_theme_id,
                new_name="Kluck AI Theme",
                user_id=user_id,
            )
            if not duplicate_result.get("success") or not (
                (duplicate_result.get("theme") or {}).get("id")
            ):
                raise RuntimeError(
                    "Failed to duplicate live theme as 'Kluck AI Theme': "
                    f"{duplicate_result.get('error', 'Unknown error')}"
                )

            live_theme_id = str((duplicate_result.get("theme") or {}).get("id"))
            duplicated_theme_this_run = True
            logger.info(
                f"publish-store: using new duplicated theme "
                f"'{(duplicate_result.get('theme') or {}).get('name')}' "
                f"(ID: {live_theme_id}) from live source theme {source_live_theme_id} "
                f"(no reusable Kluck theme id or prior theme removed from shop)"
            )
            # Theme copy finishes in the background. Uploading before layout/theme.liquid
            # is readable returns 404/409 and used to fail the whole push.
            theme_ready = False
            for ready_attempt in range(15):
                ready_check = shopify_utils.get_theme_asset(
                    theme_id=live_theme_id,
                    asset_key="layout/theme.liquid",
                    user_id=user_id,
                )
                if ready_check.get("exists"):
                    theme_ready = True
                    logger.info(
                        "publish-store: duplicated theme %s is readable "
                        "(attempt %s/15)",
                        live_theme_id,
                        ready_attempt + 1,
                    )
                    break
                logger.info(
                    "publish-store: duplicated theme %s not readable yet "
                    "(attempt %s/15)",
                    live_theme_id,
                    ready_attempt + 1,
                )
                time.sleep(2)
            if not theme_ready:
                logger.warning(
                    "publish-store: duplicated theme %s still not readable after 30s; "
                    "asset uploads will retry",
                    live_theme_id,
                )

            if store and store.get("PK"):
                try:
                    document_store.stores_table_ref.update_item(
                        Key={"PK": store.get("PK")},
                        UpdateExpression=(
                            "SET duplicated_theme_id = :tid, updated_at = :updated_at"
                        ),
                        ExpressionAttributeValues={
                            ":tid": str(live_theme_id),
                            ":updated_at": document_store._get_timestamp(),
                        },
                    )
                    logger.info(
                        f"publish-store: persisted duplicated_theme_id={live_theme_id} "
                        f"on store {store.get('PK')}"
                    )
                except Exception as sync_err:
                    logger.warning(
                        f"publish-store: failed to persist duplicated_theme_id early: {sync_err}"
                    )

        base_dir = Path(__file__).parent.parent.parent.parent.parent
        shopify_files_dir = base_dir / "data" / "assets" / "shopify_files"
        liquid_files_dir = shopify_files_dir / "liquid_files"
        snippet_files_dir = shopify_files_dir / "snippet_files"
        store_templates_dir = shopify_files_dir / "store_templates"
        mode_dir = resolve_store_templates_dir(
            shopify_files_dir, mode, store_template_pack
        )

        upload_success = True
        uploaded_files = []

        # 1) Push liquid files from liquid_files folder to theme sections
        if liquid_files_dir.exists():
            liquid_files = list(liquid_files_dir.glob("*.liquid"))
            # Cinematic: cinematic home + shared pages + premium PDP sections
            # (Sleek/Vibe). Skip classic homepage-only sections to cut Asset API trips.
            # Amour: its own home sections + shared pages (no cinematic sections).
            if store_template_pack == "amour":
                liquid_files = [
                    p
                    for p in liquid_files
                    if p.name not in _CLASSIC_HOME_ONLY_SECTIONS
                    and not p.name.startswith("kluck-ai-cinematic-")
                ]
                logger.info(
                    "publish-store: amour pack — uploading %s section liquids "
                    "(amour home + shared pages)",
                    len(liquid_files),
                )
            elif store_template_pack == "cinematic":
                liquid_files = [
                    p
                    for p in liquid_files
                    if p.name not in _CLASSIC_HOME_ONLY_SECTIONS
                    and not p.name.startswith("kluck-ai-amour-")
                ]
                logger.info(
                    "publish-store: cinematic pack — uploading %s section liquids "
                    "(cinematic home + premium PDP + shared pages)",
                    len(liquid_files),
                )
            for liquid_path in liquid_files:
                liquid_file = liquid_path.name
                asset_key = f"sections/{liquid_file}"
                force_update = _should_force_update_section(liquid_file)
                if not force_update:
                    check_result = shopify_utils.get_theme_asset(
                        theme_id=live_theme_id,
                        asset_key=asset_key,
                        user_id=user_id,
                    )
                    if check_result.get("exists"):
                        logger.info(
                            f"✅ {liquid_file} already exists in theme. Skipping upload."
                        )
                        uploaded_files.append(liquid_file)
                        continue
                reason = " (force update)" if force_update else ""
                logger.info(f"Uploading {liquid_file} to {asset_key}{reason}")
                upload_result = shopify_utils.update_theme_asset(
                    theme_id=live_theme_id,
                    file_path=str(liquid_path),
                    asset_key=asset_key,
                    user_id=user_id,
                )
                if upload_result.get("success"):
                    logger.info(f"✅ Successfully uploaded {liquid_file}")
                    uploaded_files.append(liquid_file)
                else:
                    logger.warning(
                        f"⚠️ Failed to upload {liquid_file}: {upload_result.get('error')}"
                    )
                    upload_success = False
        else:
            logger.warning(f"⚠️ liquid_files folder not found: {liquid_files_dir}")

        # 2) Always re-upload Kluck snippets (fonts/colors + UI i18n strings).
        # Skipping when they "already exist" left stale CSS / English chrome.
        for snippet_name in (
            "kluck-ai-font-and-color.liquid",
            "kluck-ui-string.liquid",
        ):
            snippet_path = snippet_files_dir / snippet_name
            if not snippet_path.exists():
                logger.warning(f"⚠️ Snippet file not found: {snippet_path}")
                if snippet_name == "kluck-ai-font-and-color.liquid":
                    upload_success = False
                continue
            snippet_asset_key = f"snippets/{snippet_name}"
            logger.info(f"Uploading {snippet_name} to {snippet_asset_key} (force update)")
            upload_result = shopify_utils.update_theme_asset(
                theme_id=live_theme_id,
                file_path=str(snippet_path),
                asset_key=snippet_asset_key,
                user_id=user_id,
            )
            if upload_result.get("success"):
                logger.info(f"✅ Successfully uploaded {snippet_name}")
                uploaded_files.append(snippet_name)
            else:
                logger.warning(
                    f"⚠️ Failed to upload {snippet_name}: {upload_result.get('error')}"
                )
                upload_success = False

        # 3) Ensure Kluck font/color snippet render exists in layout/theme.liquid <head>.
        try:
            theme_asset_key = "layout/theme.liquid"
            theme_asset_result = shopify_utils.get_theme_asset(
                theme_id=live_theme_id,
                asset_key=theme_asset_key,
                user_id=user_id,
            )
            if not theme_asset_result.get("success") or not theme_asset_result.get(
                "exists"
            ):
                raise ValueError(
                    f"Theme asset fetch failed or missing: {theme_asset_result.get('error')}"
                )

            theme_asset_obj = theme_asset_result.get("asset") or {}
            theme_raw_value = theme_asset_obj.get("value")
            if not theme_raw_value or not isinstance(theme_raw_value, str):
                attachment = theme_asset_obj.get("attachment")
                if isinstance(attachment, str) and attachment.strip():
                    theme_raw_value = base64.b64decode(attachment).decode("utf-8")
                else:
                    raise ValueError(
                        "layout/theme.liquid has no string 'value' (or base64 'attachment')."
                    )

            render_new = "{% render 'kluck-ai-font-and-color' %}"
            render_old = "{% render 'kluck-typography' %}"
            theme_updated = theme_raw_value
            patch_theme_liquid = False

            if render_new in theme_raw_value:
                logger.info(
                    "✅ layout/theme.liquid already contains Kluck font/color snippet render. Skipping patch."
                )
            elif render_old in theme_raw_value:
                theme_updated = theme_raw_value.replace(render_old, render_new)
                patch_theme_liquid = True
            else:
                head_open_idx = theme_raw_value.lower().find("<head")
                if head_open_idx == -1:
                    raise ValueError("Could not find <head> tag in layout/theme.liquid")
                head_open_close_idx = theme_raw_value.find(">", head_open_idx)
                if head_open_close_idx == -1:
                    raise ValueError(
                        "Could not find end of opening <head> tag in layout/theme.liquid"
                    )
                insert_pos = head_open_close_idx + 1
                insertion = f"\n    {render_new}"
                theme_updated = (
                    theme_raw_value[:insert_pos]
                    + insertion
                    + theme_raw_value[insert_pos:]
                )
                patch_theme_liquid = True

            if patch_theme_liquid:
                with tempfile.NamedTemporaryFile(
                    "w", suffix=".liquid", delete=True
                ) as tmp:
                    tmp.write(theme_updated)
                    tmp.flush()
                    theme_upload_result = shopify_utils.update_theme_asset(
                        theme_id=live_theme_id,
                        file_path=str(tmp.name),
                        asset_key=theme_asset_key,
                        user_id=user_id,
                    )

                if theme_upload_result.get("success"):
                    logger.info(
                        "✅ Injected/updated Kluck font/color snippet render in layout/theme.liquid <head>"
                    )
                    uploaded_files.append("layout/theme.liquid")
                else:
                    logger.warning(
                        "⚠️ Failed to upload patched layout/theme.liquid: "
                        f"{theme_upload_result.get('error')}"
                    )
                    upload_success = False
        except Exception as theme_err:
            logger.warning(f"⚠️ Failed to patch/upload layout/theme.liquid: {theme_err}")
            upload_success = False

        # 4) Upload store JSON templates into theme templates (home, product, collection, list-collections)
        for json_name in (
            "index.json",
            "product.json",
            "collection.json",
            "list-collections.json",
            "page.contact.json",
            "page.faq.json",
            "page.about.json",
            "404.json",
        ):
            json_file_path = mode_dir / json_name
            if json_file_path.exists():
                asset_key = f"templates/{json_name}"
                upload_path = str(json_file_path)
                temp_index_path = None
                # Single home with premium PDP: omit Product Hero (checkout is on premium PDP).
                # Classic prepaid keeps product hero / checkout on the homepage.
                _gen_premium_ids = (
                    (
                        generation_data.get("premium_product_ids")
                        or generation_data.get("premiumProductIds")
                    )
                    if isinstance(generation_data, dict)
                    else None
                )
                _single_has_premium = (
                    market_type == "cod"
                    or (
                        isinstance(_gen_premium_ids, list) and len(_gen_premium_ids) > 0
                    )
                )
                if (
                    json_name == "index.json"
                    and mode == "single_product"
                    and _single_has_premium
                ):
                    try:
                        with open(json_file_path, "r", encoding="utf-8") as f:
                            index_payload = json.load(f)
                        patched = _strip_product_hero_from_index_json(index_payload)
                        fd, temp_index_path = tempfile.mkstemp(
                            suffix="-single-index.json", text=True
                        )
                        os.close(fd)
                        with open(temp_index_path, "w", encoding="utf-8") as f:
                            json.dump(patched, f, ensure_ascii=False)
                        upload_path = temp_index_path
                        logger.info(
                            "publish-store: stripped product hero from single index.json"
                        )
                    except Exception as strip_err:
                        logger.warning(
                            f"publish-store: failed to strip product hero "
                            f"from index.json, uploading original: {strip_err}"
                        )
                        upload_path = str(json_file_path)
                        temp_index_path = None
                store_json_ok = False
                try:
                    for try_i in range(3):
                        if try_i:
                            logger.info(
                                f"Retrying store template {json_name} upload "
                                f"({try_i + 1}/3) to {asset_key}"
                            )
                            time.sleep(0.75)
                        else:
                            logger.info(f"Uploading store template {json_name} to {asset_key}")
                        upload_result = shopify_utils.update_theme_asset(
                            theme_id=live_theme_id,
                            file_path=upload_path,
                            asset_key=asset_key,
                            user_id=user_id,
                        )
                        if upload_result.get("success"):
                            logger.info(f"✅ Successfully uploaded {json_name}")
                            uploaded_files.append(json_name)
                            store_json_ok = True
                            break
                        logger.warning(
                            f"⚠️ Failed to upload {json_name}: {upload_result.get('error')}"
                        )
                finally:
                    if temp_index_path:
                        try:
                            os.unlink(temp_index_path)
                        except Exception:
                            pass
                if not store_json_ok:
                    upload_success = False
            else:
                logger.warning(f"⚠️ Store template file not found: {json_file_path}")
                upload_success = False

        # 4b) Push all category templates: templates_files/<category>/*.json → templates/
        # Needed for premium Sleek/Vibe PDP bind (classic + cinematic COD).
        templates_files_dir = shopify_files_dir / "templates_files"
        if templates_files_dir.is_dir():
            for category_dir in sorted(
                p for p in templates_files_dir.iterdir() if p.is_dir()
            ):
                for json_path in sorted(category_dir.glob("*.json")):
                    fname = json_path.name
                    asset_key = f"templates/{fname}"
                    # These are the shared layout files. Leave a copy that is already
                    # on the theme alone so a later publish cannot reset a live product.
                    existing_layout = shopify_utils.get_theme_asset(
                        theme_id=live_theme_id,
                        asset_key=asset_key,
                        user_id=user_id,
                    )
                    if existing_layout.get("exists"):
                        logger.info(
                            f"✅ {asset_key} already on theme. Leaving it in place."
                        )
                        uploaded_files.append(
                            f"templates_files/{category_dir.name}/{fname}"
                        )
                        continue
                    logger.info(
                        f"Uploading templates_files/{category_dir.name}/{fname} to {asset_key}"
                    )
                    upload_result = shopify_utils.update_theme_asset(
                        theme_id=live_theme_id,
                        file_path=str(json_path),
                        asset_key=asset_key,
                        user_id=user_id,
                    )
                    if upload_result.get("success"):
                        logger.info(
                            f"✅ Successfully uploaded category template {category_dir.name}/{fname}"
                        )
                        uploaded_files.append(
                            f"templates_files/{category_dir.name}/{fname}"
                        )
                    else:
                        logger.warning(
                            f"⚠️ Failed to upload {category_dir.name}/{fname}: "
                            f"{upload_result.get('error')}"
                        )
                        upload_success = False
        else:
            logger.warning(
                f"⚠️ templates_files folder not found: {templates_files_dir}"
            )

        # 5) Patch config/settings_schema.json with Kluck typography + color controls.
        page_id = data.get("page_id") or data.get("pageId")
        generated_page = (
            document_store.get_generated_page_by_id(str(page_id)) if page_id else None
        )
        stored_generation_data = (
            generated_page.get("generation_data")
            if isinstance(generated_page, dict)
            else None
        )
        # Prefer DynamoDB generation_data, but keep request fields when the
        # editor sent fresher content (PDP copy, home_page.section_colors, etc.).
        request_generation_data = (
            data.get("generation_data")
            if isinstance(data.get("generation_data"), dict)
            else (
                data.get("generationData")
                if isinstance(data.get("generationData"), dict)
                else None
            )
        )
        if isinstance(stored_generation_data, dict):
            generation_data = dict(stored_generation_data)
            if isinstance(request_generation_data, dict):
                for key in (
                    "product_pages",
                    "product_page",
                    "home_page",
                    "selectedTemplate",
                    "selected_template",
                    "store_category",
                    "category",
                    "stylePreferences",
                    "style_preferences",
                ):
                    if key in request_generation_data and request_generation_data.get(key) is not None:
                        generation_data[key] = request_generation_data[key]
        else:
            generation_data = request_generation_data
        stored_style_prefs = (
            generation_data.get("style_preferences")
            if isinstance(generation_data, dict)
            and isinstance(generation_data.get("style_preferences"), dict)
            else {}
        )

        style_preferences_payload = (
            data.get("stylePreferences")
            if isinstance(data.get("stylePreferences"), dict)
            else {}
        )

        heading_font = (
            data.get("headingFont")
            or data.get("heading_font")
            or style_preferences_payload.get("headingFont")
            or style_preferences_payload.get("heading_font")
            or stored_style_prefs.get("heading_font")
            or stored_style_prefs.get("headingFont")
        )
        body_font = (
            data.get("bodyFont")
            or data.get("body_font")
            or style_preferences_payload.get("bodyFont")
            or style_preferences_payload.get("body_font")
            or stored_style_prefs.get("body_font")
            or stored_style_prefs.get("bodyFont")
        )

        def _map_font_for_schema_default(font_value):
            if font_value is None:
                return None
            if isinstance(font_value, str):
                normalized_key = " ".join(font_value.replace("+", " ").split()).strip()
                mapped = SHOPIFY_FONTS.get(font_value) or SHOPIFY_FONTS.get(
                    normalized_key
                )
                return (mapped or font_value).strip() if (mapped or font_value) else None
            return None

        schema_heading_default = (
            _map_font_for_schema_default(heading_font) or "barlow_condensed_n4"
        )
        schema_body_default = _map_font_for_schema_default(body_font) or "barlow_n4"

        def _valid_hex_color(value):
            if not isinstance(value, str):
                return None
            raw = value.strip()
            if len(raw) == 3 and raw and not raw.startswith("#"):
                chars = raw
                if all(c in "0123456789abcdefABCDEF" for c in chars):
                    return f"#{raw.lower()}"
            if len(raw) == 6 and raw and not raw.startswith("#"):
                chars = raw
                if all(c in "0123456789abcdefABCDEF" for c in chars):
                    return f"#{raw.lower()}"
            if len(raw) == 4 and raw.startswith("#"):
                chars = raw[1:]
                if all(c in "0123456789abcdefABCDEF" for c in chars):
                    return raw.lower()
            if len(raw) == 7 and raw.startswith("#"):
                chars = raw[1:]
                if all(c in "0123456789abcdefABCDEF" for c in chars):
                    return raw.lower()
            return None

        def _pick_color_from_obj(obj):
            if not isinstance(obj, dict):
                return None
            for key in (
                "color_scheme",
                "colorScheme",
                "color",
                "primaryColor",
                "primary_color",
                "selectedColor",
                "selected_color",
                "defaultColor",
                "default_color",
                "hex",
                "value",
            ):
                c = _valid_hex_color(obj.get(key))
                if c:
                    return c
            return None

        frontend_color_default = _pick_color_from_obj(data)

        if not frontend_color_default:
            for container_key in (
                "theme",
                "settings",
                "style",
                "branding",
                "appearance",
                "colors",
                "colorSettings",
            ):
                frontend_color_default = _pick_color_from_obj(data.get(container_key))
                if frontend_color_default:
                    break

        if not frontend_color_default:
            for arr_key in ("colorSchemes", "color_schemes", "schemes"):
                arr = data.get(arr_key)
                if isinstance(arr, list):
                    for item in arr:
                        frontend_color_default = _pick_color_from_obj(item)
                        if frontend_color_default:
                            break
                if frontend_color_default:
                    break

        if not frontend_color_default:
            frontend_color_default = _pick_color_from_obj(style_preferences_payload)

        if not frontend_color_default:
            frontend_color_default = _pick_color_from_obj(stored_style_prefs)

        schema_color_default = frontend_color_default or "#000000"

        try:
            asset_key = "config/settings_schema.json"
            schema_asset_result = shopify_utils.get_theme_asset(
                theme_id=live_theme_id,
                asset_key=asset_key,
                user_id=user_id,
            )
            if not schema_asset_result.get("success") or not schema_asset_result.get(
                "exists"
            ):
                raise ValueError(
                    f"Theme asset fetch failed or missing: {schema_asset_result.get('error')}"
                )

            schema_asset_obj = schema_asset_result.get("asset") or {}
            schema_raw_value = schema_asset_obj.get("value")
            if not schema_raw_value or not isinstance(schema_raw_value, str):
                attachment = schema_asset_obj.get("attachment")
                if isinstance(attachment, str) and attachment.strip():
                    schema_raw_value = base64.b64decode(attachment).decode("utf-8")
                else:
                    raise ValueError(
                        "config/settings_schema.json has no string 'value' (or base64 'attachment')."
                    )

            schema_data = json.loads(schema_raw_value)
            if not isinstance(schema_data, list):
                raise ValueError("settings_schema.json must be a JSON array.")

            kluck_typography_name = "Kluck AI - Typography"
            kluck_typography_settings = [
                {"type": "header", "content": "Fonts"},
                {
                    "type": "font_picker",
                    "id": "kluck_heading_font",
                    "label": "Heading font",
                    "default": schema_heading_default,
                },
                {
                    "type": "font_picker",
                    "id": "kluck_body_font",
                    "label": "Body font",
                    "default": schema_body_default,
                },
            ]

            kluck_color_name = "Kluck AI - Color"
            kluck_color_settings = [
                {"type": "header", "content": "Color Schemes"},
                {
                    "type": "color",
                    "id": "color_scheme",
                    "label": "Color",
                    "default": schema_color_default,
                },
                {
                    "type": "range",
                    "id": "button_opacity",
                    "label": "Button Opacity",
                    "min": 0,
                    "max": 1,
                    "step": 0.1,
                    "default": 0.8,
                },
                {
                    "type": "range",
                    "id": "section_opacity",
                    "label": "Section Opacity",
                    "min": 0,
                    "max": 1,
                    "step": 0.1,
                    "default": 0.3,
                },
            ]

            typography_idx = None
            for i, block in enumerate(schema_data):
                if isinstance(block, dict) and block.get("name") == kluck_typography_name:
                    typography_idx = i
                    break

            color_idx = None
            for i, block in enumerate(schema_data):
                if isinstance(block, dict) and block.get("name") == kluck_color_name:
                    color_idx = i
                    break

            if typography_idx is not None:
                schema_data[typography_idx]["name"] = kluck_typography_name
                schema_data[typography_idx]["settings"] = copy.deepcopy(
                    kluck_typography_settings
                )
                logger.info(
                    "publish-store: updated Kluck AI - Typography schema block (settings refreshed)"
                )
            else:
                schema_data.insert(
                    0,
                    {
                        "name": kluck_typography_name,
                        "settings": copy.deepcopy(kluck_typography_settings),
                    },
                )
                typography_idx = 0
                logger.info(
                    "publish-store: inserted Kluck AI - Typography schema block (first time)"
                )

            if color_idx is not None:
                schema_data[color_idx]["name"] = kluck_color_name
                schema_data[color_idx]["settings"] = copy.deepcopy(kluck_color_settings)
                logger.info(
                    "publish-store: updated Kluck AI - Color schema block (settings refreshed)"
                )
            else:
                insert_color_at = (
                    (typography_idx + 1) if typography_idx is not None else 0
                )
                schema_data.insert(
                    insert_color_at,
                    {
                        "name": kluck_color_name,
                        "settings": copy.deepcopy(kluck_color_settings),
                    },
                )
                logger.info(
                    "publish-store: inserted Kluck AI - Color schema block (first time)"
                )

            # Shopify color_scheme section settings require a color_scheme_group in
            # settings_schema. Without it the editor shows:
            # "Unable to display color schemes. Schemes must be defined in
            # settings_data and settings_schema."
            has_color_scheme_group = False
            for block in schema_data:
                if not isinstance(block, dict):
                    continue
                for setting in block.get("settings") or []:
                    if (
                        isinstance(setting, dict)
                        and setting.get("type") == "color_scheme_group"
                        and setting.get("id") == "color_schemes"
                    ):
                        has_color_scheme_group = True
                        break
                if has_color_scheme_group:
                    break

            if not has_color_scheme_group:
                kluck_schemes_block = {
                    "name": "Kluck AI - Color Schemes",
                    "settings": [
                        {
                            "type": "color_scheme_group",
                            "id": "color_schemes",
                            "definition": [
                                {
                                    "type": "color",
                                    "id": "background",
                                    "label": "Background",
                                    "default": "#FFFFFF",
                                },
                                {
                                    "type": "color_background",
                                    "id": "background_gradient",
                                    "label": "Background gradient",
                                },
                                {
                                    "type": "color",
                                    "id": "text",
                                    "label": "Text",
                                    "default": "#121212",
                                },
                                {
                                    "type": "color",
                                    "id": "button",
                                    "label": "Button",
                                    "default": "#121212",
                                },
                                {
                                    "type": "color",
                                    "id": "button_label",
                                    "label": "Button label",
                                    "default": "#FFFFFF",
                                },
                                {
                                    "type": "color",
                                    "id": "secondary_button_label",
                                    "label": "Secondary button label",
                                    "default": "#121212",
                                },
                                {
                                    "type": "color",
                                    "id": "shadow",
                                    "label": "Shadow",
                                    "default": "#121212",
                                },
                            ],
                            "role": {
                                "text": "text",
                                "background": {
                                    "solid": "background",
                                    "gradient": "background_gradient",
                                },
                                "links": "secondary_button_label",
                                "icons": "text",
                                "primary_button": "button",
                                "on_primary_button": "button_label",
                                "primary_button_border": "button",
                                "secondary_button": "background",
                                "on_secondary_button": "secondary_button_label",
                                "secondary_button_border": "secondary_button_label",
                            },
                        }
                    ],
                }
                insert_schemes_at = 0
                for i, block in enumerate(schema_data):
                    if isinstance(block, dict) and block.get("name") == kluck_color_name:
                        insert_schemes_at = i + 1
                        break
                schema_data.insert(insert_schemes_at, kluck_schemes_block)
                logger.info(
                    "publish-store: inserted color_scheme_group (scheme-1/scheme-2) "
                    "into settings_schema.json"
                )
            else:
                logger.info(
                    "publish-store: color_scheme_group already present in settings_schema"
                )

            schema_json = json.dumps(schema_data, ensure_ascii=False, indent=2)
            try:
                debug_dir = os.path.join(tempfile.gettempdir(), "kluck_publish_store_debug")
                os.makedirs(debug_dir, exist_ok=True)
                debug_page_id = str(page_id) if page_id else "no_page_id"
                debug_file_path = os.path.join(
                    debug_dir,
                    f"settings_schema_{debug_page_id}_{int(time.time())}.json",
                )
                with open(debug_file_path, "w", encoding="utf-8") as debug_fp:
                    debug_fp.write(schema_json)
                logger.info(
                    "publish-store: dumped settings_schema.json debug payload to %s",
                    debug_file_path,
                )
            except Exception as dump_err:
                logger.warning(
                    "publish-store: failed writing settings_schema debug dump: %s",
                    dump_err,
                )
            with tempfile.NamedTemporaryFile("w", suffix=".json", delete=True) as tmp:
                tmp.write(schema_json)
                tmp.flush()
                schema_upload_result = shopify_utils.update_theme_asset(
                    theme_id=live_theme_id,
                    file_path=str(tmp.name),
                    asset_key=asset_key,
                    user_id=user_id,
                )

            if schema_upload_result.get("success"):
                logger.info(
                    "✅ Successfully uploaded config/settings_schema.json "
                    "(Kluck typography + color)"
                )
                uploaded_files.append("config/settings_schema.json")
            else:
                logger.warning(
                    "⚠️ Failed to upload patched config/settings_schema.json: "
                    f"{schema_upload_result.get('error')}"
                )
                upload_success = False

            # 5b) Patch config/settings_data.json current values so new defaults are active now.
            try:
                settings_data_key = "config/settings_data.json"
                settings_data_asset_result = shopify_utils.get_theme_asset(
                    theme_id=live_theme_id,
                    asset_key=settings_data_key,
                    user_id=user_id,
                )
                if not settings_data_asset_result.get("success") or not settings_data_asset_result.get(
                    "exists"
                ):
                    raise ValueError(
                        "settings_data.json fetch failed or missing: "
                        f"{settings_data_asset_result.get('error')}"
                    )

                settings_data_asset_obj = settings_data_asset_result.get("asset") or {}
                settings_data_raw = settings_data_asset_obj.get("value")
                if not settings_data_raw or not isinstance(settings_data_raw, str):
                    attachment = settings_data_asset_obj.get("attachment")
                    if isinstance(attachment, str) and attachment.strip():
                        settings_data_raw = base64.b64decode(attachment).decode("utf-8")
                    else:
                        raise ValueError(
                            "config/settings_data.json has no string 'value' (or base64 'attachment')."
                        )

                settings_data_json = json.loads(settings_data_raw)
                if not isinstance(settings_data_json, dict):
                    raise ValueError("settings_data.json must be a JSON object.")

                current = settings_data_json.get("current")
                if not isinstance(current, dict):
                    current = {}
                    settings_data_json["current"] = current

                current["kluck_heading_font"] = schema_heading_default
                current["kluck_body_font"] = schema_body_default
                # Keep both ids for compatibility across snippet/schema revisions.
                current["color_scheme"] = schema_color_default
                color_schemes = current.get("color_schemes")
                if not isinstance(color_schemes, dict):
                    color_schemes = {}
                    current["color_schemes"] = color_schemes

                # Mirror embed preview (stylePreferences.js): scheme-1 = white + accent
                # buttons; scheme-2 = soft accent wash + readable contrast text.
                # Empty {} schemes were wiping Image with Text 2/3 backgrounds and
                # flipping section-3 smart-contrast to white-on-white.
                accent = schema_color_default or "#bca38f"

                def _hex_to_rgb(hex_color: str):
                    h = (hex_color or "").strip().lstrip("#")
                    if len(h) == 3:
                        h = "".join(c * 2 for c in h)
                    if len(h) != 6:
                        return None
                    try:
                        return (
                            int(h[0:2], 16),
                            int(h[2:4], 16),
                            int(h[4:6], 16),
                        )
                    except ValueError:
                        return None

                def _rgb_to_hex(r: int, g: int, b: int) -> str:
                    return f"#{max(0, min(255, r)):02x}{max(0, min(255, g)):02x}{max(0, min(255, b)):02x}"

                def _mix_with_white(hex_color: str, accent_amount: float) -> str:
                    rgb = _hex_to_rgb(hex_color)
                    if not rgb:
                        return "#f2ebe5"
                    r, g, b = rgb
                    w = 1.0 - accent_amount
                    return _rgb_to_hex(
                        int(round(r * accent_amount + 255 * w)),
                        int(round(g * accent_amount + 255 * w)),
                        int(round(b * accent_amount + 255 * w)),
                    )

                def _contrast_text(hex_color: str) -> str:
                    rgb = _hex_to_rgb(hex_color)
                    if not rgb:
                        return "#000000"
                    r, g, b = rgb
                    luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
                    return "#000000" if luminance > 0.6 else "#ffffff"

                scheme2_bg = _mix_with_white(accent, 0.3)
                scheme2_fg = _contrast_text(scheme2_bg)
                # Dawn / Shopify color_scheme_group keys (must match settings_schema
                # definition). Horizon-only keys get stripped by Shopify.
                scheme1_settings = {
                    "background": "#ffffff",
                    "background_gradient": "",
                    "text": "#121212",
                    "button": accent,
                    "button_label": "#ffffff",
                    "secondary_button_label": "#121212",
                    "shadow": "#121212",
                }
                scheme2_text = (
                    scheme2_fg if scheme2_fg == "#ffffff" else "#121212"
                )
                scheme2_settings = {
                    "background": scheme2_bg,
                    "background_gradient": "",
                    "text": scheme2_text,
                    "button": accent,
                    "button_label": "#ffffff",
                    "secondary_button_label": "#121212",
                    "shadow": "#121212",
                }

                def _ensure_scheme(scheme_id: str, settings: dict):
                    entry = color_schemes.get(scheme_id)
                    if not isinstance(entry, dict):
                        entry = {}
                    existing = entry.get("settings")
                    if not isinstance(existing, dict):
                        existing = {}
                    # Always apply Kluck accent-driven keys; keep any extra theme keys.
                    existing.update(settings)
                    entry["settings"] = existing
                    color_schemes[scheme_id] = entry

                _ensure_scheme("scheme-1", scheme1_settings)
                _ensure_scheme("scheme-2", scheme2_settings)
                logger.info(
                    "publish-store: applied color schemes accent=%s scheme-2 bg=%s fg=%s",
                    accent,
                    scheme2_bg,
                    scheme2_fg,
                )

                settings_data_out = json.dumps(
                    settings_data_json, ensure_ascii=False, indent=2
                )
                try:
                    debug_dir = os.path.join(
                        tempfile.gettempdir(), "kluck_publish_store_debug"
                    )
                    os.makedirs(debug_dir, exist_ok=True)
                    debug_page_id = str(page_id) if page_id else "no_page_id"
                    debug_file_path = os.path.join(
                        debug_dir,
                        f"settings_data_{debug_page_id}_{int(time.time())}.json",
                    )
                    with open(debug_file_path, "w", encoding="utf-8") as debug_fp:
                        debug_fp.write(settings_data_out)
                    logger.info(
                        "publish-store: dumped settings_data.json debug payload to %s",
                        debug_file_path,
                    )
                except Exception as dump_err:
                    logger.warning(
                        "publish-store: failed writing settings_data debug dump: %s",
                        dump_err,
                    )

                with tempfile.NamedTemporaryFile("w", suffix=".json", delete=True) as tmp:
                    tmp.write(settings_data_out)
                    tmp.flush()
                    settings_data_upload_result = shopify_utils.update_theme_asset(
                        theme_id=live_theme_id,
                        file_path=str(tmp.name),
                        asset_key=settings_data_key,
                        user_id=user_id,
                    )

                if settings_data_upload_result.get("success"):
                    logger.info(
                        "✅ Successfully uploaded config/settings_data.json "
                        "(current Kluck typography + color values)"
                    )
                    uploaded_files.append("config/settings_data.json")

                    # Per-section colors from editor (home_page.section_colors)
                    try:
                        section_colors = _extract_section_colors_payload(
                            generation_data=generation_data
                            if isinstance(generation_data, dict)
                            else None,
                            data=data if isinstance(data, dict) else None,
                        )
                        if section_colors:
                            section_result = _apply_section_colors_to_live_theme(
                                user_id=user_id,
                                theme_id=live_theme_id,
                                section_colors=section_colors,
                                accent_fallback=schema_color_default or "#bca38f",
                            )
                            if section_result.get("success"):
                                report = section_result.get("section_colors") or {}
                                logger.info(
                                    "publish-store: applied section_colors "
                                    f"(schemes={len(report.get('schemes_added') or [])}, "
                                    f"sections={len(report.get('sections_updated') or [])})"
                                )
                                uploaded_files.append(
                                    "templates/index.json#section_colors"
                                )
                            else:
                                logger.warning(
                                    "publish-store: section_colors patch failed: %s",
                                    section_result.get("error"),
                                )
                    except Exception as section_colors_err:
                        logger.warning(
                            "publish-store: section_colors apply error: %s",
                            section_colors_err,
                        )

                    # Amour: section.settings.accent_color drives --a-wine (category-aware).
                    if store_template_pack == "amour":
                        try:
                            amour_category = None
                            if isinstance(generation_data, dict):
                                amour_category = (
                                    generation_data.get("storeCategory")
                                    or generation_data.get("store_category")
                                    or generation_data.get("category")
                                )
                            if not amour_category and isinstance(data, dict):
                                amour_category = (
                                    data.get("storeCategory")
                                    or data.get("store_category")
                                    or data.get("detected_category")
                                    or data.get("category")
                                )
                            amour_patch = _patch_amour_section_accents(
                                user_id=user_id,
                                theme_id=live_theme_id,
                                accent_hex=schema_color_default,
                                category=amour_category,
                            )
                            if amour_patch.get("success") and not amour_patch.get(
                                "skipped"
                            ):
                                uploaded_files.append(
                                    "templates/index.json#amour_accents"
                                )
                            elif not amour_patch.get("success"):
                                logger.warning(
                                    "publish-store: amour accent patch failed: %s",
                                    amour_patch.get("error"),
                                )
                        except Exception as amour_accent_err:
                            logger.warning(
                                "publish-store: amour accent patch error: %s",
                                amour_accent_err,
                            )
                else:
                    logger.warning(
                        "⚠️ Failed to upload patched config/settings_data.json: "
                        f"{settings_data_upload_result.get('error')}"
                    )
                    upload_success = False
            except Exception as settings_data_err:
                logger.warning(
                    f"⚠️ Failed to patch/upload config/settings_data.json: {settings_data_err}"
                )
                upload_success = False
        except Exception as schema_err:
            logger.warning(
                f"⚠️ Failed to patch/upload config/settings_schema.json: {schema_err}"
            )
            upload_success = False

        # 6) Persist generated store content into SHOP metafield (optional)
        # Mirrors product publish flow, but stores data on the shop (owner_resource="shop").
        # Store generation_data is fetched from DynamoDB by page_id (same as product flow).
        if page_id:
            try:
                if isinstance(generation_data, dict) and generation_data:
                    store_mode = "single"
                    if isinstance(generated_page, dict):
                        stored_mode = generated_page.get("mode")
                        if stored_mode == "multi_product":
                            store_mode = "multi"
                    if generation_data.get("mode") not in {"single", "multi"}:
                        generation_data["mode"] = store_mode
                    # Upload store-generated image URLs to Shopify Files and replace with File GIDs,
                    # mirroring the product publish flow behavior.
                    try:
                        home_page = generation_data.get("home_page", {})
                        home_images = (
                            home_page.get("images", {})
                            if isinstance(home_page, dict)
                            else {}
                        )
                        if isinstance(home_images, dict) and home_images:
                            logger.info(
                                f"publish-store: uploading {len(home_images)} home_page images to Shopify Files"
                            )
                            file_gid_images = {}

                            def _upload_one_home_image(item):
                                image_key, image_url = item
                                if not isinstance(image_url, str) or not (
                                    image_url.startswith("http://")
                                    or image_url.startswith("https://")
                                ):
                                    return None
                                ext = image_url.split("?")[0].split(".")[-1]
                                if not ext or len(ext) > 6:
                                    ext = "jpg"
                                filename = f"kluck_ai_store_{image_key}.{ext}"
                                upload_result = shopify_utils.upload_image_to_shopify(
                                    image_url=image_url,
                                    filename=filename,
                                    alt_text=f"Kluck AI {image_key.replace('_', ' ').title()}",
                                    user_id=user_id,
                                )
                                if upload_result.get("success") and upload_result.get(
                                    "file_id"
                                ):
                                    return image_key, upload_result.get("file_id")
                                logger.warning(
                                    f"publish-store: failed uploading {image_key}: "
                                    f"{upload_result.get('error', 'Unknown error')}"
                                )
                                return None

                            upload_items = list(home_images.items())
                            with ThreadPoolExecutor(max_workers=4) as pool:
                                futures = [
                                    pool.submit(_upload_one_home_image, item)
                                    for item in upload_items
                                ]
                                for fut in as_completed(futures):
                                    try:
                                        result = fut.result()
                                    except Exception as upload_error:
                                        logger.error(
                                            f"publish-store: error uploading image: {upload_error}"
                                        )
                                        continue
                                    if result:
                                        image_key, file_id = result
                                        file_gid_images[image_key] = file_id

                            # Set file_reference metafields (sequential; avoid hammering REST)
                            for image_key, file_id in file_gid_images.items():
                                safe_key = (
                                    str(image_key)
                                    .strip()
                                    .lower()
                                    .replace(" ", "_")
                                    .replace("-", "_")
                                )
                                try:
                                    shopify_utils.set_shop_metafield(
                                        namespace="kluck_ai",
                                        key=safe_key,
                                        mtype="file_reference",
                                        value=file_id,
                                        user_id=user_id,
                                    )
                                except Exception as shop_mf_err:
                                    logger.warning(
                                        f"publish-store: failed setting shop file_reference metafield for {safe_key}: {shop_mf_err}"
                                    )

                            if file_gid_images:
                                # Replace urls with file GIDs for metafield storage
                                if (
                                    "home_page" not in generation_data
                                    or not isinstance(
                                        generation_data.get("home_page"), dict
                                    )
                                ):
                                    generation_data["home_page"] = {}
                                if "images" not in generation_data[
                                    "home_page"
                                ] or not isinstance(
                                    generation_data["home_page"].get("images"), dict
                                ):
                                    generation_data["home_page"]["images"] = {}
                                generation_data["home_page"]["images"].update(
                                    file_gid_images
                                )
                    except Exception as images_to_files_err:
                        logger.error(
                            f"publish-store: error converting image urls to Shopify file gids: {images_to_files_err}"
                        )

                    metafield_payload = generation_data
                    value_str = json.dumps(metafield_payload, ensure_ascii=False)

                    # Shopify metafield value size is limited; keep a guardrail.
                    if len(value_str) > 60000:
                        logger.warning(
                            f"Store metafield payload too large ({len(value_str)} chars). Storing generation.home_page only."
                        )
                        slim_payload = {
                            "mode": generation_data.get("mode", "single"),
                            "home_page": generation_data.get("home_page", {}),
                        }
                        value_str = json.dumps(slim_payload, ensure_ascii=False)

                    time.sleep(0.15)
                    metafield_result = shopify_utils.set_shop_metafield(
                        namespace="kluck_ai",
                        key="store_generation",
                        mtype="json",
                        value=value_str,
                        user_id=user_id,
                    )
                    if metafield_result.get("success"):
                        logger.info(
                            f"✅ Saved store generation into shop metafield kluck_ai.store_generation for page_id={page_id}"
                        )
                    else:
                        logger.warning(
                            f"⚠️ Failed saving shop metafield kluck_ai.store_generation for page_id={page_id}: {metafield_result.get('error')}"
                        )
                else:
                    logger.warning(
                        f"No generation_data found in DynamoDB for page_id={page_id}; skipping shop metafield save"
                    )
            except Exception as mf_err:
                logger.error(
                    f"Error saving store generation to shop metafield for page_id={page_id}: {mf_err}"
                )

        # 6b) Bind premium PDP template + metafields to featured products.
        # Single (COD + prepaid, classic + cinematic) + multi with premium PDPs.
        # Other catalog products keep the simple templates/product.json.
        _multi_premium_pages = (
            generation_data.get("product_pages")
            if isinstance(generation_data, dict)
            else None
        )
        _has_multi_premium_pdps = (
            isinstance(_multi_premium_pages, list) and len(_multi_premium_pages) > 0
        )
        _has_single_premium_pdp = bool(
            isinstance(generation_data, dict)
            and isinstance(generation_data.get("product_page"), dict)
            and (
                generation_data["product_page"].get("text")
                or generation_data["product_page"].get("images")
            )
        )
        if (
            isinstance(generation_data, dict)
            and generation_data
            and (
                market_type == "cod"
                or _has_multi_premium_pdps
                or _has_single_premium_pdp
            )
        ):
            try:
                cod_pages = _cod_premium_pages_for_publish(
                    generation_data, generated_page, mode
                )
                if cod_pages:
                    # Store jobs persist `store_category` (not `category`). Prefer that
                    # so premium PDPs get the matching kluck-{category}-{N} template
                    # (Four Blocks lives on those templates, not always on general-1).
                    page_category = (
                        (
                            generated_page.get("store_category")
                            if isinstance(generated_page, dict)
                            else None
                        )
                        or (
                            generated_page.get("category")
                            if isinstance(generated_page, dict)
                            else None
                        )
                        or (
                            generation_data.get("store_category")
                            if isinstance(generation_data, dict)
                            else None
                        )
                        or (
                            generation_data.get("category")
                            if isinstance(generation_data, dict)
                            else None
                        )
                        or "general"
                    )
                    raw_tpl = (
                        (
                            generated_page.get("selectedTemplate")
                            if isinstance(generated_page, dict)
                            else None
                        )
                        or (
                            generated_page.get("selected_template")
                            if isinstance(generated_page, dict)
                            else None
                        )
                        or (
                            generation_data.get("selectedTemplate")
                            if isinstance(generation_data, dict)
                            else None
                        )
                        or (
                            generation_data.get("selected_template")
                            if isinstance(generation_data, dict)
                            else None
                        )
                        or 1
                    )
                    try:
                        page_template = int(raw_tpl) if raw_tpl else 1
                    except (TypeError, ValueError):
                        page_template = 1
                    if page_template not in {1, 2}:
                        page_template = 1
                    selected_color = (
                        (generation_data.get("style_preferences") or {}).get(
                            "selected_color"
                        )
                        or (generation_data.get("stylePreferences") or {}).get(
                            "dynamicColor"
                        )
                        or data.get("dynamicColor")
                        or None
                    )
                    logger.info(
                        f"publish-store: binding premium PDP to {len(cod_pages)} "
                        f"featured product(s) (market={market_type}); "
                        f"other products keep simple product.json"
                    )
                    for entry in cod_pages:
                        bind_res = _bind_cod_premium_product_to_shopify(
                            product_entry=entry,
                            category=str(page_category),
                            selected_template=page_template,
                            selected_color=selected_color,
                            user_id=user_id,
                            theme_id=str(live_theme_id) if live_theme_id else None,
                        )
                        if bind_res.get("success"):
                            logger.info(
                                f"✅ publish-store COD: assigned {bind_res.get('template')} "
                                f"to product {bind_res.get('product_id')}"
                            )
                        else:
                            logger.warning(
                                f"⚠️ publish-store COD: failed binding product "
                                f"{bind_res.get('product_id')}: {bind_res.get('error')}"
                            )
            except Exception as cod_bind_err:
                logger.error(
                    f"publish-store COD: error binding premium PDPs: {cod_bind_err}"
                )

        # 4) Mark generated page published, set theme_id (Kluck theme assets were pushed to), and sync store
        if page_id and upload_success:
            try:
                logger.info(f"publish-store: marking page_id={page_id} as published")
                mark_ok = document_store.update_generated_page(
                    page_id=str(page_id),
                    published=True,
                    is_enabled=True,
                    publish_status="completed",
                    publish_error="",
                    **({"theme_id": str(live_theme_id)} if live_theme_id else {}),
                )
                if live_theme_id:
                    logger.info(
                        f"publish-store: set generated page theme_id={live_theme_id} "
                        f"(theme where Kluck assets were pushed)"
                    )
                if mark_ok:
                    logger.info(
                        f"✅ publish-store: marked page_id={page_id} as published"
                    )
                else:
                    logger.warning(
                        f"⚠️ publish-store: failed to mark page_id={page_id} as published"
                    )

                if live_theme_id:
                    store = document_store.get_user_primary_store(user_id)
                    if store:
                        store_id = store.get("PK")
                        document_store.stores_table_ref.update_item(
                            Key={"PK": store_id},
                            UpdateExpression=(
                                "SET duplicated_theme_id = :tid, updated_at = :updated_at"
                            ),
                            ExpressionAttributeValues={
                                ":tid": str(live_theme_id),
                                ":updated_at": document_store._get_timestamp(),
                            },
                        )
                        logger.info(
                            f"✅ publish-store: stored duplicated_theme_id={live_theme_id} on store {store_id}"
                        )
                    else:
                        logger.warning(
                            "publish-store: no primary store found; skipped duplicated_theme_id update"
                        )
            except Exception as pub_err:
                logger.error(
                    f"publish-store: error marking page published / syncing theme: {pub_err}"
                )

        # Best-effort: confirm templates/index.json is present/readable; re-upload if not.
        # Does not block themePublish (go-live).
        index_json_verified = True
        index_json_verify_error = None
        if upload_success and live_theme_id:
            index_local = mode_dir / "index.json"
            if index_local.exists():
                max_index_attempts = 3
                index_json_verified = False
                for attempt in range(max_index_attempts):
                    ok, err_msg = _index_json_readable_on_theme(
                        shopify_utils, str(live_theme_id), user_id
                    )
                    if ok:
                        index_json_verified = True
                        index_json_verify_error = None
                        if attempt == 0:
                            logger.info(
                                "publish-store: templates/index.json present on theme before go-live"
                            )
                        else:
                            logger.info(
                                "publish-store: templates/index.json present after re-upload "
                                f"(attempt {attempt + 1}/{max_index_attempts})"
                            )
                        break

                    index_json_verify_error = err_msg
                    logger.warning(
                        f"publish-store: index.json not readable on theme "
                        f"(attempt {attempt + 1}/{max_index_attempts}): {err_msg}"
                    )
                    if attempt >= max_index_attempts - 1:
                        logger.warning(
                            "publish-store: index.json still not readable after "
                            f"{max_index_attempts} attempt(s); proceeding with themePublish anyway"
                        )
                        break

                    up_ok, up_err = _upload_templates_index_json(
                        shopify_utils,
                        str(live_theme_id),
                        user_id,
                        index_local,
                    )
                    if not up_ok:
                        index_json_verify_error = (
                            f"{err_msg}; re-upload failed: {up_err}"
                        )
                        logger.error(
                            f"publish-store: re-upload templates/index.json failed: {up_err}"
                        )
                    else:
                        logger.info(
                            "publish-store: re-uploaded templates/index.json; "
                            "waiting before re-check"
                        )
                        if "index.json" not in uploaded_files:
                            uploaded_files.append("index.json")
                        time.sleep(1.5)
            else:
                index_json_verified = False
                index_json_verify_error = (
                    "store template index.json not found on disk; skipped post-upload check"
                )
                logger.warning(
                    "publish-store: no local index.json — skipped presence check on theme"
                )

        theme_made_live = False
        theme_publish_error = None
        should_publish_live = bool(
            live_theme_id and (upload_success or duplicated_theme_this_run)
        )
        if should_publish_live:
            if not upload_success and duplicated_theme_this_run:
                logger.warning(
                    "publish-store: proceeding to make duplicated theme live despite upload partial failures"
                )
            try:
                publish_live_result = shopify_utils.publish_theme_live(
                    theme_id=str(live_theme_id),
                    user_id=user_id,
                )
                if publish_live_result.get("success"):
                    theme_made_live = True
                    logger.info(
                        f"publish-store: theme {live_theme_id} is now the live storefront theme"
                    )
                else:
                    theme_publish_error = publish_live_result.get(
                        "error", "Unknown error"
                    )
                    logger.warning(
                        f"publish-store: themePublish failed for theme_id={live_theme_id}: "
                        f"{theme_publish_error}"
                    )
            except Exception as live_err:
                theme_publish_error = str(live_err)
                logger.warning(
                    f"publish-store: themePublish raised for theme_id={live_theme_id}: {live_err}"
                )

        # Persist published state on the store record for backend status checks.
        if theme_made_live:
            try:
                document_store.stores_table_ref.update_item(
                    Key={"PK": user_id},
                    UpdateExpression=(
                        "SET published = :published, updated_at = :updated_at"
                    ),
                    ExpressionAttributeValues={
                        ":published": True,
                        ":updated_at": document_store._get_timestamp(),
                    },
                )
                logger.info(
                    "publish-store: persisted published=True for user %s",
                    user_id,
                )
            except Exception as store_publish_db_error:
                logger.warning(
                    "publish-store: failed to persist published flag on store: %s",
                    store_publish_db_error,
                )

        shop_domain = user_id.split(".")[0]
        preview_link = f"https://admin.shopify.com/store/{shop_domain}/themes/{live_theme_id}/editor"

        payload = {
            "success": upload_success,
            "mode": mode,
            "theme_id": live_theme_id,
            "uploaded_files": uploaded_files,
            "preview_link": preview_link,
            "theme_made_live": theme_made_live,
            "index_json_verified": index_json_verified,
        }
        if theme_publish_error:
            payload["theme_publish_error"] = theme_publish_error
        if index_json_verify_error and not index_json_verified:
            payload["index_json_verify_error"] = index_json_verify_error
        if not upload_success:
            payload["partial_failure"] = True
            payload["message"] = (
                "Theme was selected but one or more assets or optional steps failed; "
                "check uploaded_files and server logs."
            )

        from app.modules.generate.store.pack_utils import store_theme_name

        _premium_ids = (
            generation_data.get("premium_product_ids")
            or generation_data.get("premiumProductIds")
            or []
        )
        _includes_premium = bool(
            (isinstance(_premium_ids, list) and _premium_ids)
            or generation_data.get("product_pages")
            or generation_data.get("product_page")
        )
        _published_template = (
            generation_data.get("selectedTemplate")
            or generation_data.get("selected_template")
            or data.get("selectedTemplate")
            or 1
        )
        posthog_client.capture(
            "store_published",
            distinct_id=user_id,
            properties={
                "theme_name": store_theme_name(
                    mode, store_template_pack, _published_template, _includes_premium
                ),
                "store_template_pack": store_template_pack,
                "template": _published_template,
                "theme_id": live_theme_id,
                "store_page_id": page_id,
                "theme_made_live": theme_made_live,
                "index_json_verified": index_json_verified,
                "mode": mode,
                "store_type": (
                    "single" if mode == "single_product" else "multi"
                ),
                "market_type": market_type,
            },
        )
        posthog_client.set_once(distinct_id=user_id, properties={"theme_pushed": True})

        if page_id:
            extra = {"preview_link": preview_link}
            if live_theme_id:
                extra["theme_id"] = str(live_theme_id)
            if upload_success:
                extra["published"] = True
                _set_page_publish_status(
                    page_id, "completed", extra=extra
                )
            else:
                _set_page_publish_status(
                    page_id,
                    "failed",
                    error=payload.get("message")
                    or "Theme was selected but one or more assets failed",
                    extra=extra,
                )
        return payload

    except Exception as e:
        logger.error(f"Error in publish_store: {str(e)}")
        raise


@shopify_core_bp.route("/api/publish-store", methods=["POST"])
@require_shopify_auth
def publish_store():
    try:
        user_id = request.user_id
        data = request.get_json(force=True) or {}

        try:
            shop = document_store.get_shop_details(user_id)
            skip_publish_store_purchase_gate = shop_skips_credit_gates(shop)
        except Exception:
            skip_publish_store_purchase_gate = False

        if not skip_publish_store_purchase_gate:
            active_purchases = wallet_service.list_purchases_for_user(
                user_id, limit=1, status=PURCHASE_STATUS_ACTIVE
            )
            if not active_purchases:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": (
                                "To publish your entire store, please purchase a credit pack first."
                            ),
                            "code": "purchase_required",
                        }
                    ),
                    402,
                )

        page_id = data.get("page_id") or data.get("pageId")
        if not page_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Missing page or generation data. Save your template preview or run generation again.",
                    }
                ),
                400,
            )

        existing_page = document_store.get_generated_page_by_id(str(page_id))
        if not existing_page:
            return (
                jsonify({"success": False, "error": "Generated page not found"}),
                404,
            )

        current_publish_status = str(
            existing_page.get("publish_status") or ""
        ).strip().lower()
        if current_publish_status == "in_progress":
            return (
                jsonify(
                    {
                        "success": True,
                        "started": True,
                        "page_id": str(page_id),
                        "message": "Store publish already in progress",
                    }
                ),
                202,
            )

        _set_page_publish_status(page_id, "in_progress", extra={"published": False})

        publish_thread = threading.Thread(
            target=_run_publish_store_task,
            args=(user_id, data),
            daemon=True,
        )
        publish_thread.start()
        logger.info(
            "Started background publish-store task for page_id=%s user=%s",
            page_id,
            user_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "started": True,
                    "page_id": str(page_id),
                    "message": "Store publish started in background",
                }
            ),
            202,
        )
    except Exception as e:
        logger.error(f"Error starting publish_store: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/publish-page", methods=["POST"])
@require_shopify_auth
def publish_page():
    """
    Publish store with all configuration details from the store setup flow
    """
    try:
        user_id = request.user_id

        # Get all the data from the request
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Extract key data
        # Prefer explicit product_id from request payload.
        product_id = (
            data.get("product_id")
            or data.get("uploaded_product_id")
            or data.get("shopify_config", {}).get("product_id")
        )
        if isinstance(product_id, str) and product_id.strip().lower() in {
            "not provided",
            "null",
            "",
        }:
            product_id = None
        page_id = data.get("page_id")
        magic_response = data.get("magic_response")

        generated_page = document_store.get_generated_page_by_id(str(page_id))
        detected_category = generated_page.get("category")
        if not detected_category:
            # Update page_id to mark it as published and update generated content
            detected_category = data.get("detected_category", "Not provided")
        # Template selection (1 or 2), same as generation
        selected_template = _parse_template_number(
            generated_page.get("selectedTemplate")
        )
        if selected_template is None:
            selected_template = _parse_template_number(
                data.get("selectedTemplate", 2)
            )
        if selected_template is None:
            selected_template = 2
        assigned_template_suffix = None
        selected_color = (
            data.get("selected_color")
            or (magic_response.get("selected_color") if magic_response else None)
            or (
                magic_response.get("color_schemes", [None])[0]
                if magic_response and magic_response.get("color_schemes")
                else None
            )
        )

        # STEP 1: Get live theme ID
        # We use the live/main theme directly for all operations
        # This must be done before any file uploads or theme operations
        live_theme_id = None
        has_published_generations = document_store.has_published_generations(user_id)
        try:
            logger.info("STEP 1: Getting live theme ID")
            live_theme_result = shopify_utils.get_live_theme(user_id)

            if live_theme_result.get("success") and live_theme_result.get("theme"):
                live_theme_id = live_theme_result["theme"].get("id")
                live_theme_name = live_theme_result["theme"].get("name", "Main Theme")
                logger.info(
                    f"✅ Current live theme found: {live_theme_name} (ID: {live_theme_id})"
                )
            else:
                error_msg = live_theme_result.get("error", "Unknown error")
                logger.error(f"⚠️ Failed to get live theme: {error_msg}")
                raise Exception(f"Failed to get live theme: {error_msg}")
        except Exception as theme_error:
            logger.error(f"Error getting live theme: {str(theme_error)}")
            # This is critical - we cannot proceed without a live theme
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Failed to get live theme: {str(theme_error)}",
                    }
                ),
                500,
            )

        # All theme file operations target the shop's live (main) theme only.
        store = document_store.get_user_primary_store(user_id)
        live_theme_numeric_id = shopify_utils._from_gid(live_theme_id)
        stored_theme_for_uploads = (store or {}).get("live_theme_id")
        if (
            stored_theme_for_uploads is not None
            and str(stored_theme_for_uploads) != str(live_theme_numeric_id)
        ):
            document_store.reset_template_upload_metadata(user_id)
            store = document_store.get_user_primary_store(user_id)
        # return jsonify({"success": True, "live_theme_id": live_theme_id}), 200

        # Snapshot original product content (title/description/images) + theme id
        # so user can revert later. Save only once per generated page.
        if page_id and product_id:
            try:
                existing_page = document_store.get_generated_page_by_id(str(page_id))
                if not isinstance(existing_page, dict):
                    logger.warning(
                        f"Generated page not found for page_id={page_id}. Skipping original_content snapshot."
                    )
                    existing_page = None
                already_has_original = (
                    isinstance(existing_page, dict)
                    and isinstance(existing_page.get("original_content"), dict)
                    and bool(existing_page.get("original_content"))
                )

                if already_has_original:
                    logger.info(
                        f"original_content already exists for page_id={page_id}. Skipping snapshot."
                    )
                elif isinstance(existing_page, dict):
                    logger.info(
                        f"Capturing original product content for revert (page_id={page_id}, product_id={product_id})"
                    )
                    product_details = shopify_utils.get_product(
                        product_id=str(product_id),
                        user_id=user_id,
                    )

                    # Download original Shopify CDN image URLs, upload to S3, then store S3 URLs
                    # (avoids relying on Shopify-hosted URLs for future restores).
                    s3_image_urls = []
                    s3_images_meta = []
                    try:
                        source_images_meta = product_details.get("images_meta")
                        if (
                            not isinstance(source_images_meta, list)
                            or not source_images_meta
                        ):
                            source_images_meta = [
                                {"url": u, "alt_text": ""}
                                for u in (product_details.get("images") or [])
                            ]

                        snapshot_tmp_dir = tempfile.mkdtemp()
                        try:
                            for idx, img in enumerate(source_images_meta):
                                if not isinstance(img, dict):
                                    continue
                                src_url = img.get("url")
                                if not isinstance(src_url, str) or not (
                                    src_url.startswith("http://")
                                    or src_url.startswith("https://")
                                ):
                                    continue

                                alt_text = img.get("alt_text") or ""
                                final_url = src_url

                                parsed = urlparse(src_url)
                                ext = os.path.splitext(parsed.path or "")[1] or ".jpg"
                                local_path = os.path.join(
                                    snapshot_tmp_dir, f"original_product_{idx}{ext}"
                                )

                                try:
                                    resp = requests.get(src_url, timeout=20)
                                    resp.raise_for_status()
                                    with open(local_path, "wb") as f:
                                        f.write(resp.content)
                                except Exception as dl_err:
                                    logger.warning(
                                        f"Failed downloading original image idx={idx} url={src_url}: {dl_err}"
                                    )
                                else:
                                    # Upload single image (keeps mapping stable)
                                    urls = upload_images_to_cdn([local_path])
                                    if urls and urls[0]:
                                        final_url = urls[0]

                                s3_image_urls.append(final_url)
                                s3_images_meta.append(
                                    {"url": final_url, "alt_text": alt_text}
                                )
                        finally:
                            try:
                                logger.info(
                                    f"Cleaning up temp directory after snapshot for user {user_id}: {snapshot_tmp_dir}"
                                )
                                cleanup_temp_directory(snapshot_tmp_dir)
                                logger.info(
                                    f"Temp directory cleaned up after snapshot for user {user_id}: {snapshot_tmp_dir}"
                                )
                            except Exception as e:
                                logger.error(
                                    f"Error cleaning up temp directory: {str(e)}"
                                )
                    except Exception as s3_snap_err:
                        logger.warning(
                            f"Error uploading original product images to S3 for page_id={page_id}: {s3_snap_err}",
                            exc_info=True,
                        )

                    original_content = {
                        "captured_at": datetime.now(timezone.utc).isoformat(),
                        "product_id": str(product_details.get("id") or product_id),
                        "title": product_details.get("title"),
                        "description": product_details.get("description"),
                        "description_html": product_details.get("description_html"),
                        "template_suffix": product_details.get("template_suffix"),
                        "images": (
                            s3_image_urls
                            if s3_image_urls
                            else (product_details.get("images") or [])
                        ),
                        "images_meta": (
                            s3_images_meta
                            if s3_images_meta
                            else (product_details.get("images_meta") or [])
                        ),
                        "theme_id": (
                            str(live_theme_numeric_id)
                            if live_theme_numeric_id
                            else None
                        ),
                        "theme_gid": str(live_theme_id) if live_theme_id else None,
                    }
                    snapshot_saved = document_store.update_generated_page(
                        page_id=str(page_id),
                        original_content=original_content,
                    )
                    if snapshot_saved:
                        logger.info(
                            f"✅ Stored original_content snapshot for page_id={page_id}"
                        )
                    else:
                        logger.warning(
                            f"⚠️ Failed to store original_content snapshot for page_id={page_id}"
                        )
            except Exception as snapshot_error:
                logger.warning(
                    f"Error capturing/storing original_content for page_id={page_id}: {snapshot_error}",
                    exc_info=True,
                )
        # Use the generated content from magic_response instead of generating again
        generated_content = None
        if magic_response:
            try:
                # The magic_response should already contain the generated content
                generated_content = magic_response
                logger.info(
                    f"Using generated content from magic_response for user {user_id}"
                )
            except Exception as e:
                logger.error(f"Failed to process magic_response: {e}")
                # Continue without generated content
        else:
            logger.warning(
                "No magic_response provided, skipping template content update"
            )

        # Process product and images
        try:
            # Create temporary directory
            temp_dir = tempfile.mkdtemp()

            # Create new product (only when product_id is missing) OR update existing product
            new_product_id = None
            if generated_content and "images" in generated_content:
                try:
                    # Initialize image upload handler
                    image_handler = ImageUploadHandler()

                    if product_id:
                        logger.info(
                            f"Updating existing product {product_id}: replacing images and updating title/description"
                        )
                        update_result = (
                            image_handler.update_existing_product_with_images(
                                product_id=str(product_id),
                                magic_response=generated_content,
                                user_id=user_id,
                                replace_images=True,
                            )
                        )
                        if not update_result.get("success"):
                            logger.warning(
                                f"⚠️ Failed to update existing product {product_id}: {update_result.get('error')}"
                            )
                    else:
                        logger.info(
                            "No product_id provided; creating new product with generated content and images"
                        )
                        new_product_id = image_handler.create_new_product_with_images(
                            magic_response=generated_content, user_id=user_id
                        )

                        if new_product_id:
                            logger.info(
                                f"✅ Successfully created new product with ID: {new_product_id}"
                            )
                            # Update product_id to use the new product
                            product_id = new_product_id

                            # Update generated page metadata with new_product_id if page_id is available
                            if page_id:
                                try:
                                    logger.info(
                                        f"Updating page_id={page_id} with new_product_id={new_product_id}"
                                    )
                                    metadata_update_success = (
                                        document_store.update_generated_page(
                                            page_id=page_id,
                                            metadata={
                                                "new_product_id": str(new_product_id)
                                            },
                                        )
                                    )
                                    if metadata_update_success:
                                        logger.info(
                                            f"✅ Successfully updated page_id={page_id} with new_product_id={new_product_id}"
                                        )
                                    else:
                                        logger.warning(
                                            f"⚠️ Failed to update page_id={page_id} with new_product_id, but continuing"
                                        )
                                except Exception as metadata_error:
                                    logger.error(
                                        f"Error updating page metadata with new_product_id: {str(metadata_error)}"
                                    )
                                    # Continue execution even if metadata update fails

                        else:
                            logger.warning(
                                "⚠️ Failed to create new product, using original product ID"
                            )

                except Exception as product_error:
                    logger.error(f"Error creating new product: {str(product_error)}")
                    # Continue with original product_id if new product creation fails

            # Clean up temp directory
            shutil.rmtree(temp_dir)

            # Product-page template binding is intentionally skipped.
            # Store publish now focuses only on the homepage template.

            # Publish product to Online Store
            if product_id and product_id != "Not provided":
                try:
                    publish_result = shopify_utils.publish_product_to_online_store(
                        product_id=product_id, user_id=user_id
                    )

                    if publish_result.get("success", True):
                        logger.info(
                            f"Successfully published product {product_id} to Online Store"
                        )
                    else:
                        logger.warning(
                            f"Failed to publish product to Online Store: {publish_result.get('error', 'Unknown error')}"
                        )

                except Exception as publish_error:
                    logger.error(
                        f"Error publishing product to Online Store: {str(publish_error)}"
                    )
                    # Continue execution even if publishing fails

            # Upload body images to Shopify and get file references
            body_image_metafields = {}
            if product_id and product_id != "Not provided" and generated_content:
                try:
                    # Extract body images (including logos) from generated_content
                    images_dict = generated_content.get("images", {})
                    body_images = (
                        images_dict.get("body_images", {})
                        if isinstance(images_dict, dict)
                        else {}
                    )

                    if body_images and isinstance(body_images, dict):
                        logger.info(
                            f"Uploading {len(body_images)} body images to Shopify content files"
                        )

                        for image_key, image_url in body_images.items():
                            if not isinstance(image_url, str) or not (
                                image_url.startswith("http://")
                                or image_url.startswith("https://")
                            ):
                                continue

                            try:
                                # Generate filename based on image key
                                ext = image_url.split(".")[-1]
                                filename = f"kluck_ai_{image_key}.{ext}"

                                # Upload image to Shopify
                                upload_result = shopify_utils.upload_image_to_shopify(
                                    image_url=image_url,
                                    filename=filename,
                                    alt_text=f"Kluck AI {image_key.replace('_', ' ').title()}",
                                    user_id=user_id,
                                )

                                if upload_result.get("success") and upload_result.get(
                                    "file_id"
                                ):
                                    # Use file_id (GID) as the file reference
                                    file_id = upload_result.get("file_id")
                                    body_image_metafields[image_key] = file_id
                                else:
                                    logger.warning(
                                        f"⚠️ Failed to upload {image_key}: {upload_result.get('error', 'Unknown error')}"
                                    )

                            except Exception as upload_error:
                                logger.error(
                                    f"Error uploading body image {image_key}: {str(upload_error)}"
                                )
                                continue
                    else:
                        logger.warning("No body images found in generated_content")

                except Exception as body_image_error:
                    logger.error(
                        f"Error processing body images: {str(body_image_error)}"
                    )
                    # Continue execution even if body image upload fails

            # Set product metafields with generated text content
            if product_id and product_id != "Not provided" and generated_content:
                try:
                    # Extract text content from generated_content
                    text_content = (
                        generated_content.get("text")
                        if isinstance(generated_content, dict)
                        else None
                    )

                    if text_content:
                        logger.info(
                            f"Setting product metafields for product {product_id} with generated text content"
                        )
                        metafields_result = shopify_utils.set_product_metafields_bulk(
                            product_id=product_id,
                            fields=text_content,
                            user_id=user_id,
                            namespace="kluck_ai",
                        )

                        if metafields_result.get("success"):
                            logger.info(
                                f"✅ Successfully set {metafields_result.get('metafields_count', 0)} text metafields on product {product_id}"
                            )
                        else:
                            logger.warning(
                                f"⚠️ Failed to set product metafields: {metafields_result.get('error', 'Unknown error')}"
                            )
                            if metafields_result.get("user_errors"):
                                logger.warning(
                                    f"Metafield user errors: {metafields_result.get('user_errors')}"
                                )
                    else:
                        logger.warning(
                            "No text content found in generated_content, skipping text metafields"
                        )

                except Exception as metafield_error:
                    logger.error(
                        f"Error setting product metafields: {str(metafield_error)}"
                    )
                    # Continue execution even if metafields setting fails

            # Set color schema metafield
            if product_id and product_id != "Not provided" and selected_color:
                try:
                    logger.info(
                        f"Setting color schema metafield for product {product_id} with color {selected_color}"
                    )
                    color_metafield_result = shopify_utils.set_product_metafields_bulk(
                        product_id=product_id,
                        fields={"color_schema": selected_color},
                        user_id=user_id,
                        namespace="kluck_ai",
                    )

                    if color_metafield_result.get("success"):
                        logger.info(
                            f"✅ Successfully set color schema metafield on product {product_id}"
                        )
                    else:
                        logger.warning(
                            f"⚠️ Failed to set color schema metafield: {color_metafield_result.get('error', 'Unknown error')}"
                        )
                        if color_metafield_result.get("user_errors"):
                            logger.warning(
                                f"Color metafield user errors: {color_metafield_result.get('user_errors')}"
                            )
                except Exception as color_metafield_error:
                    logger.error(
                        f"Error setting color schema metafield: {str(color_metafield_error)}"
                    )
                    # Continue execution even if color metafield setting fails

            # Set body image metafields as file_reference type
            if product_id and product_id != "Not provided" and body_image_metafields:
                try:
                    logger.info(
                        f"Setting {len(body_image_metafields)} body image metafields as file_reference on product {product_id}"
                    )

                    # Set file_reference metafields
                    file_metafields_result = (
                        shopify_utils.set_product_file_metafields_bulk(
                            product_id=product_id,
                            file_references=body_image_metafields,
                            user_id=user_id,
                            namespace="kluck_ai",
                        )
                    )

                    if file_metafields_result.get("success"):
                        logger.info(
                            f"✅ Successfully set {file_metafields_result.get('metafields_count', 0)} file_reference metafields on product {product_id}"
                        )
                    else:
                        logger.warning(
                            f"⚠️ Failed to set file_reference metafields: {file_metafields_result.get('error', 'Unknown error')}"
                        )
                        if file_metafields_result.get("user_errors"):
                            logger.warning(
                                f"File metafield user errors: {file_metafields_result.get('user_errors')}"
                            )

                except Exception as file_metafield_error:
                    logger.error(
                        f"Error setting file_reference metafields: {str(file_metafield_error)}"
                    )
                    # Continue execution even if file metafields setting fails

            # STEP 2: Upload shared section liquids. The product template itself
            # is a per-product copy, uploaded when the product is bound below.
            template_category, _, _ = _get_template_paths(
                detected_category, selected_template
            )
            metadata_key = f"{template_category}_{selected_template}"

            # Get user's store to check if this (category, template) already uploaded
            uploaded_template = store.get("uploaded_template", {}) if store else {}
            if not isinstance(uploaded_template, dict):
                uploaded_template = {}

            template_already_uploaded = metadata_key in uploaded_template

            if live_theme_numeric_id:
                try:
                    if template_already_uploaded:
                        logger.info(
                            f"Store marks '{template_category}' template {selected_template} as uploaded; "
                            "verifying each asset on live theme (skip if present)."
                        )
                    else:
                        logger.info(
                            f"Syncing Kluck assets for '{template_category}' template {selected_template} "
                            "to live theme (skip per file if already present)."
                        )

                    base_dir = Path(__file__).parent.parent.parent.parent.parent
                    shopify_files_dir = base_dir / "data" / "assets" / "shopify_files"
                    liquid_files_dir = shopify_files_dir / "liquid_files"

                    upload_success = True
                    uploaded_files = []

                    # 1) Push all liquid files from liquid_files folder to theme sections
                    if liquid_files_dir.exists():
                        liquid_files = list(liquid_files_dir.glob("*.liquid"))
                        for liquid_path in liquid_files:
                            liquid_file = liquid_path.name
                            asset_key = f"sections/{liquid_file}"
                            force_update = _should_force_update_section(liquid_file)
                            if not force_update:
                                check_result = shopify_utils.get_theme_asset(
                                    theme_id=live_theme_numeric_id,
                                    asset_key=asset_key,
                                    user_id=user_id,
                                )
                                if check_result.get("exists"):
                                    logger.info(
                                        f"✅ {liquid_file} already exists in theme. Skipping upload."
                                    )
                                    uploaded_files.append(liquid_file)
                                    continue
                            reason = " (force update)" if force_update else ""
                            logger.info(
                                f"Uploading {liquid_file} to {asset_key}{reason}"
                            )
                            upload_result = shopify_utils.update_theme_asset(
                                theme_id=live_theme_numeric_id,
                                file_path=str(liquid_path),
                                asset_key=asset_key,
                                user_id=user_id,
                            )
                            if upload_result.get("success"):
                                logger.info(
                                    f"✅ Successfully uploaded {liquid_file}"
                                )
                                uploaded_files.append(liquid_file)
                            else:
                                logger.warning(
                                    f"⚠️ Failed to upload {liquid_file}: {upload_result.get('error')}"
                                )
                                upload_success = False
                    else:
                        logger.warning(
                            f"⚠️ liquid_files folder not found: {liquid_files_dir}"
                        )

                    # UI i18n snippet (Add to cart / review blanks follow store locale).
                    ui_snippet = (
                        shopify_files_dir / "snippet_files" / "kluck-ui-string.liquid"
                    )
                    if ui_snippet.exists():
                        ui_upload = shopify_utils.update_theme_asset(
                            theme_id=live_theme_numeric_id,
                            file_path=str(ui_snippet),
                            asset_key="snippets/kluck-ui-string.liquid",
                            user_id=user_id,
                        )
                        if ui_upload.get("success"):
                            uploaded_files.append("kluck-ui-string.liquid")
                        else:
                            logger.warning(
                                "⚠️ Failed to upload kluck-ui-string: %s",
                                ui_upload.get("error"),
                            )

                    # Product templates are uploaded per product below.
                    # Do not write product.kluck-{category}-1.json / -2.json here:
                    # those shared files are what made a later product open another
                    # product's template.

                    # Store upload metadata per (category, template)
                    if upload_success and uploaded_files and live_theme_numeric_id:
                        try:
                            db_result = (
                                document_store.update_template_upload_metadata(
                                    fk_user_id=user_id,
                                    category=template_category,
                                    template=selected_template,
                                    live_theme_id=str(live_theme_numeric_id),
                                )
                            )
                            if db_result:
                                logger.info(
                                    f"✅ Stored template upload metadata for '{template_category}' template {selected_template}"
                                )
                            else:
                                logger.warning(
                                    "⚠️ Failed to store template upload metadata"
                                )
                        except Exception as db_error:
                            logger.error(
                                f"Error storing template upload metadata: {str(db_error)}"
                            )
                except Exception as upload_error:
                    logger.error(f"Error uploading theme files: {str(upload_error)}")
                    # Continue execution even if file upload fails
            else:
                logger.warning(
                    "⚠️ Cannot upload theme files: live theme ID not available"
                )

            # STEP 2.5: Copy the chosen layout onto this product's own template.
            if product_id and product_id != "Not provided":
                try:
                    template_bind_result = _publish_unique_product_template(
                        category=detected_category,
                        product_id=str(product_id),
                        selected_template=selected_template,
                        theme_id=live_theme_numeric_id,
                        user_id=user_id,
                    )
                    if template_bind_result.get("success"):
                        assigned_template_suffix = template_bind_result.get(
                            "template_suffix"
                        )
                        logger.info(
                            "✅ Assigned template %s to product %s",
                            template_bind_result.get("template_file"),
                            product_id,
                        )
                    else:
                        logger.warning(
                            "⚠️ Failed assigning template %s to product %s: %s",
                            template_bind_result.get("template_file"),
                            product_id,
                            template_bind_result.get("error", "Unknown error"),
                        )
                except Exception as template_bind_error:
                    logger.error(
                        "Error assigning template to product %s: %s",
                        product_id,
                        template_bind_error,
                    )

            # Generate preview link (Shopify admin theme editor URL)
            preview_link = None
            if product_id and product_id != "Not provided" and live_theme_numeric_id:
                try:
                    # Get product details to retrieve handle
                    product_details = shopify_utils.get_product(product_id, user_id)
                    product_handle = product_details.get("handle")

                    if product_handle:
                        # Get shop name from credentials
                        credentials = shopify_utils._get_user_credentials(user_id)
                        shop_domain = extract_shop_name(credentials.get("shop_url", ""))

                        preview_template_suffix = (
                            assigned_template_suffix
                            or _stored_or_legacy_template_suffix(
                                generated_page, detected_category, selected_template
                            )
                        )

                        # Extract theme ID (handle both numeric and GID formats)
                        theme_id = str(live_theme_numeric_id)
                        if "/" in theme_id:
                            # If it's a GID, extract the numeric part
                            theme_id = theme_id.split("/")[-1]

                        # Build admin theme editor URL
                        # Format: https://admin.shopify.com/store/{shop-name}/themes/{theme-id}/editor?previewPath=%2Fproducts%2F{handle}%3Fview%3D{template-suffix}
                        preview_path = (
                            f"/products/{product_handle}?view={preview_template_suffix}"
                        )
                        encoded_path = quote(preview_path, safe="")

                        preview_link = f"https://admin.shopify.com/store/{shop_domain}/themes/{theme_id}/editor?previewPath={encoded_path}"
                        logger.info(f"Generated admin preview link: {preview_link}")
                    else:
                        logger.warning(
                            "Product handle not found, cannot generate admin preview link"
                        )
                except Exception as preview_error:
                    logger.error(
                        f"Error generating admin preview link: {str(preview_error)}"
                    )
                    # Fallback to regular product URL
                    credentials = shopify_utils._get_user_credentials(user_id)
                    shop_domain = extract_shop_name(credentials.get("shop_url", ""))
                    if shop_domain and not shop_domain.endswith(".myshopify.com"):
                        if not shop_domain.endswith(".com"):
                            shop_domain = f"{shop_domain}.myshopify.com"
                    preview_link = f"https://{shop_domain}" if shop_domain else None

            if not preview_link:
                # Fallback if we don't have required info
                credentials = shopify_utils._get_user_credentials(user_id)
                shop_domain = extract_shop_name(credentials.get("shop_url", ""))
                if shop_domain and not shop_domain.endswith(".myshopify.com"):
                    if not shop_domain.endswith(".com"):
                        shop_domain = f"{shop_domain}.myshopify.com"
                preview_link = f"https://{shop_domain}" if shop_domain else None

        except Exception as e:
            # Clean up temp directory on error
            if "temp_dir" in locals():
                shutil.rmtree(temp_dir)
            raise e

        # Update page_id to mark it as published
        if page_id:
            try:
                logger.info(f"Marking page_id={page_id} as published")
                # Store theme_id in metadata when publishing
                update_params = {
                    "page_id": page_id,
                    "published": True,
                    "is_enabled": True,
                }
                if live_theme_numeric_id:
                    update_params["metadata"] = {
                        "theme_id": str(live_theme_numeric_id)
                    }
                if assigned_template_suffix:
                    update_params["kluck_template_suffix"] = assigned_template_suffix
                    logger.info(
                        f"Storing theme_id={live_theme_numeric_id} in page metadata (live theme)"
                    )
                if selected_template in (1, 2, 3):
                    update_params["selectedTemplate"] = selected_template
                    update_params["template"] = f"template_{selected_template}"

                update_success = document_store.update_generated_page(**update_params)
                if update_success:
                    logger.info(
                        f"✅ Successfully marked page_id={page_id} as published"
                    )
                else:
                    logger.warning(
                        f"⚠️ Failed to mark page_id={page_id} as published, but continuing"
                    )

                # Update generated content with magic_response if provided
                if magic_response:
                    try:
                        logger.info(
                            f"Updating generated content for page_id={page_id} with magic_response"
                        )
                        content_update_success = document_store.update_generated_page(
                            page_id=page_id, generation_data=magic_response, step=2
                        )
                        if content_update_success:
                            logger.info(
                                f"✅ Successfully updated generated content for page_id={page_id}"
                            )
                        else:
                            logger.warning(
                                f"⚠️ Failed to update generated content for page_id={page_id}, but continuing"
                            )
                    except Exception as content_update_error:
                        logger.error(
                            f"Error updating generated content for page_id={page_id}: {str(content_update_error)}"
                        )
                        # Don't fail the entire request if content update fails
                else:
                    logger.warning(
                        "No magic_response provided, skipping generated content update"
                    )

            except Exception as page_update_error:
                logger.error(
                    f"Error updating page published status for page_id={page_id}: {str(page_update_error)}"
                )
                # Don't fail the entire request if page update fails
        else:
            logger.warning("No page_id provided, skipping published status update")

        # Return success with preview link

        try:
            # Check if user has any existing pages
            logger.info(f"has_published_generations: {has_published_generations}")
            # if user has no published generations
            if not has_published_generations:
                try:
                    shop = document_store.get_shop_details(user_id)
                    shopify_domain = shop.get("PK")
                    people_id = shop.get("crisp_people_id")
                    if not people_id:
                        logger.info(f"people_id not found for {shopify_domain}")
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
                        people_id = response.get("people_id")
                        if people_id:
                            logger.info(
                                f"updating in store detail - crisp people_id for {shopify_domain}: {people_id}"
                            )
                            document_store.update_shop_details(
                                user_id, {"crisp_people_id": people_id}
                            )

                    if people_id:
                        logger.info(
                            f"crisp people_id for {shopify_domain}: {people_id}"
                        )
                        event_response = crisp_client.send_event(
                            people_id,
                            {
                                "text": "app:first-page-created",
                                "data": {
                                    "store_domain": shopify_domain,
                                    "email": shop.get("email"),
                                },
                                "color": "green",
                            },
                        )
                        logger.info(
                            f"crisp event response for {shopify_domain}: {event_response}"
                        )

                except Exception as crisp_error:
                    logger.error(f"Error adding user profile to Crisp: {crisp_error}")

        except Exception as e:
            logger.error(
                f"[Generation] Failed to Trigger Crisp Event - Free Page Generated: {str(e)}"
            )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Store published successfully",
                    "preview_link": (
                        preview_link if "preview_link" in locals() else None
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error in publish-page: {err_msg}")
        return jsonify({"success": False, "error": err_msg}), 500


@shopify_core_bp.route("/api/update-publish-page", methods=["POST"])
@require_shopify_auth
def update_publish_page():
    """
    Update the metafields and main images of an existing product from magic_response.
    Does not create products or publish to store. The only theme change is adding
    layout sections missing from the product's template (see _sync_missing_template_sections).
    """
    try:
        user_id = request.user_id
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        page_id = data.get("page_id") or data.get("pageId")
        magic_response = data.get("magic_response")
        generated_page = None
        if page_id:
            generated_page = document_store.get_generated_page_by_id(str(page_id))

        product_id = (
            data.get("product_id")
            or data.get("uploaded_product_id")
            or data.get("shopify_config", {}).get("product_id")
        )
        if not product_id and isinstance(generated_page, dict):
            product_id = (
                generated_page.get("new_product_id")
                or generated_page.get("product_id")
                or (generated_page.get("original_content") or {}).get("product_id")
            )

        if isinstance(product_id, str) and product_id.strip().lower() in {
            "not provided",
            "null",
            "",
        }:
            product_id = None

        if not product_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "product_id is required (provide product_id or page_id with a page that has product_id)",
                    }
                ),
                400,
            )

        if not magic_response or not isinstance(magic_response, dict):
            return (
                jsonify({"success": False, "error": "magic_response is required"}),
                400,
            )

        product_id = str(product_id)
        generated_content = magic_response

        # Extract selected_color from magic_response
        selected_color = (
            data.get("selected_color")
            or (magic_response.get("selected_color") if magic_response else None)
            or (
                magic_response.get("color_schemes", [None])[0]
                if magic_response and magic_response.get("color_schemes")
                else None
            )
        )

        report = {"product_id": product_id, "steps": {}}

        # 1) Update main product images
        if "images" in generated_content:
            try:
                image_handler = ImageUploadHandler()
                update_result = image_handler.update_existing_product_with_images(
                    product_id=product_id,
                    magic_response=generated_content,
                    user_id=user_id,
                    replace_images=True,
                )
                report["steps"]["product_images"] = update_result
                if not update_result.get("success"):
                    logger.warning(
                        f"⚠️ Failed to update product images: {update_result.get('error')}"
                    )
            except Exception as img_err:
                logger.error(f"Error updating product images: {str(img_err)}")
                report["steps"]["product_images"] = {
                    "success": False,
                    "error": str(img_err),
                }
        else:
            report["steps"]["product_images"] = {
                "success": True,
                "skipped": True,
                "reason": "No images in magic_response",
            }

        # 2) Upload body images to Shopify and build file reference map
        body_image_metafields = {}
        try:
            images_dict = generated_content.get("images", {})
            body_images = (
                images_dict.get("body_images", {})
                if isinstance(images_dict, dict)
                else {}
            )

            if body_images and isinstance(body_images, dict):
                for image_key, image_url in body_images.items():
                    if not isinstance(image_url, str) or not (
                        image_url.startswith("http://")
                        or image_url.startswith("https://")
                    ):
                        continue
                    try:
                        ext = image_url.split(".")[-1]
                        filename = f"kluck_ai_{image_key}.{ext}"
                        upload_result = shopify_utils.upload_image_to_shopify(
                            image_url=image_url,
                            filename=filename,
                            alt_text=f"Kluck AI {image_key.replace('_', ' ').title()}",
                            user_id=user_id,
                        )
                        if upload_result.get("success") and upload_result.get(
                            "file_id"
                        ):
                            body_image_metafields[image_key] = upload_result.get(
                                "file_id"
                            )
                    except Exception as upload_err:
                        logger.warning(
                            f"Failed to upload body image {image_key}: {upload_err}"
                        )

            report["steps"]["body_images_uploaded"] = len(body_image_metafields)
        except Exception as body_img_err:
            logger.error(f"Error processing body images: {str(body_img_err)}")
            report["steps"]["body_images"] = {
                "success": False,
                "error": str(body_img_err),
            }

        # 3) Set text metafields
        try:
            text_content = generated_content.get("text")
            if text_content and isinstance(text_content, dict):
                metafields_result = shopify_utils.set_product_metafields_bulk(
                    product_id=product_id,
                    fields=text_content,
                    user_id=user_id,
                    namespace="kluck_ai",
                )
                report["steps"]["text_metafields"] = metafields_result
            else:
                report["steps"]["text_metafields"] = {"success": True, "skipped": True}
        except Exception as meta_err:
            logger.error(f"Error setting text metafields: {str(meta_err)}")
            report["steps"]["text_metafields"] = {
                "success": False,
                "error": str(meta_err),
            }

        # 4) Set color schema metafield
        if selected_color:
            try:
                color_result = shopify_utils.set_product_metafields_bulk(
                    product_id=product_id,
                    fields={"color_schema": selected_color},
                    user_id=user_id,
                    namespace="kluck_ai",
                )
                report["steps"]["color_metafield"] = color_result
            except Exception as color_err:
                logger.error(f"Error setting color metafield: {str(color_err)}")
                report["steps"]["color_metafield"] = {
                    "success": False,
                    "error": str(color_err),
                }
        else:
            report["steps"]["color_metafield"] = {"success": True, "skipped": True}

        # 5) Set body image metafields (file_reference type)
        if body_image_metafields:
            try:
                file_result = shopify_utils.set_product_file_metafields_bulk(
                    product_id=product_id,
                    file_references=body_image_metafields,
                    user_id=user_id,
                    namespace="kluck_ai",
                )
                report["steps"]["file_metafields"] = file_result
            except Exception as file_err:
                logger.error(f"Error setting file metafields: {str(file_err)}")
                report["steps"]["file_metafields"] = {
                    "success": False,
                    "error": str(file_err),
                }
        else:
            report["steps"]["file_metafields"] = {"success": True, "skipped": True}

        # 5b) Add layout sections the live template is missing (e.g. Aura FAQ)
        try:
            report["steps"]["template_sections"] = _sync_missing_template_sections(
                generated_page=generated_page,
                product_id=product_id,
                user_id=user_id,
            )
        except Exception as sync_err:
            logger.error(f"Error syncing template sections: {str(sync_err)}")
            report["steps"]["template_sections"] = {
                "success": False,
                "error": str(sync_err),
            }

        # 6) Update generated page backend and maintain history
        if page_id:
            try:
                existing_page = generated_page
                if not isinstance(existing_page, dict):
                    logger.warning(
                        f"Generated page not found for page_id={page_id}, skipping backend update"
                    )
                    report["steps"]["generated_page_update"] = {
                        "success": False,
                        "skipped": True,
                        "reason": "page_id not found",
                    }
                else:
                    generation_history = existing_page.get("generation_history") or []
                    if not isinstance(generation_history, list):
                        generation_history = []

                    # Append current generation_data to history before overwriting
                    current_data = existing_page.get("generation_data")
                    if current_data and isinstance(current_data, dict):
                        generation_history.append(
                            {
                                "generation_data": current_data,
                                "updated_at": datetime.now(timezone.utc).isoformat(),
                            }
                        )
                        # Cap history to last 20 entries
                        max_history_entries = 20
                        if len(generation_history) > max_history_entries:
                            generation_history = generation_history[
                                -max_history_entries:
                            ]
                        report["generation_history_length"] = len(generation_history)

                    update_success = document_store.update_generated_page(
                        page_id=str(page_id),
                        generation_data=generated_content,
                        generation_history=generation_history,
                        step=2,
                    )
                    if update_success:
                        logger.info(
                            f"✅ Updated generated page {page_id} with new generation_data and history"
                        )
                        report["steps"]["generated_page_update"] = {
                            "success": True,
                            "page_id": str(page_id),
                        }
                    else:
                        report["steps"]["generated_page_update"] = {
                            "success": False,
                            "error": "Failed to update generated page",
                        }
            except Exception as page_update_err:
                logger.error(
                    f"Error updating generated page {page_id}: {str(page_update_err)}"
                )
                report["steps"]["generated_page_update"] = {
                    "success": False,
                    "error": str(page_update_err),
                }
        else:
            report["steps"]["generated_page_update"] = {
                "success": True,
                "skipped": True,
                "reason": "No page_id provided",
            }

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Product metafields and images updated",
                    "report": report,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error in update-publish-page: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


def _map_font_for_kluck_settings(font_value):
    """Map UI font labels to Shopify settings_data font ids."""
    if font_value is None:
        return None
    if isinstance(font_value, str):
        normalized_key = " ".join(font_value.replace("+", " ").split()).strip()
        mapped = SHOPIFY_FONTS.get(font_value) or SHOPIFY_FONTS.get(normalized_key)
        return (mapped or font_value).strip() if (mapped or font_value) else None
    return None


def _valid_hex_color_for_kluck(value):
    if not isinstance(value, str):
        return None
    raw = value.strip()
    if len(raw) == 3 and raw and not raw.startswith("#"):
        if all(c in "0123456789abcdefABCDEF" for c in raw):
            return f"#{raw.lower()}"
    if len(raw) == 6 and raw and not raw.startswith("#"):
        if all(c in "0123456789abcdefABCDEF" for c in raw):
            return f"#{raw.lower()}"
    if len(raw) == 4 and raw.startswith("#"):
        chars = raw[1:]
        if all(c in "0123456789abcdefABCDEF" for c in chars):
            return raw.lower()
    if len(raw) == 7 and raw.startswith("#"):
        chars = raw[1:]
        if all(c in "0123456789abcdefABCDEF" for c in chars):
            return raw.lower()
    return None


def _pick_kluck_accent_color(*objs):
    """First valid accent hex from request / style preference shapes (incl. dynamicColor)."""
    keys = (
        "dynamicColor",
        "dynamic_color",
        "color_scheme",
        "colorScheme",
        "color",
        "primaryColor",
        "primary_color",
        "selectedColor",
        "selected_color",
        "defaultColor",
        "default_color",
        "hex",
        "value",
    )
    for obj in objs:
        if not isinstance(obj, dict):
            continue
        for key in keys:
            c = _valid_hex_color_for_kluck(obj.get(key))
            if c:
                return c
    return None


# Amour --a-wine accent + blush by store category (kids/fashion bright; beauty dark).
_AMOUR_CATEGORY_THEME = {
    "health_beauty": {"accent": "#6B0808", "blush": "#FFE3DE"},
    "fashion": {"accent": "#EC4899", "blush": "#FFF0F6"},
    "kids_toys": {"accent": "#EA580C", "blush": "#FFF7ED"},
    "home_kitchen": {"accent": "#6C4E2D", "blush": "#F5EDE4"},
    "car_accessories": {"accent": "#2563EB", "blush": "#EFF6FF"},
    "general": {"accent": "#64748B", "blush": "#F1F5F9"},
}


def _amour_theme_for_category(category):
    key = str(category or "general").strip().lower().replace(" ", "_").replace("-", "_")
    return dict(_AMOUR_CATEGORY_THEME.get(key) or _AMOUR_CATEGORY_THEME["general"])


def _patch_amour_section_accents(
    user_id,
    theme_id,
    accent_hex=None,
    blush_hex=None,
    category=None,
):
    """
    Write accent_color / blush_color onto every kluck-ai-amour-* section in
    templates/index.json. Amour chrome uses section.settings.accent_color
    (--a-wine), not only Shopify color_scheme.
    """
    theme = _amour_theme_for_category(category)
    accent = _valid_hex_color_for_kluck(accent_hex) or theme["accent"]
    blush = _valid_hex_color_for_kluck(blush_hex) or theme["blush"]
    try:
        index_key = "templates/index.json"
        index_asset = shopify_utils.get_theme_asset(
            theme_id=theme_id,
            asset_key=index_key,
            user_id=user_id,
        )
        if not index_asset.get("success") or not index_asset.get("exists"):
            return {"success": False, "error": "templates/index.json missing"}
        index_obj = index_asset.get("asset") or {}
        index_raw = index_obj.get("value")
        if not index_raw or not isinstance(index_raw, str):
            attachment = index_obj.get("attachment")
            if isinstance(attachment, str) and attachment.strip():
                index_raw = base64.b64decode(attachment).decode("utf-8")
        if not index_raw or not isinstance(index_raw, str):
            return {"success": False, "error": "index.json empty"}
        try:
            index_json = json.loads(index_raw)
        except Exception as parse_err:
            return {"success": False, "error": f"index.json parse: {parse_err}"}
        sections = index_json.get("sections") if isinstance(index_json, dict) else None
        if not isinstance(sections, dict):
            return {"success": False, "error": "index.json has no sections"}
        updated = []
        for _sid, section in sections.items():
            if not isinstance(section, dict):
                continue
            stype = str(section.get("type") or "")
            if not stype.startswith("kluck-ai-amour-"):
                continue
            settings = section.get("settings")
            if not isinstance(settings, dict):
                settings = {}
                section["settings"] = settings
            settings["accent_color"] = accent
            settings["blush_color"] = blush
            updated.append(stype)
        if not updated:
            return {"success": True, "updated": [], "skipped": True}
        index_out = json.dumps(index_json, ensure_ascii=False, indent=2)
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=True) as tmp:
            tmp.write(index_out)
            tmp.flush()
            up = shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(tmp.name),
                asset_key=index_key,
                user_id=user_id,
            )
        if not up.get("success"):
            return {
                "success": False,
                "error": up.get("error") or "Failed to upload amour accents",
            }
        logger.info(
            "publish-store: patched Amour accent_color=%s blush=%s on %s sections",
            accent,
            blush,
            len(updated),
        )
        return {"success": True, "updated": updated, "accent": accent, "blush": blush}
    except Exception as err:
        logger.warning("patch amour accents failed: %s", err)
        return {"success": False, "error": str(err)}


# Preview section key → live theme section `type` (templates/index.json).
# Keep in sync with kluck-embeded sectionColorUtils.PREVIEW_SECTION_KEY_TO_LIVE_TYPES.
_PREVIEW_SECTION_KEY_TO_LIVE_TYPES = {
    "pf-k-hero-peek-slider": ["kluck-ai-home-hero-section"],
    "pf-inline-headline": ["kluck-ai-headline-section"],
    "pf-collection-showcase": ["kluck-ai-collection-showcase-section"],
    "pf-feature-product-section": ["kluck-ai-feature-product-section"],
    "pf-testimonials01": ["kluck-ai-testimonials-section"],
    "pf-product-grid1x1": ["kluck-ai-tabbed-grid-section"],
    "marquee-scrolling-banner": ["kluck-ai-marquee-section-2"],
    "pf-split-feature": ["kluck-ai-image-with-text-3-section"],
    "pf-trust-badges": [
        "kluck-ai-trust-badge-2-section",
        "kluck-ai-trust-badge-section",
    ],
    "pf-selected-prod-3in1": ["kluck-ai-product-column-section"],
    "pf-faq-splitimage": ["kluck-ai-faq-section-home-1"],
    "pf-custom-new-image-with-text": [
        "kluck-ai-image-with-text-section",
        "kluck-ai-image-with-text-1-section",
    ],
    "pf-new-features-center-image": ["kluck-ai-features-center-section"],
    "pf-new-ingreds-features": ["kluck-ai-image-with-text-2-section"],
    "pf-new-default-product-hero": ["kluck-ai-product-hero-section"],
    "infinite-marquee": ["kluck-ai-infinite-marquee-section"],
    "pf-product-lookbook": ["kluck-ai-product-lookbook-section"],
    "collection-list": ["kluck-ai-collection-list-section"],
    "pf-cinematic-hero": ["kluck-ai-cinematic-hero", "kluck-ai-home-hero-section"],
    "pf-cinematic-announcement": ["kluck-ai-cinematic-announcement"],
    "pf-cinematic-trust": ["kluck-ai-cinematic-trust"],
    "pf-cinematic-product-story": ["kluck-ai-cinematic-product-story"],
    "pf-cinematic-inspiration": ["kluck-ai-cinematic-inspiration"],
    "pf-cinematic-feature-ticker": ["kluck-ai-cinematic-feature-ticker"],
    "pf-cinematic-why-shop": ["kluck-ai-cinematic-why-shop"],
    "pf-cinematic-feature-orbit": ["kluck-ai-cinematic-feature-orbit"],
    "pf-cinematic-reviews": [
        "kluck-ai-cinematic-reviews",
        "kluck-ai-testimonials-section",
    ],
    "pf-cinematic-faq": ["kluck-ai-cinematic-faq", "kluck-ai-faq-section-home-1"],
    "pf-cinematic-sticky-bar": ["kluck-ai-cinematic-sticky-bar"],
    "pf-amour-hero": ["kluck-ai-amour-hero"],
    "pf-amour-showcase": ["kluck-ai-amour-showcase"],
    "pf-amour-countdown": ["kluck-ai-amour-countdown"],
    "pf-amour-lookbook": ["kluck-ai-amour-lookbook"],
    "pf-amour-ribbons": ["kluck-ai-amour-ribbons"],
    "pf-amour-split": ["kluck-ai-amour-split"],
    "pf-amour-editorial": ["kluck-ai-amour-editorial"],
    "pf-amour-banner": ["kluck-ai-amour-banner"],
    "pf-amour-story": ["kluck-ai-amour-story"],
    "pf-amour-reviews": ["kluck-ai-amour-reviews"],
    "pf-amour-tabs": ["kluck-ai-amour-tabs"],
    "pf-amour-promise": ["kluck-ai-amour-promise"],
    "pf-amour-gallery": ["kluck-ai-amour-gallery"],
}


def _extract_section_colors_payload(generation_data=None, data=None):
    """Pull home_page.section_colors from generation_data or request body."""
    section_colors = {}
    if isinstance(generation_data, dict):
        home_page = generation_data.get("home_page")
        if isinstance(home_page, dict) and isinstance(
            home_page.get("section_colors"), dict
        ):
            section_colors = home_page.get("section_colors") or {}
    if not section_colors and isinstance(data, dict):
        mr = data.get("magic_response")
        if isinstance(mr, dict):
            mr_home = mr.get("home_page")
            if isinstance(mr_home, dict) and isinstance(
                mr_home.get("section_colors"), dict
            ):
                section_colors = mr_home.get("section_colors") or {}
        if not section_colors:
            home = data.get("home_page")
            if isinstance(home, dict) and isinstance(
                home.get("section_colors"), dict
            ):
                section_colors = home.get("section_colors") or {}
    return section_colors if isinstance(section_colors, dict) else {}


def _apply_section_colors_to_live_theme(
    user_id, theme_id, section_colors, accent_fallback="#bca38f"
):
    """
    Write home_page.section_colors into:
      1) config/settings_data.json color_schemes (scheme-kluck-*)
      2) templates/index.json section settings.color_scheme / *_color_scheme
    """
    section_report = {"schemes_added": [], "sections_updated": []}
    if not isinstance(section_colors, dict) or not section_colors:
        return {"success": True, "skipped": True, "section_colors": section_report}

    # Ensure live cinematic liquids read section.settings.color_scheme
    # (older publishes hard-coded color-scheme-1 / color-scheme-2).
    try:
        _force_reupload_cinematic_section_liquids(user_id, theme_id)
    except Exception as liq_err:
        logger.warning(
            "section_colors: cinematic liquid reupload skipped: %s", liq_err
        )

    # Live colors only render if the font/color snippet emits CSS for
    # scheme-kluck-* (not just scheme-1 / scheme-2).
    try:
        _force_reupload_kluck_color_snippet(user_id, theme_id)
    except Exception as snip_err:
        logger.warning(
            "section_colors: color snippet reupload skipped: %s", snip_err
        )

    def _hex_to_rgb(hex_color: str):
        h = (hex_color or "").strip().lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        if len(h) != 6:
            return None
        try:
            return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
        except ValueError:
            return None

    def _contrast_text(hex_color: str) -> str:
        rgb = _hex_to_rgb(hex_color)
        if not rgb:
            return "#000000"
        r, g, b = rgb
        luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
        return "#000000" if luminance > 0.6 else "#ffffff"

    def _ensure_scheme(color_schemes: dict, scheme_id: str, settings: dict):
        entry = color_schemes.get(scheme_id)
        if not isinstance(entry, dict):
            entry = {}
        existing = entry.get("settings")
        if not isinstance(existing, dict):
            existing = {}
        existing.update(settings)
        entry["settings"] = existing
        color_schemes[scheme_id] = entry

    try:
        settings_data_key = "config/settings_data.json"
        settings_data_asset_result = shopify_utils.get_theme_asset(
            theme_id=theme_id,
            asset_key=settings_data_key,
            user_id=user_id,
        )
        if not settings_data_asset_result.get("success") or not settings_data_asset_result.get(
            "exists"
        ):
            return {
                "success": False,
                "error": (
                    "settings_data.json fetch failed or missing: "
                    f"{settings_data_asset_result.get('error')}"
                ),
                "section_colors": section_report,
            }

        settings_data_asset_obj = settings_data_asset_result.get("asset") or {}
        settings_data_raw = settings_data_asset_obj.get("value")
        if not settings_data_raw or not isinstance(settings_data_raw, str):
            attachment = settings_data_asset_obj.get("attachment")
            if isinstance(attachment, str) and attachment.strip():
                settings_data_raw = base64.b64decode(attachment).decode("utf-8")
            else:
                return {
                    "success": False,
                    "error": "config/settings_data.json has no string value",
                    "section_colors": section_report,
                }

        settings_data_json = json.loads(settings_data_raw)
        if not isinstance(settings_data_json, dict):
            return {
                "success": False,
                "error": "settings_data.json must be a JSON object.",
                "section_colors": section_report,
            }

        current = settings_data_json.get("current")
        if not isinstance(current, dict):
            current = {}
            settings_data_json["current"] = current

        color_schemes = current.get("color_schemes")
        if not isinstance(color_schemes, dict):
            color_schemes = {}
            current["color_schemes"] = color_schemes

        scheme_ids_by_type = {}
        for section_key, color_raw in section_colors.items():
            slot_overrides = {}
            if isinstance(color_raw, str):
                btn = _valid_hex_color_for_kluck(color_raw)
                if btn:
                    slot_overrides["color_scheme"] = {
                        "primary_button_background": btn
                    }
            elif isinstance(color_raw, dict):
                has_slots = any(
                    k == "color_scheme" or str(k).endswith("_color_scheme")
                    for k in color_raw.keys()
                )
                if has_slots:
                    for slot_key, fields in color_raw.items():
                        if not (
                            slot_key == "color_scheme"
                            or str(slot_key).endswith("_color_scheme")
                        ):
                            continue
                        if not isinstance(fields, dict):
                            continue
                        cleaned = {}
                        for fk, fv in fields.items():
                            hx = _valid_hex_color_for_kluck(fv)
                            if hx:
                                cleaned[str(fk)] = hx
                        if cleaned:
                            slot_overrides[str(slot_key)] = cleaned
                else:
                    cleaned = {}
                    bg = _valid_hex_color_for_kluck(color_raw.get("background"))
                    btn = _valid_hex_color_for_kluck(
                        color_raw.get("button") or color_raw.get("accent")
                    )
                    tx = _valid_hex_color_for_kluck(color_raw.get("text"))
                    if bg:
                        cleaned["background"] = bg
                    if btn:
                        cleaned["primary_button_background"] = btn
                    if tx:
                        cleaned["foreground"] = tx
                        cleaned["foreground_heading"] = tx
                    if cleaned:
                        slot_overrides["color_scheme"] = cleaned

            if not slot_overrides:
                continue

            slug = str(section_key or "").strip().lower().replace(" ", "-")
            for ch in "._/":
                slug = slug.replace(ch, "-")
            while "--" in slug:
                slug = slug.replace("--", "-")
            slug = slug.strip("-")[:40]
            if not slug:
                continue

            for slot_key, fields in slot_overrides.items():
                slot_slug = (
                    str(slot_key)
                    .replace("_color_scheme", "")
                    .strip("-_")
                    .lower()
                    .replace(" ", "-")[:24]
                )
                if slot_key in ("color_scheme", "section_color_scheme"):
                    scheme_id = f"scheme-kluck-{slug}"
                else:
                    scheme_id = f"scheme-kluck-{slug}-{slot_slug or 'slot'}"

                accent = (
                    fields.get("primary_button_background")
                    or accent_fallback
                    or "#bca38f"
                )
                section_bg = fields.get("background") or "#ffffff"
                section_text = (
                    fields.get("foreground")
                    or fields.get("foreground_heading")
                    or _contrast_text(section_bg)
                )
                if section_text != "#ffffff" and not str(section_text).startswith("#"):
                    section_text = "#121212"
                btn_label = fields.get("primary_button_text") or _contrast_text(accent)
                secondary_label = (
                    fields.get("secondary_button_text")
                    or fields.get("foreground")
                    or "#121212"
                )
                text_out = section_text
                if text_out != "#ffffff" and text_out.lower() in (
                    "#000000",
                    "#121212",
                ):
                    text_out = "#121212"

                _ensure_scheme(
                    color_schemes,
                    scheme_id,
                    {
                        "background": section_bg,
                        "background_gradient": "",
                        "text": text_out,
                        "button": accent,
                        "button_label": btn_label,
                        "secondary_button_label": secondary_label,
                        "shadow": "#121212",
                    },
                )
                section_report["schemes_added"].append(scheme_id)

                live_types = _PREVIEW_SECTION_KEY_TO_LIVE_TYPES.get(
                    str(section_key), []
                )
                for live_type in live_types:
                    scheme_ids_by_type[f"{live_type}::{slot_key}"] = scheme_id
                    if slot_key in ("color_scheme", "section_color_scheme"):
                        scheme_ids_by_type[live_type] = scheme_id
                        # Cinematic + many Kluck sections use either key.
                        scheme_ids_by_type[
                            f"{live_type}::color_scheme"
                        ] = scheme_id
                        scheme_ids_by_type[
                            f"{live_type}::section_color_scheme"
                        ] = scheme_id
                    else:
                        scheme_ids_by_type.setdefault(live_type, scheme_id)

        settings_data_out = json.dumps(
            settings_data_json, ensure_ascii=False, indent=2
        )
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=True) as tmp:
            tmp.write(settings_data_out)
            tmp.flush()
            reupload = shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(tmp.name),
                asset_key=settings_data_key,
                user_id=user_id,
            )
        if not reupload.get("success"):
            return {
                "success": False,
                "error": reupload.get("error")
                or "Failed to upload settings_data with section schemes",
                "section_colors": section_report,
            }

        if scheme_ids_by_type:
            index_key = "templates/index.json"
            index_asset = shopify_utils.get_theme_asset(
                theme_id=theme_id,
                asset_key=index_key,
                user_id=user_id,
            )
            if index_asset.get("success") and index_asset.get("exists"):
                index_obj = index_asset.get("asset") or {}
                index_raw = index_obj.get("value")
                if not index_raw or not isinstance(index_raw, str):
                    attachment = index_obj.get("attachment")
                    if isinstance(attachment, str) and attachment.strip():
                        index_raw = base64.b64decode(attachment).decode("utf-8")
                if index_raw and isinstance(index_raw, str):
                    try:
                        index_json = json.loads(index_raw)
                    except Exception:
                        index_json = None
                    if isinstance(index_json, dict):
                        sections = index_json.get("sections")
                        if isinstance(sections, dict):
                            for _sid, section in sections.items():
                                if not isinstance(section, dict):
                                    continue
                                stype = section.get("type")
                                if not stype:
                                    continue
                                primary_scheme = (
                                    scheme_ids_by_type.get(stype)
                                    or scheme_ids_by_type.get(
                                        f"{stype}::color_scheme"
                                    )
                                    or scheme_ids_by_type.get(
                                        f"{stype}::section_color_scheme"
                                    )
                                )
                                settings = section.get("settings")
                                if not isinstance(settings, dict):
                                    settings = {}
                                    section["settings"] = settings
                                touched = False

                                # Always write primary scheme keys (cinematic
                                # index.json often omits them entirely).
                                if primary_scheme:
                                    settings["color_scheme"] = primary_scheme
                                    settings["section_color_scheme"] = (
                                        primary_scheme
                                    )
                                    touched = True

                                # Apply any slot-specific mappings.
                                prefix = f"{stype}::"
                                for map_key, scheme_id in scheme_ids_by_type.items():
                                    if not str(map_key).startswith(prefix):
                                        continue
                                    setting_key = str(map_key)[len(prefix) :]
                                    if not setting_key:
                                        continue
                                    settings[setting_key] = scheme_id
                                    touched = True

                                # Amour chrome reads accent_color (--a-wine).
                                if str(stype).startswith("kluck-ai-amour-"):
                                    accent_for_section = (
                                        _valid_hex_color_for_kluck(
                                            accent_fallback
                                        )
                                        or "#6B0808"
                                    )
                                    settings["accent_color"] = accent_for_section
                                    touched = True

                                if touched:
                                    section_report["sections_updated"].append(
                                        stype
                                    )

                            index_out = json.dumps(
                                index_json, ensure_ascii=False, indent=2
                            )
                            with tempfile.NamedTemporaryFile(
                                "w", suffix=".json", delete=True
                            ) as tmp:
                                tmp.write(index_out)
                                tmp.flush()
                                index_up = shopify_utils.update_theme_asset(
                                    theme_id=theme_id,
                                    file_path=str(tmp.name),
                                    asset_key=index_key,
                                    user_id=user_id,
                                )
                            if not index_up.get("success"):
                                return {
                                    "success": False,
                                    "error": index_up.get("error")
                                    or "Failed to upload index.json section colors",
                                    "section_colors": section_report,
                                }

        logger.info(
            "section_colors applied to live theme "
            f"(theme_id={theme_id}, schemes={len(section_report['schemes_added'])}, "
            f"sections={len(section_report['sections_updated'])})"
        )
        return {"success": True, "section_colors": section_report}
    except Exception as err:
        logger.error(
            f"section_colors theme patch failed: {err}",
            exc_info=True,
        )
        return {
            "success": False,
            "error": str(err),
            "section_colors": section_report,
        }


def _patch_kluck_theme_style_settings(user_id, theme_id, data, generation_data=None):
    """
    Patch live theme config/settings_data.json with Kluck fonts + accent color schemes.
    Mirrors publish-store settings_data step so Edit generation → Save updates the online store.
    """
    try:
        style_preferences_payload = (
            data.get("stylePreferences")
            if isinstance(data.get("stylePreferences"), dict)
            else {}
        )
        magic_style = {}
        stored_style = {}
        if isinstance(generation_data, dict):
            if isinstance(generation_data.get("stylePreferences"), dict):
                magic_style = generation_data.get("stylePreferences") or {}
            if isinstance(generation_data.get("style_preferences"), dict):
                stored_style = generation_data.get("style_preferences") or {}

        heading_font = (
            data.get("headingFont")
            or data.get("heading_font")
            or style_preferences_payload.get("headingFont")
            or style_preferences_payload.get("heading_font")
            or magic_style.get("headingFont")
            or magic_style.get("heading_font")
            or stored_style.get("heading_font")
            or stored_style.get("headingFont")
        )
        body_font = (
            data.get("bodyFont")
            or data.get("body_font")
            or style_preferences_payload.get("bodyFont")
            or style_preferences_payload.get("body_font")
            or magic_style.get("bodyFont")
            or magic_style.get("body_font")
            or stored_style.get("body_font")
            or stored_style.get("bodyFont")
        )

        schema_heading_default = (
            _map_font_for_kluck_settings(heading_font) or "barlow_condensed_n4"
        )
        schema_body_default = (
            _map_font_for_kluck_settings(body_font) or "barlow_n4"
        )

        schema_color_default = (
            _pick_kluck_accent_color(
                data,
                style_preferences_payload,
                magic_style,
                stored_style,
                generation_data if isinstance(generation_data, dict) else None,
            )
            or "#000000"
        )

        settings_data_key = "config/settings_data.json"
        settings_data_asset_result = shopify_utils.get_theme_asset(
            theme_id=theme_id,
            asset_key=settings_data_key,
            user_id=user_id,
        )
        if not settings_data_asset_result.get("success") or not settings_data_asset_result.get(
            "exists"
        ):
            return {
                "success": False,
                "error": (
                    "settings_data.json fetch failed or missing: "
                    f"{settings_data_asset_result.get('error')}"
                ),
            }

        settings_data_asset_obj = settings_data_asset_result.get("asset") or {}
        settings_data_raw = settings_data_asset_obj.get("value")
        if not settings_data_raw or not isinstance(settings_data_raw, str):
            attachment = settings_data_asset_obj.get("attachment")
            if isinstance(attachment, str) and attachment.strip():
                settings_data_raw = base64.b64decode(attachment).decode("utf-8")
            else:
                return {
                    "success": False,
                    "error": (
                        "config/settings_data.json has no string 'value' "
                        "(or base64 'attachment')."
                    ),
                }

        settings_data_json = json.loads(settings_data_raw)
        if not isinstance(settings_data_json, dict):
            return {
                "success": False,
                "error": "settings_data.json must be a JSON object.",
            }

        current = settings_data_json.get("current")
        if not isinstance(current, dict):
            current = {}
            settings_data_json["current"] = current

        current["kluck_heading_font"] = schema_heading_default
        current["kluck_body_font"] = schema_body_default
        current["color_scheme"] = schema_color_default

        color_schemes = current.get("color_schemes")
        if not isinstance(color_schemes, dict):
            color_schemes = {}
            current["color_schemes"] = color_schemes

        accent = schema_color_default or "#bca38f"

        def _hex_to_rgb(hex_color: str):
            h = (hex_color or "").strip().lstrip("#")
            if len(h) == 3:
                h = "".join(c * 2 for c in h)
            if len(h) != 6:
                return None
            try:
                return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
            except ValueError:
                return None

        def _rgb_to_hex(r: int, g: int, b: int) -> str:
            return (
                f"#{max(0, min(255, r)):02x}"
                f"{max(0, min(255, g)):02x}"
                f"{max(0, min(255, b)):02x}"
            )

        def _mix_with_white(hex_color: str, accent_amount: float) -> str:
            rgb = _hex_to_rgb(hex_color)
            if not rgb:
                return "#f2ebe5"
            r, g, b = rgb
            w = 1.0 - accent_amount
            return _rgb_to_hex(
                int(round(r * accent_amount + 255 * w)),
                int(round(g * accent_amount + 255 * w)),
                int(round(b * accent_amount + 255 * w)),
            )

        def _contrast_text(hex_color: str) -> str:
            rgb = _hex_to_rgb(hex_color)
            if not rgb:
                return "#000000"
            r, g, b = rgb
            luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
            return "#000000" if luminance > 0.6 else "#ffffff"

        scheme2_bg = _mix_with_white(accent, 0.3)
        scheme2_fg = _contrast_text(scheme2_bg)
        scheme1_settings = {
            "background": "#ffffff",
            "background_gradient": "",
            "text": "#121212",
            "button": accent,
            "button_label": "#ffffff",
            "secondary_button_label": "#121212",
            "shadow": "#121212",
        }
        scheme2_text = scheme2_fg if scheme2_fg == "#ffffff" else "#121212"
        scheme2_settings = {
            "background": scheme2_bg,
            "background_gradient": "",
            "text": scheme2_text,
            "button": accent,
            "button_label": "#ffffff",
            "secondary_button_label": "#121212",
            "shadow": "#121212",
        }

        def _ensure_scheme(scheme_id: str, settings: dict):
            entry = color_schemes.get(scheme_id)
            if not isinstance(entry, dict):
                entry = {}
            existing = entry.get("settings")
            if not isinstance(existing, dict):
                existing = {}
            existing.update(settings)
            entry["settings"] = existing
            color_schemes[scheme_id] = entry

        _ensure_scheme("scheme-1", scheme1_settings)
        _ensure_scheme("scheme-2", scheme2_settings)

        settings_data_out = json.dumps(
            settings_data_json, ensure_ascii=False, indent=2
        )
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=True) as tmp:
            tmp.write(settings_data_out)
            tmp.flush()
            settings_data_upload_result = shopify_utils.update_theme_asset(
                theme_id=theme_id,
                file_path=str(tmp.name),
                asset_key=settings_data_key,
                user_id=user_id,
            )

        if not settings_data_upload_result.get("success"):
            return {
                "success": False,
                "error": settings_data_upload_result.get("error")
                or "Failed to upload settings_data.json",
                "heading_font": schema_heading_default,
                "body_font": schema_body_default,
                "color": schema_color_default,
            }

        logger.info(
            "update-publish-store: patched theme settings_data "
            f"(theme_id={theme_id}, accent={schema_color_default})"
        )

        section_colors = _extract_section_colors_payload(
            generation_data=generation_data, data=data
        )
        section_report = {"schemes_added": [], "sections_updated": []}
        if section_colors:
            section_result = _apply_section_colors_to_live_theme(
                user_id=user_id,
                theme_id=theme_id,
                section_colors=section_colors,
                accent_fallback=schema_color_default or "#bca38f",
            )
            if not section_result.get("success"):
                return {
                    "success": False,
                    "error": section_result.get("error")
                    or "Failed to apply section colors",
                    "heading_font": schema_heading_default,
                    "body_font": schema_body_default,
                    "color": schema_color_default,
                    "section_colors": section_result.get("section_colors")
                    or section_report,
                }
            section_report = section_result.get("section_colors") or section_report

        return {
            "success": True,
            "heading_font": schema_heading_default,
            "body_font": schema_body_default,
            "color": schema_color_default,
            "section_colors": section_report,
        }
    except Exception as err:
        logger.error(
            f"update-publish-store: theme style patch failed: {err}",
            exc_info=True,
        )
        return {"success": False, "error": str(err)}


@shopify_core_bp.route("/api/update-publish-store", methods=["POST"])
@require_shopify_auth
def update_publish_store():
    """
    Update shop metafield + generated page record, and patch live theme
    typography / color scheme via config/settings_data.json (same as publish-store).

    JSON body:
    - page_id / pageId: required (generated page; supplies theme_id for reference in report).
    - magic_response: store generation payload; persisted to generation_data on the page with original image
      URLs (http/https). Shopify file GIDs are only written to the shop metafield, not DynamoDB.
    - headingFont / bodyFont / dynamicColor (or stylePreferences): optional live theme style overrides.
    - metadata: optional dict merged into update_generated_page when saving the page (with magic_response).
    """
    try:
        user_id = request.user_id
        data = request.get_json() or {}

        page_id = data.get("page_id") or data.get("pageId")
        magic_response = data.get("magic_response")
        generated_page = None
        if page_id:
            generated_page = document_store.get_generated_page_by_id(str(page_id))
        if not generated_page:
            return jsonify({"success": False, "error": "Generated page not found"}), 400

        report = {"steps": {}}

        theme_id = generated_page.get("theme_id")
        if not theme_id:
            return (
                jsonify(
                    {"success": False, "error": "Theme id not found on generated page"}
                ),
                400,
            )
        report["theme_id"] = theme_id

        style_source = (
            magic_response
            if isinstance(magic_response, dict) and magic_response
            else (generated_page.get("generation_data") or {})
        )
        report["steps"]["theme_settings"] = _patch_kluck_theme_style_settings(
            user_id=user_id,
            theme_id=theme_id,
            data=data,
            generation_data=style_source if isinstance(style_source, dict) else None,
        )

        # Shop metafield kluck_ai.store_generation + optional DynamoDB (mirrors publish-store / update-publish-page)
        if page_id or (isinstance(magic_response, dict) and magic_response):
            generation_data = None
            # Deep copy so uploads + Shopify GIDs in home_page.images apply only to metafield payload,
            # not to magic_response (DynamoDB keeps original http/https image URLs).
            if isinstance(magic_response, dict) and magic_response:
                generation_data = copy.deepcopy(magic_response)
            elif page_id and isinstance(generated_page, dict):
                generation_data = copy.deepcopy(
                    generated_page.get("generation_data") or {}
                )

            if isinstance(generation_data, dict) and generation_data:
                store_mode = "single"
                if isinstance(generated_page, dict):
                    stored_mode = generated_page.get("mode")
                    if stored_mode == "multi_product":
                        store_mode = "multi"
                if generation_data.get("mode") not in {"single", "multi"}:
                    generation_data["mode"] = store_mode
                try:
                    home_page = generation_data.get("home_page", {})
                    home_images = (
                        home_page.get("images", {})
                        if isinstance(home_page, dict)
                        else {}
                    )
                    if isinstance(home_images, dict) and home_images:
                        logger.info(
                            f"update-publish-store: uploading {len(home_images)} home_page images to Shopify Files"
                        )
                        file_gid_images = {}

                        def _upload_one_update_image(item):
                            image_key, image_url = item
                            if not isinstance(image_url, str) or not (
                                image_url.startswith("http://")
                                or image_url.startswith("https://")
                            ):
                                return None
                            ext = image_url.split("?")[0].split(".")[-1]
                            if not ext or len(ext) > 6:
                                ext = "jpg"
                            filename = f"kluck_ai_store_{image_key}.{ext}"
                            upload_result = shopify_utils.upload_image_to_shopify(
                                image_url=image_url,
                                filename=filename,
                                alt_text=f"Kluck AI {image_key.replace('_', ' ').title()}",
                                user_id=user_id,
                            )
                            if upload_result.get("success") and upload_result.get(
                                "file_id"
                            ):
                                return image_key, upload_result.get("file_id")
                            logger.warning(
                                f"update-publish-store: upload failed {image_key}: "
                                f"{upload_result.get('error', 'Unknown')}"
                            )
                            return None

                        with ThreadPoolExecutor(max_workers=4) as pool:
                            futures = [
                                pool.submit(_upload_one_update_image, item)
                                for item in home_images.items()
                            ]
                            for fut in as_completed(futures):
                                try:
                                    result = fut.result()
                                except Exception as upload_error:
                                    logger.error(
                                        f"update-publish-store: image upload error: {upload_error}"
                                    )
                                    continue
                                if result:
                                    image_key, file_id = result
                                    file_gid_images[image_key] = file_id

                        for image_key, file_id in file_gid_images.items():
                            safe_key = (
                                str(image_key)
                                .strip()
                                .lower()
                                .replace(" ", "_")
                                .replace("-", "_")
                            )
                            try:
                                shopify_utils.set_shop_metafield(
                                    namespace="kluck_ai",
                                    key=safe_key,
                                    mtype="file_reference",
                                    value=file_id,
                                    user_id=user_id,
                                )
                            except Exception as shop_mf_err:
                                logger.warning(
                                    f"update-publish-store: shop file_reference {safe_key}: {shop_mf_err}"
                                )

                        if file_gid_images:
                            if "home_page" not in generation_data or not isinstance(
                                generation_data.get("home_page"), dict
                            ):
                                generation_data["home_page"] = {}
                            if "images" not in generation_data[
                                "home_page"
                            ] or not isinstance(
                                generation_data["home_page"].get("images"), dict
                            ):
                                generation_data["home_page"]["images"] = {}
                            generation_data["home_page"]["images"].update(
                                file_gid_images
                            )

                    value_str = json.dumps(generation_data, ensure_ascii=False)
                    if len(value_str) > 60000:
                        logger.warning(
                            f"update-publish-store: metafield payload large ({len(value_str)} chars); slimming."
                        )
                        slim_payload = {
                            "mode": generation_data.get("mode", "single"),
                            "home_page": generation_data.get("home_page", {}),
                        }
                        value_str = json.dumps(slim_payload, ensure_ascii=False)

                    time.sleep(0.15)
                    metafield_result = shopify_utils.set_shop_metafield(
                        namespace="kluck_ai",
                        key="store_generation",
                        mtype="json",
                        value=value_str,
                        user_id=user_id,
                    )
                    report["steps"]["shop_metafield"] = metafield_result
                    if metafield_result.get("success"):
                        logger.info(
                            f"✅ update-publish-store: saved kluck_ai.store_generation (page_id={page_id})"
                        )
                except Exception as mf_err:
                    logger.error(
                        f"update-publish-store: shop metafield error: {mf_err}"
                    )
                    report["steps"]["shop_metafield"] = {
                        "success": False,
                        "error": str(mf_err),
                    }
            else:
                report["steps"]["shop_metafield"] = {
                    "success": True,
                    "skipped": True,
                    "reason": "No generation_data (send magic_response or ensure page has generation_data)",
                }

            if page_id and isinstance(magic_response, dict) and magic_response:
                try:
                    existing_page = generated_page
                    if not isinstance(existing_page, dict):
                        report["steps"]["generated_page_update"] = {
                            "success": False,
                            "skipped": True,
                            "reason": "page_id not found",
                        }
                    else:
                        generation_history = (
                            existing_page.get("generation_history") or []
                        )
                        if not isinstance(generation_history, list):
                            generation_history = []
                        current_data = existing_page.get("generation_data")
                        if current_data and isinstance(current_data, dict):
                            generation_history.append(
                                {
                                    "generation_data": current_data,
                                    "updated_at": datetime.now(
                                        timezone.utc
                                    ).isoformat(),
                                }
                            )
                            max_history_entries = 20
                            if len(generation_history) > max_history_entries:
                                generation_history = generation_history[
                                    -max_history_entries:
                                ]

                        extra = data.get("metadata")
                        # Persist the same magic_response shape with original image URLs (not Shopify GIDs).
                        generation_data_for_page = copy.deepcopy(magic_response)
                        if generation_data_for_page.get("mode") not in {
                            "single",
                            "multi",
                        }:
                            generation_data_for_page["mode"] = store_mode
                        if isinstance(extra, dict) and extra:
                            update_success = document_store.update_generated_page(
                                page_id=str(page_id),
                                generation_data=generation_data_for_page,
                                generation_history=generation_history,
                                step=2,
                                metadata=extra,
                            )
                        else:
                            update_success = document_store.update_generated_page(
                                page_id=str(page_id),
                                generation_data=generation_data_for_page,
                                generation_history=generation_history,
                                step=2,
                            )
                        report["steps"]["generated_page_update"] = (
                            {"success": bool(update_success), "page_id": str(page_id)}
                            if update_success
                            else {
                                "success": False,
                                "error": "Failed to update generated page",
                            }
                        )
                except Exception as page_update_err:
                    logger.error(
                        f"update-publish-store: generated page update: {page_update_err}"
                    )
                    report["steps"]["generated_page_update"] = {
                        "success": False,
                        "error": str(page_update_err),
                    }
            elif page_id:
                report["steps"]["generated_page_update"] = {
                    "success": True,
                    "skipped": True,
                    "reason": "No magic_response; shop metafield used DB/fetched data only",
                }
        else:
            report["steps"]["shop_metafield"] = {
                "success": True,
                "skipped": True,
                "reason": "No page_id or magic_response",
            }
            report["steps"]["generated_page_update"] = {
                "success": True,
                "skipped": True,
                "reason": "No page_id or magic_response",
            }

        overall = True
        if isinstance(report["steps"].get("theme_settings"), dict):
            ts = report["steps"]["theme_settings"]
            if ts.get("success") is False and not ts.get("skipped"):
                overall = False
        if isinstance(report["steps"].get("shop_metafield"), dict):
            sm = report["steps"]["shop_metafield"]
            if sm.get("success") is False and not sm.get("skipped"):
                overall = False
        if isinstance(report["steps"].get("generated_page_update"), dict):
            gu = report["steps"]["generated_page_update"]
            if gu.get("success") is False and not gu.get("skipped"):
                overall = False

        return (
            jsonify(
                {
                    "success": overall,
                    "message": (
                        "Shop theme and metadata updated"
                        if overall
                        else "Shop metadata updated"
                    ),
                    "report": report,
                    **(
                        {
                            "partial_failure": True,
                            "message_detail": (
                                "One or more steps failed; see report.steps for details."
                            ),
                        }
                        if not overall
                        else {}
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error in update-publish-store: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/restore-original-content", methods=["POST"])
@require_shopify_auth
def restore_original_content():
    """
    Restore a Shopify product back to the original content snapshot stored on a generated page.

    Expected input (JSON):
    - page_id (or pageId): generated page id
    """
    try:
        user_id = request.user_id
        data = request.get_json() or {}

        page_id = data.get("page_id") or data.get("pageId")
        if not page_id:
            return jsonify({"success": False, "error": "page_id is required"}), 400

        generated_page = document_store.get_generated_page_by_id(str(page_id))

        if not isinstance(generated_page, dict):
            return jsonify({"success": False, "error": "Generated page not found"}), 404

        original_content = generated_page.get("original_content")
        if not isinstance(original_content, dict) or not original_content:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "original_content not found on generated page",
                    }
                ),
                400,
            )

        product_id = (
            original_content.get("product_id")
            or generated_page.get("product_id")
            or generated_page.get("new_product_id")
        )
        if not product_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Product ID not found to restore",
                    }
                ),
                400,
            )

        restore_report = {
            "product_id": str(product_id),
            "restored_at": datetime.now(timezone.utc).isoformat(),
            "steps": {},
        }

        # 1) Restore product title + description (prefer raw HTML if present)
        try:
            title = original_content.get("title")
            description_html = original_content.get("description_html")
            description_fallback = original_content.get("description")
            description_to_set = (
                description_html
                if isinstance(description_html, str) and description_html.strip()
                else description_fallback
            )

            update_payload = {"id": str(product_id)}
            if title is not None:
                update_payload["title"] = title
            if description_to_set is not None:
                update_payload["body_html"] = description_to_set

            if len(update_payload.keys()) > 1:
                updated = shopify_utils.update_product(update_payload, user_id)
                restore_report["steps"]["product_update"] = {
                    "success": True,
                    "updated": updated,
                }
            else:
                restore_report["steps"]["product_update"] = {
                    "success": True,
                    "skipped": True,
                    "reason": "No title/description present in original_content",
                }
        except Exception as product_update_error:
            restore_report["steps"]["product_update"] = {
                "success": False,
                "error": str(product_update_error),
            }

        # 2) Restore product template assignment (templateSuffix)
        try:
            template_suffix = original_content.get("template_suffix")
            template_result = shopify_utils.set_product_template_suffix(
                product_id=str(product_id),
                template_suffix=template_suffix,
                user_id=user_id,
            )
            restore_report["steps"]["template_suffix"] = template_result
        except Exception as template_error:
            restore_report["steps"]["template_suffix"] = {
                "success": False,
                "error": str(template_error),
            }

        # 3) Restore product images (replace current images with original URLs if available)
        try:
            images_inputs = []
            images_meta = original_content.get("images_meta")
            if isinstance(images_meta, list) and images_meta:
                for img in images_meta:
                    if not isinstance(img, dict):
                        continue
                    url = img.get("url")
                    if not isinstance(url, str) or not (
                        url.startswith("http://") or url.startswith("https://")
                    ):
                        continue
                    alt = img.get("alt") or img.get("alt_text") or ""
                    images_inputs.append({"url": url, "alt": alt})
            else:
                for url in original_content.get("images") or []:
                    if not isinstance(url, str) or not (
                        url.startswith("http://") or url.startswith("https://")
                    ):
                        continue
                    images_inputs.append({"url": url, "alt": ""})

            print("images_inputs", images_inputs)
            if images_inputs:
                # Delete existing images (GraphQL media delete, then REST fallback)
                should_fallback_to_rest = True
                existing_media_ids = shopify_utils.get_product_media_image_ids(
                    str(product_id), user_id, first=100
                )
                if existing_media_ids:
                    delete_media_result = shopify_utils.delete_product_media(
                        str(product_id), existing_media_ids, user_id
                    )
                    deleted_count = int(delete_media_result.get("deleted_count") or 0)
                    errors = (
                        delete_media_result.get("errors")
                        or delete_media_result.get("error")
                        or []
                    )
                    if deleted_count > 0:
                        should_fallback_to_rest = False
                    else:
                        # If media IDs "do not exist", treat as no-op and fall back to REST.
                        if "do not exist" not in str(errors):
                            logger.warning(
                                f"⚠️ GraphQL media delete had issues; falling back to REST. Error={errors}"
                            )

                rest_delete_result = None
                if should_fallback_to_rest:
                    rest_delete_result = shopify_utils.delete_all_product_images(
                        str(product_id), user_id
                    )

                print("creating media for product images_inputs", images_inputs)
                add_result = shopify_utils.create_media_images_for_product(
                    str(product_id), images_inputs, user_id
                )

                restore_report["steps"]["images"] = {
                    "success": bool(add_result.get("success")),
                    "deleted_media_ids_count": len(existing_media_ids or []),
                    "rest_fallback": bool(should_fallback_to_rest),
                    "rest_delete_result": rest_delete_result,
                    "added": add_result,
                }
            else:
                restore_report["steps"]["images"] = {
                    "success": True,
                    "skipped": True,
                    "reason": "No original image URLs found to restore",
                }

        except Exception as images_error:
            restore_report["steps"]["images"] = {
                "success": False,
                "error": str(images_error),
            }

        # Store a lightweight restore marker on the generated page
        try:
            document_store.update_generated_page(
                page_id=str(page_id),
                last_restore={
                    "restored_at": restore_report["restored_at"],
                    "product_id": str(product_id),
                },
            )
        except Exception:
            # Don't fail the restore if bookkeeping fails
            pass

        # Optional: return a preview URL (based on stored theme_id + template_suffix)
        preview_url = None
        try:
            theme_id = original_content.get("theme_id")
            preview_url = shopify_utils.get_product_preview_url(
                product_id=str(product_id),
                user_id=user_id,
                theme_id=str(theme_id) if theme_id else None,
            )
        except Exception:
            preview_url = None

        overall_success = all(
            bool(step.get("success", False))
            for step in (
                restore_report["steps"].get("product_update", {}),
                restore_report["steps"].get("template_suffix", {}),
                restore_report["steps"].get("images", {}),
            )
            if isinstance(step, dict) and step
        )

        # After a successful restore, disable this generated page
        # (so it won't be treated as an active/enabled generated variant anymore).
        if overall_success:
            try:
                document_store.update_generated_page(
                    page_id=str(page_id),
                    is_enabled=False,
                )
            except Exception:
                # Don't fail the restore if bookkeeping fails
                pass

        return (
            jsonify(
                {
                    "success": overall_success,
                    "message": (
                        "Restore completed"
                        if overall_success
                        else "Restore completed with issues"
                    ),
                    "page_id": str(page_id),
                    "product_id": str(product_id),
                    "preview_url": preview_url,
                    "restore_report": restore_report,
                }
            ),
            200 if overall_success else 207,
        )

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error in restore-original-content: {err_msg}")
        return jsonify({"success": False, "error": err_msg}), 500


@shopify_core_bp.route("/api/publish-generated-content", methods=["POST"])
@require_shopify_auth
def publish_generated_content():
    """
    Publish a Shopify product by applying the generated content stored on a generated page.

    This updates:
    - product title
    - product description/body_html
    - product images (replaces existing product images if new ones exist)
    - product template assignment (templateSuffix)

    Expected input (JSON):
    - page_id (or pageId): generated page id

    Optional input (JSON):
    - product_id (or productId): override product id
    - magic_response / generation_data: override generated content payload
    - detected_category: override category used for selecting template
    """
    try:
        user_id = request.user_id
        data = request.get_json() or {}

        page_id = data.get("page_id") or data.get("pageId")
        if not page_id:
            return jsonify({"success": False, "error": "page_id is required"}), 400

        generated_page = document_store.get_generated_page_by_id(str(page_id))
        if not isinstance(generated_page, dict):
            return jsonify({"success": False, "error": "Generated page not found"}), 404

        # Prefer request-provided generated content, else use stored generation_data
        generated_content = (
            data.get("magic_response")
            or data.get("generation_data")
            or generated_page.get("generation_data")
        )
        if not isinstance(generated_content, dict) or not generated_content:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "generation_data not found on generated page",
                    }
                ),
                400,
            )

        # Resolve product_id (prefer explicit override, then page fields / metadata / original_content)
        product_id = data.get("product_id") or data.get("productId")
        if not product_id:
            product_id = generated_page.get("new_product_id") or generated_page.get(
                "product_id"
            )
        if not product_id and isinstance(generated_page.get("metadata"), dict):
            product_id = generated_page["metadata"].get(
                "new_product_id"
            ) or generated_page["metadata"].get("product_id")
        if not product_id and isinstance(generated_page.get("original_content"), dict):
            product_id = generated_page["original_content"].get("product_id")

        if not product_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Product ID not found to publish",
                    }
                ),
                400,
            )

        publish_report = {
            "page_id": str(page_id),
            "product_id": str(product_id),
            "published_at": datetime.now(timezone.utc).isoformat(),
            "steps": {},
        }

        # 1) Update product title/description and replace images (if present in generated content)
        try:
            image_handler = ImageUploadHandler()
            update_result = image_handler.update_existing_product_with_images(
                product_id=str(product_id),
                magic_response=generated_content,
                user_id=user_id,
                replace_images=True,
            )
            publish_report["steps"]["product_and_images"] = update_result
        except Exception as product_update_error:
            publish_report["steps"]["product_and_images"] = {
                "success": False,
                "error": str(product_update_error),
            }

        # 2) Bind template to product (based on detected_category)
        template_suffix = None
        template_file = None
        try:
            detected_category = (
                data.get("detected_category")
                or generated_page.get("detected_category")
                or generated_page.get("category")
            )
            if not detected_category and isinstance(
                generated_page.get("metadata"), dict
            ):
                detected_category = generated_page["metadata"].get(
                    "detected_category"
                ) or generated_page["metadata"].get("category")
            if not detected_category and isinstance(generated_content, dict):
                detected_category = generated_content.get(
                    "detected_category"
                ) or generated_content.get("category")

            selected_template = _parse_template_number(
                generated_page.get("selectedTemplate")
            )
            print("selected_template", selected_template)
            if selected_template is None:
                meta = generated_page.get("metadata") or {}
                selected_template = _parse_template_number(
                    meta.get("selectedTemplate")
                )
                if selected_template is None:
                    selected_template = _parse_template_number(meta.get("template"))

            theme_id = generated_page.get("theme_id")
            original_content = generated_page.get("original_content")
            if not theme_id and isinstance(original_content, dict):
                theme_id = original_content.get("theme_id") or original_content.get(
                    "theme_gid"
                )
            if not theme_id:
                live_theme_result = shopify_utils.get_live_theme(user_id)
                if live_theme_result.get("success") and live_theme_result.get("theme"):
                    theme_id = live_theme_result["theme"].get("id")

            template_result = _publish_unique_product_template(
                category=detected_category or "general",
                product_id=str(product_id),
                selected_template=selected_template,
                theme_id=theme_id,
                user_id=user_id,
            )
            template_suffix = template_result.get("template_suffix")
            template_file = template_result.get("template_file")
            publish_report["steps"]["template"] = {
                "success": bool(template_result.get("success")),
                "template_suffix": template_suffix,
                "template_file": template_file,
                "result": template_result,
            }
        except Exception as template_error:
            publish_report["steps"]["template"] = {
                "success": False,
                "error": str(template_error),
                "template_suffix": template_suffix,
                "template_file": template_file,
            }

        # Store a lightweight publish marker on the generated page
        try:
            page_update = {
                "page_id": str(page_id),
                "last_publish": {
                    "published_at": publish_report["published_at"],
                    "product_id": str(product_id),
                    "template_suffix": template_suffix,
                },
                "published": True,
                "is_enabled": True,
            }
            if template_suffix and publish_report["steps"].get("template", {}).get(
                "success"
            ):
                page_update["kluck_template_suffix"] = template_suffix
            if selected_template in (1, 2, 3):
                page_update["selectedTemplate"] = selected_template
                page_update["template"] = f"template_{selected_template}"
            document_store.update_generated_page(**page_update)
        except Exception:
            # Don't fail the publish if bookkeeping fails
            pass

        # Optional: return a preview URL (based on stored theme_id + computed template_suffix)
        preview_url = None
        try:
            theme_id = None
            original_content = generated_page.get("original_content")
            if isinstance(original_content, dict):
                theme_id = original_content.get("theme_id") or original_content.get(
                    "theme_gid"
                )
            if not theme_id:
                theme_id = generated_page.get("theme_id")

            preview_url = shopify_utils.get_product_preview_url(
                product_id=str(product_id),
                user_id=user_id,
                theme_id=str(theme_id) if theme_id else None,
            )
        except Exception:
            preview_url = None

        overall_success = all(
            bool(step.get("success", False))
            for step in (
                publish_report["steps"].get("product_and_images", {}),
                publish_report["steps"].get("template", {}),
            )
            if isinstance(step, dict) and step
        )

        return (
            jsonify(
                {
                    "success": overall_success,
                    "message": (
                        "Publish completed"
                        if overall_success
                        else "Publish completed with issues"
                    ),
                    "page_id": str(page_id),
                    "product_id": str(product_id),
                    "template_suffix": template_suffix,
                    "preview_url": preview_url,
                    "publish_report": publish_report,
                }
            ),
            200 if overall_success else 207,
        )

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error in publish-generated-content: {err_msg}")
        return jsonify({"success": False, "error": err_msg}), 500


@shopify_core_bp.route("/api/generate-preview-link", methods=["GET"])
@require_shopify_auth
def generate_preview_link():
    """
    Generate a preview link for a generated page.

    This route retrieves a generated page from the database, gets the product ID
    and theme ID, then generates a Shopify admin theme editor preview link.

    Expected input:
    - page_id: The ID of the generated page (from query params)

    Returns:
    - preview_link: The Shopify admin theme editor URL for previewing the page
    """
    try:
        user_id = request.user_id

        # Get page_id from query params
        page_id = request.args.get("page_id")

        if not page_id:
            return jsonify({"success": False, "error": "page_id is required"}), 400

        # Get generated page from database
        generated_page = document_store.get_generated_page_by_id(page_id)
        if not generated_page:
            return jsonify({"success": False, "error": "Generated page not found"}), 404

        # Get product_id from page (new_product_id takes precedence, fallback to product_id)
        # Metadata is stored flattened on the page object
        product_id = generated_page.get("new_product_id")
        if not product_id:
            product_id = generated_page.get("product_id")
        # Also check nested metadata for backward compatibility
        if not product_id and isinstance(generated_page.get("metadata"), dict):
            product_id = generated_page["metadata"].get(
                "new_product_id"
            ) or generated_page["metadata"].get("product_id")

        if not product_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Product ID not found in generated page",
                    }
                ),
                400,
            )
        page_theme_id = generated_page.get("theme_id")
        print("generated_page", generated_page)
        print("page_theme_id", page_theme_id)
        if page_theme_id:
            # Extract numeric ID from GID format (e.g., 'gid://shopify/OnlineStoreTheme/137663840327' -> '137663840327')
            duplicated_theme_id = shopify_utils._from_gid(page_theme_id)
            print("page_theme_id", duplicated_theme_id)
        else:
            # Get store to retrieve duplicated_theme_id
            store = document_store.get_user_primary_store(user_id)
            if not store:
                return (
                    jsonify({"success": False, "error": "Store not found for user"}),
                    404,
                )

            duplicated_theme_id = store.get("duplicated_theme_id")

        if not duplicated_theme_id:
            # Get live theme ID
            live_theme_result = shopify_utils.get_live_theme(user_id)
            if not live_theme_result.get("success") or not live_theme_result.get(
                "theme"
            ):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Failed to get live theme. Please try again.",
                        }
                    ),
                    400,
                )

            duplicated_theme_id = live_theme_result["theme"].get("id")

        # Get detected_category from page (metadata is stored flattened, also check generation_data)
        detected_category = generated_page.get(
            "detected_category"
        ) or generated_page.get("category")
        # Also check nested metadata for backward compatibility
        if not detected_category and isinstance(generated_page.get("metadata"), dict):
            detected_category = generated_page["metadata"].get(
                "detected_category"
            ) or generated_page["metadata"].get("category")
        # Check generation_data as fallback
        if not detected_category:
            generation_data = generated_page.get("generation_data", {})
            if isinstance(generation_data, dict):
                detected_category = generation_data.get(
                    "detected_category"
                ) or generation_data.get("category")

        try:
            # Get product details to retrieve handle
            product_details = shopify_utils.get_product(product_id, user_id)
            product_handle = product_details.get("handle")
            live_template_suffix = (
                product_details.get("template_suffix")
                if isinstance(product_details, dict)
                else None
            )

            if not product_handle:
                logger.warning(
                    "Product handle not found, cannot generate admin preview link"
                )
                return (
                    jsonify({"success": False, "error": "Product handle not found"}),
                    400,
                )

            # Get shop name from credentials
            credentials = shopify_utils._get_user_credentials(user_id)
            shop_domain = extract_shop_name(credentials.get("shop_url", ""))

            if not shop_domain:
                return (
                    jsonify({"success": False, "error": "Shop domain not found"}),
                    400,
                )

            # Template suffix for preview: use category + selectedTemplate (e.g. kluck-health-beauty-1)
            selected_template = _parse_template_number(
                generated_page.get("selectedTemplate")
            )
            print("selected_template", selected_template)
            if selected_template is None:
                meta = generated_page.get("metadata") or {}
                selected_template = _parse_template_number(
                    meta.get("selectedTemplate")
                )
                if selected_template is None:
                    selected_template = _parse_template_number(meta.get("template"))

            template_suffix = _stored_or_legacy_template_suffix(
                generated_page, detected_category or "general", selected_template
            )

            # If generated page is disabled, use the original_content template suffix (if available)
            page_is_enabled = generated_page.get("is_enabled")
            should_use_generated_template = (
                True if page_is_enabled is None else bool(page_is_enabled)
            )
            original_template_suffix = None
            if not should_use_generated_template:
                original_content = generated_page.get("original_content")
                if isinstance(original_content, dict):
                    original_template_suffix = original_content.get("template_suffix")
            preview_template_suffix = (
                template_suffix
                if should_use_generated_template
                else (original_template_suffix or template_suffix)
            )
            # The live product suffix is the template shoppers see. Prefer it so
            # Edit & Preview opens Play when that is what was published.
            if (
                should_use_generated_template
                and isinstance(live_template_suffix, str)
                and live_template_suffix.strip().startswith("kluck-")
            ):
                preview_template_suffix = live_template_suffix.strip()
            # Extract theme ID (handle both numeric and GID formats)
            theme_id = str(duplicated_theme_id)
            if "/" in theme_id:
                # If it's a GID, extract the numeric part
                theme_id = theme_id.split("/")[-1]

            # Build admin theme editor URL
            # Format: https://admin.shopify.com/store/{shop-name}/themes/{theme-id}/editor?previewPath=%2Fproducts%2F{handle}%3Fview%3D{template-suffix}
            preview_path = f"/products/{product_handle}?view={preview_template_suffix}"
            encoded_path = quote(preview_path, safe="")
            preview_link = f"https://admin.shopify.com/store/{shop_domain}/themes/{theme_id}/editor?previewPath={encoded_path}"
            logger.info(f"Generated admin preview link: {preview_link}")

            return (
                jsonify(
                    {
                        "success": True,
                        "preview_link": preview_link,
                        "product_id": product_id,
                        "product_handle": product_handle,
                        "theme_id": theme_id,
                        "template_suffix": preview_template_suffix,
                    }
                ),
                200,
            )

        except Exception as preview_error:
            logger.error(f"Error generating admin preview link: {str(preview_error)}")
            # Fallback to regular product URL
            try:
                credentials = shopify_utils._get_user_credentials(user_id)
                shop_domain = extract_shop_name(credentials.get("shop_url", ""))
                if shop_domain and not shop_domain.endswith(".myshopify.com"):
                    if not shop_domain.endswith(".com"):
                        shop_domain = f"{shop_domain}.myshopify.com"
                preview_link = f"https://{shop_domain}" if shop_domain else None
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Failed to generate preview link: {str(preview_error)}",
                            "fallback_link": preview_link,
                        }
                    ),
                    500,
                )
            except Exception as fallback_error:
                logger.error(f"Error generating fallback link: {str(fallback_error)}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Failed to generate preview link: {str(preview_error)}",
                        }
                    ),
                    500,
                )

    except Exception as e:
        logger.error(f"Error in generate-preview-link: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/theme-upload-status", methods=["GET"])
@require_auth
def get_store_status():
    """
    Get store status including template uploads, product pages, and subscription plan.

    Purpose:
    - Check if user has templates uploaded (has uploaded_template entries)
    - Return product pages information
    - Return subscription plan and limits
    - Provide template metadata for display

    Note: We no longer upload full themes, we push template files to user's existing theme.
    The endpoint URL is kept for backward compatibility with frontend.
    """
    try:
        user_id = request.user_id

        # Get store status from database (template uploads, product pages, plan info)
        status_data = document_store.get_store_status(user_id)

        # Get user plan to determine max pages
        from ....constants.plans import (
            DEFAULT_PLAN,
            get_max_pages_for_plan,
            get_plan_name,
        )

        user_plan = status_data.get("subscription_plan", DEFAULT_PLAN)

        # Get product pages from status_data
        product_pages = status_data.get("product_pages", [])
        product_pages_count = status_data.get("product_pages_count", len(product_pages))

        # Get uploaded_template and template_metadata
        uploaded_template = status_data.get("uploaded_template", {})
        if not isinstance(uploaded_template, dict):
            uploaded_template = {}
        template_metadata = status_data.get("template_metadata", [])
        if not isinstance(template_metadata, list):
            template_metadata = []

        # Determine if templates have been uploaded (for backward compatibility)
        # A user has "uploaded" if they have at least one category in uploaded_template
        has_templates_uploaded = len(uploaded_template) > 0

        # Get the most recent template upload for theme_metadata (backward compatibility)
        # Convert uploaded_template to old theme_metadata format if needed
        theme_metadata = None
        if uploaded_template:
            # Get the most recent category upload
            latest_category = None
            latest_timestamp = None
            for category, info in uploaded_template.items():
                if isinstance(info, dict):
                    uploaded_at = info.get("uploaded_at")
                    if uploaded_at and (
                        not latest_timestamp or uploaded_at > latest_timestamp
                    ):
                        latest_timestamp = uploaded_at
                        latest_category = category

            if latest_category:
                theme_metadata = {
                    "category": latest_category,
                    "uploaded_at": latest_timestamp,
                }

        return (
            jsonify(
                {
                    "success": True,
                    "has_store": status_data.get("has_store", False),
                    # Backward compatibility fields
                    "theme_uploaded": has_templates_uploaded,  # True if templates have been uploaded
                    "theme_metadata": theme_metadata,  # Most recent template upload info
                    # New fields
                    "template_metadata": template_metadata,  # All template uploads
                    # Product pages and plan info
                    "subscription_plan": user_plan,
                    "max_pages": get_max_pages_for_plan(user_plan),
                    "plan_name": get_plan_name(user_plan),
                    "product_pages": product_pages,
                    "product_pages_count": product_pages_count,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting store status: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@shopify_core_bp.route("/api/shopify/check-coupon-access", methods=["GET"])
@require_shopify_auth
def check_coupon_access():
    """
    Check if the user has access to a specific coupon code
    Query parameter: coupon_code
    """
    try:
        # Get coupon_code from query parameters
        coupon_code = request.args.get("coupon_code")

        if not coupon_code:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "coupon_code query parameter is required",
                    }
                ),
                400,
            )

        # Get shop domain from request (set by require_shopify_auth)
        shop_domain = (
            request.user_id
        )  # This is the shop domain when using require_shopify_auth

        # Find the store to get the actual user_id (Cognito ID)
        store = document_store.get_shop_details(shop_domain)
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
        # Get public coupons
        public_coupons = document_store.get_public_copouns()
        print("public_coupons", public_coupons)
        public_coupons_codes = [coupon.get("code") for coupon in public_coupons]
        print("public_coupons_codes", public_coupons_codes)
        # Get allowed coupons from the store
        allowed_coupons = store.get("allowed_coupons", [])
        print("allowed_coupons", allowed_coupons)
        # Check if the coupon_code is in the allowed_coupons list
        has_access = (
            coupon_code in allowed_coupons or coupon_code in public_coupons_codes
        )
        print("has_access", has_access)
        # Optionally verify the coupon exists in the coupons table
        coupon_exists = False
        coupon_details = None
        if has_access:
            coupon_details = document_store.get_coupon_by_code(coupon_code)
            coupon_exists = coupon_details is not None

        return jsonify(
            {
                "success": True,
                "coupon_code": coupon_code,
                "has_access": has_access,
                "coupon_exists": coupon_exists,
                "coupon_details": coupon_details if coupon_details else None,
            }
        )

    except Exception as e:
        logger.error(f"Error checking coupon access: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
