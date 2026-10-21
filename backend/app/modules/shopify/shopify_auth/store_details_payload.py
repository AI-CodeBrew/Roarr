"""Shared store-details payload for embedded bootstrap (credit-based; no plan slots)."""

import logging
from app.modules.database.conditions import Attr

from ...database import document_store

logger = logging.getLogger(__name__)


def build_store_details_payload(shop_domain):
    """Return (payload_dict, http_status). Caller should jsonify(payload)."""
    store = document_store.get_shop_details(shop_domain)

    if not store:
        return (
            {
                "success": False,
                "error": "Store not found. Please connect your Shopify store first.",
            },
            404,
        )

    user_id = shop_domain
    pages_table = document_store.pages_table_ref

    products_count_after_payment = 0
    published_products_count_after_payment = 0
    free_products = []

    try:
        filter_expression = Attr("user_id").eq(user_id)
        response = pages_table.scan(FilterExpression=filter_expression)
        all_items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = pages_table.scan(
                FilterExpression=filter_expression,
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            all_items.extend(response.get("Items", []))

        non_free = [item for item in all_items if item.get("is_free") is not True]
        products_count_after_payment = len(non_free)
        published_products_count_after_payment = len(
            [item for item in non_free if item.get("published") is True]
        )
    except Exception as pages_error:
        logger.error("Error counting generated pages: %s", pages_error)

    try:
        free_filter = Attr("user_id").eq(user_id) & Attr("is_free").eq(True)
        free_response = pages_table.scan(FilterExpression=free_filter)
        free_items = free_response.get("Items", [])
        while "LastEvaluatedKey" in free_response:
            free_response = pages_table.scan(
                FilterExpression=free_filter,
                ExclusiveStartKey=free_response["LastEvaluatedKey"],
            )
            free_items.extend(free_response.get("Items", []))
        free_products.extend(free_items)
    except Exception as e:
        logger.error("Error fetching free products: %s", e)

    return (
        {
            "success": True,
            "store": store,
            "subscription_history": [],
            "has_subscription": False,
            "last_payment_date": None,
            "products_count_after_payment": products_count_after_payment,
            "published_products_count_after_payment": published_products_count_after_payment,
            "free_products": free_products,
        },
        200,
    )
