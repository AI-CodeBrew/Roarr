# Bundler Routes: API endpoints for bundler operations

from flask import Blueprint, request, jsonify
import logging
from ..database import document_store
from ..auth.utils import require_shopify_auth

logger = logging.getLogger(__name__)

bundler_bp = Blueprint("bundler", __name__)


@bundler_bp.route("/api/bundler/bundle", methods=["POST"])
@require_shopify_auth
def create_bundle():
    """
    Create a new bundle

    Expected request body:
    {
        "id": "bundle-id",
        "name": "Bundle Name",
        "description": "Bundle Description",
        "type": "discounted" | "upsell",
        "productSelectionType": "global" | "specific",
        "productIds": ["product-id-1", "product-id-2"],
        "sectionHeader": "Buy More Save More",
        "isActive": true,
        "allowVariantSelection": false,
        "styleSettings": {
            "cornerRoundness": 9,
            "breathingSpace": 14,
            "primaryColor": "#a34e4e",
            "primaryColorRgb": "163, 78, 78"
        },
        "quantityDiscountTiers": [
            {
                "quantity": 1,
                "discountType": "percentage" | "flat" | "specificPrice",
                "discountPercentage": 10.0,
                "discountValue": 10.0,
                "flatAmount": 5.0,
                "specificPrice": 20.0,
                "title": "Buy 1",
                "buyX": 1,
                "getYFree": 1,
                "discountBadge": "",
                "subtitle": "",
                "showSubtitle": true,
                "isMostPopular": false,
                "showMostPopular": false,
                "mostPopularText": "Most Popular",
                "priceRounding": false,
                "priceRoundingValue": ".99",
                "showDiscountBadge": true
            }
        ],
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
    }
    """
    try:
        data = request.get_json()
        user_id = request.user_id

        if not data:
            return jsonify({"success": False, "error": "Request data is required"}), 400

        bundle_id = data.get("id")
        if not bundle_id:
            return jsonify({"success": False, "error": "Bundle ID is required"}), 400

        # Check if bundle already exists
        existing_bundle = document_store.get_bundle_by_id(bundle_id)
        if existing_bundle:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Bundle with ID '{bundle_id}' already exists. Use PUT method to update.",
                    }
                ),
                409,
            )

        # Create the bundle
        bundle_item = document_store.create_bundle(data, user_id)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Bundle created successfully",
                    "bundle": bundle_item,
                }
            ),
            201,
        )

    except ValueError as e:
        logger.error(f"Validation error creating bundle: {e}")
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating bundle: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@bundler_bp.route("/api/bundler/bundle", methods=["PUT"])
@require_shopify_auth
def update_bundle():
    """
    Update an existing bundle

    Expected request body:
    {
        "id": "bundle-id",
        "name": "Updated Bundle Name",
        "description": "Updated Description",
        "type": "discounted" | "upsell",
        "productSelectionType": "global" | "specific",
        "productIds": ["product-id-1", "product-id-2"],
        "sectionHeader": "Buy More Save More",
        "isActive": true,
        "allowVariantSelection": false,
        "styleSettings": {
            "cornerRoundness": 9,
            "breathingSpace": 14,
            "primaryColor": "#a34e4e",
            "primaryColorRgb": "163, 78, 78"
        },
        "quantityDiscountTiers": [
            {
                "quantity": 1,
                "discountType": "percentage" | "flat" | "specificPrice",
                "discountPercentage": 10.0,
                "discountValue": 10.0,
                "flatAmount": 5.0,
                "specificPrice": 20.0,
                "title": "Buy 1",
                "buyX": 1,
                "getYFree": 1,
                "discountBadge": "",
                "subtitle": "",
                "showSubtitle": true,
                "isMostPopular": false,
                "showMostPopular": false,
                "mostPopularText": "Most Popular",
                "priceRounding": false,
                "priceRoundingValue": ".99",
                "showDiscountBadge": true
            }
        ],
        "updatedAt": "timestamp"
    }
    """
    try:
        data = request.get_json()
        user_id = request.user_id
        if not data:
            return jsonify({"success": False, "error": "Request data is required"}), 400

        bundle_id = data.get("id")
        if not bundle_id:
            return jsonify({"success": False, "error": "Bundle ID is required"}), 400

        # Check if bundle exists
        logger.info(f"Checking if bundle exists: {bundle_id}")
        existing_bundle = document_store.get_bundle_by_id(bundle_id)
        if not existing_bundle:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Bundle with ID '{bundle_id}' not found. Use POST method to create.",
                    }
                ),
                404,
            )

        # Update the bundle
        update_success = document_store.update_bundle(bundle_id, data, user_id)

        if update_success:
            # Fetch updated bundle
            updated_bundle = document_store.get_bundle_by_id(bundle_id)
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Bundle updated successfully",
                        "bundle": updated_bundle,
                    }
                ),
                200,
            )
        else:
            return jsonify({"success": False, "error": "Failed to update bundle"}), 500

    except Exception as e:
        logger.error(f"Error updating bundle: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@bundler_bp.route("/api/bundler/bundle", methods=["DELETE"])
@require_shopify_auth
def delete_bundle():
    """
    Soft delete a bundle by setting deleted flag to true and deletedAt timestamp

    Expected request body:
    {
        "id": "bundle-id"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Request data is required"}), 400

        bundle_id = data.get("id")
        if not bundle_id:
            return jsonify({"success": False, "error": "Bundle ID is required"}), 400

        # Check if bundle exists
        existing_bundle = document_store.get_bundle_by_id(bundle_id)
        if not existing_bundle:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Bundle with ID '{bundle_id}' not found",
                    }
                ),
                404,
            )

        # Check if bundle is already deleted
        if existing_bundle.get("deleted", False):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Bundle with ID '{bundle_id}' is already deleted",
                    }
                ),
                409,
            )

        # Soft delete the bundle
        delete_success = document_store.delete_bundle(bundle_id)

        if delete_success:
            # Fetch deleted bundle to return
            deleted_bundle = document_store.get_bundle_by_id(bundle_id)
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Bundle deleted successfully",
                        "bundle": deleted_bundle,
                    }
                ),
                200,
            )
        else:
            return jsonify({"success": False, "error": "Failed to delete bundle"}), 500

    except Exception as e:
        logger.error(f"Error deleting bundle: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
