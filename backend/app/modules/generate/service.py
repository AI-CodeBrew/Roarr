import logging
import time
from typing import Optional
from ..credits import wallet_service
from ..database import document_store
from .generate_text import generate_text
from .generate_images import (
    generate_images,
    generate_image,
    convert_urls_to_paths,
    upload_images_to_cdn,
)
from .context_utils import build_product_context
from .detect_color_scheme import detect_color_scheme
from .store_single_product_service import generate_for_single_product_store
from .store_multi_product_service import generate_for_multi_product_store
from .store_collections_generation import (
    apply_collections_to_home_page,
    run_collections_agent_and_images,
)

logger = logging.getLogger(__name__)


def _safe_refund(
    feature: str,
    user_id: Optional[str],
    reference_id: str,
    spend_ledger_id: Optional[str],
    reason: str,
) -> None:
    """
    Refund a previously-charged spend, swallowing any errors so the caller's
    error-handling flow continues unimpeded. Internal users (no spend) skip.
    """
    if not user_id or not spend_ledger_id:
        return
    try:
        wallet_service.refund(
            user_id=user_id,
            feature=feature,
            reference_id=reference_id,
            spend_ledger_id=spend_ledger_id,
            reason=reason,
        )
        logger.info(
            f"Refunded {feature} for user={user_id} ref={reference_id} reason={reason}"
        )
    except Exception as refund_err:
        logger.error(
            f"Refund FAILED for user={user_id} feature={feature} ref={reference_id}: {refund_err}"
        )


def run_generation_task(
    page_id: str,
    product_title: str,
    product_description: str,
    product_id: str,
    store_name: str,
    category: str,
    template: str,
    product_images: list,
    language: Optional[str] = None,
    user_id: Optional[str] = None,
    spend_ledger_id: Optional[str] = None,
):
    """
    Background task to generate product content (text and images)
    This function runs in a separate thread.

    user_id + spend_ledger_id together identify the wallet spend that funded
    this generation. On any terminal failure path we refund those credits.
    They are passed by kwarg so older callers without credit awareness still
    work (they just won't trigger refunds).
    """
    try:
        logger.info(f"Starting background generation task for page_id={page_id}")

        # Set status to in_progress and percentage to 0
        document_store.update_generation_status(page_id, "in_progress")
        document_store.update_generation_percentage(page_id, 0)

        # Step 1: Build product context ONCE (to be reused by both text and images)
        print("=" * 80)
        print("STEP 1: Building product context (1 LLM call)")
        print("=" * 80)
        start_context = time.time()
        product_context = build_product_context(
            product_title=product_title,
            product_description=product_description,
            category=category,
        )
        print(f"✓ Context built in {time.time() - start_context:.2f} seconds")
        # Update percentage to 9% after context building

        # Step 2: Generate text content (reusing context)
        print("\n" + "=" * 80)
        print("STEP 2: Generating text content (reusing context)")
        print("=" * 80)
        start = time.time()
        generation = {}
        text_generation = generate_text(
            category=category,
            template=template,
            product_context_str=product_context,  # Pass pre-built context
            page_id=page_id,  # Pass page_id for percentage updates
            document_store=document_store,
            language=language,
        )
        generation["text"] = text_generation
        print(f"✓ Text generated in {time.time() - start:.2f} seconds")
        # Update percentage to 18% after text generation
        document_store.update_generation_percentage(page_id, 18)

        # Step 3: Generate images (reusing same context)
        print("\n" + "=" * 80)
        print("STEP 3: Generating images (reusing same context)")
        print("=" * 80)
        images = product_images

        start = time.time()

        image_generation = generate_images(
            product_title=product_title,
            product_description=product_description,
            product_images=images,
            category=category,
            template=template,  # Used to pick only selected image keys from templates/<category>/image_keys.json
            page_id=page_id,
            document_store=document_store,
            language=language,
        )

        generation["images"] = image_generation

        if image_generation.get("base_image_failed"):
            try:
                document_store.update_generated_page(
                    page_id=page_id,
                    generation_data=generation,
                    generation_status="failed",
                )
                document_store.update_generation_percentage(page_id, 0)
            except Exception as e:
                logger.error(
                    f"Error persisting failed generation for page_id={page_id}: {str(e)}"
                )
                try:
                    document_store.update_generation_status(page_id, "failed")
                except Exception as status_error:
                    logger.error(
                        f"Error updating status to failed: {str(status_error)}"
                    )
            _safe_refund(
                feature="page_generation",
                user_id=user_id,
                reference_id=page_id,
                spend_ledger_id=spend_ledger_id,
                reason="base_image_failed",
            )
            return

        document_store.update_generation_percentage(page_id, 85)

        print(f"✓ Images generated in {time.time() - start:.2f} seconds")
        # Note: Percentage updates are also handled within generate_images function

        # Step 4: Detect color schemes from product images
        print("\n" + "=" * 80)
        print("STEP 4: Detecting top 4 color schemes from product images")
        print("=" * 80)
        start_color = time.time()
        color_schemes = detect_color_scheme(generation["images"]["product_images"])
        if color_schemes:
            generation["color_schemes"] = color_schemes
            print(
                f"✓ Color schemes detected: {color_schemes} in {time.time() - start_color:.2f} seconds"
            )
        else:
            logger.warning("Failed to detect color schemes, continuing without them")
            print(
                f"⚠ Color scheme detection failed in {time.time() - start_color:.2f} seconds"
            )        
        document_store.update_generation_percentage(page_id, 94)

        print("\n" + "=" * 80)
        print("✓ COMPLETE: All content generated with optimized context")
        print("=" * 80)

        # Update generated page in database with generated content
        try:
            if page_id:
                # Update the page with generated content
                img_sub = (generation.get("images") or {}).get("image_subcategory")
                page_extra = {}
                if img_sub:
                    page_extra["image_subcategory"] = img_sub
                update_success = document_store.update_generated_page(
                    page_id=page_id,
                    generation_data=generation,
                    step=2,
                    **page_extra,
                )
                if update_success:
                    logger.info(f"Updated page {page_id} with generated content")
                    # Set status to completed and percentage to 100%
                    document_store.update_generation_status(page_id, "completed")
                    document_store.update_generation_percentage(page_id, 100)
                else:
                    logger.warning(
                        f"Failed to update page {page_id} with generated content, but continuing"
                    )
                    # Set status to failed if update failed
                    document_store.update_generation_status(page_id, "failed")
                    _safe_refund(
                        feature="page_generation",
                        user_id=user_id,
                        reference_id=page_id,
                        spend_ledger_id=spend_ledger_id,
                        reason="page_update_failed",
                    )
            else:
                logger.warning("No page_id available, skipping database update")
        except Exception as e:
            logger.error(f"Error updating generated page in database: {str(e)}")
            # Set status to failed on error
            if page_id:
                document_store.update_generation_status(page_id, "failed")
                _safe_refund(
                    feature="page_generation",
                    user_id=user_id,
                    reference_id=page_id,
                    spend_ledger_id=spend_ledger_id,
                    reason="page_update_exception",
                )
    except Exception as e:
        logger.error(
            f"Error in background generation task for page_id={page_id}: {str(e)}"
        )
        # Set status to failed on error
        if page_id:
            try:
                document_store.update_generation_status(page_id, "failed")
            except Exception as status_error:
                logger.error(f"Error updating status to failed: {str(status_error)}")
            _safe_refund(
                feature="page_generation",
                user_id=user_id,
                reference_id=page_id,
                spend_ledger_id=spend_ledger_id,
                reason="generation_exception",
            )


def run_store_generation_task(
    page_id: str,
    mode: str,
    store_category: str,
    payload: dict,
    language: Optional[str] = None,
    user_id: Optional[str] = None,
    style_preferences: Optional[dict] = None,
    spend_ledger_id: Optional[str] = None,
):
    """
    Background task to generate store content (text and images) for home/product pages.
    Mirrors the product page job lifecycle: status + percentage + generation_data saved.

    spend_ledger_id (optional): identifies the wallet spend that funded this
    store creation. On any terminal failure we refund those credits.
    """
    try:
        logger.info(f"Starting store generation task for page_id={page_id}, mode={mode}")
        document_store.update_generation_status(page_id, "in_progress")
        document_store.update_generation_percentage(page_id, 0)

        # Early progress (aligns with STORE_GENERATION_STEPS in routes)
        document_store.update_generation_percentage(page_id, 4)

        if mode == "single_product":
            generation, validation_error = generate_for_single_product_store(
                data=payload,
                category_key=store_category,
                language=language,
                page_id=page_id,
            )
        else:
            generation, validation_error = generate_for_multi_product_store(
                data=payload,
                category_key=store_category,
                language=language,
                page_id=page_id,
            )

        if validation_error:
            logger.error(
                f"Store generation validation failed for page_id={page_id}: {validation_error}"
            )
            document_store.update_generation_status(page_id, "failed")
            document_store.update_generation_percentage(page_id, 0)
            _safe_refund(
                feature="store_creation",
                user_id=user_id,
                reference_id=page_id,
                spend_ledger_id=spend_ledger_id,
                reason="validation_error",
            )
            return

        document_store.update_generation_percentage(page_id, 70)

        # Multi-product stores: run collections agent + per-collection images (Shopify).
        if mode == "multi_product" and user_id:
            try:
                document_store.update_generation_percentage(page_id, 74)
                coll_result = run_collections_agent_and_images(
                    user_id=user_id,
                    store_category=store_category,
                    language=language,
                )
                if coll_result.get("success") and isinstance(generation, dict):
                    generation["collections"] = coll_result.get("collections") or {}
                    apply_collections_to_home_page(generation)
                elif not coll_result.get("success"):
                    logger.warning(
                        f"Collections pipeline skipped/failed for page_id={page_id}: "
                        f"{coll_result.get('error')}"
                    )
                document_store.update_generation_percentage(page_id, 88)
            except Exception as coll_err:
                logger.error(
                    f"Collections agent/images failed for page_id={page_id}: {coll_err}"
                )
                document_store.update_generation_percentage(page_id, 76)
        else:
            # Single-product (or no user_id): no collections pipeline — jump to near-complete.
            document_store.update_generation_percentage(page_id, 82)

        # At this point text is done and images may also be done (services do both).
        document_store.update_generation_percentage(page_id, 95)

        # Collections were only needed to wire headings/images into the home page;
        # they are not required (and can be quite large) in persisted generation_data.
        if isinstance(generation, dict):
            generation.pop("collections", None)

        page_extra = {}
        if isinstance(generation, dict):
            sub = generation.get("image_subcategory")
            if sub:
                page_extra["image_subcategory"] = sub
            pcs = generation.get("product_image_subcategories")
            if isinstance(pcs, list) and pcs:
                page_extra["product_image_subcategories"] = pcs

        generation_mode = "single" if mode == "single_product" else "multi"
        market_type = str(
            (payload or {}).get("market_type")
            or (payload or {}).get("marketType")
            or "prepaid"
        ).strip().lower()
        if market_type not in {"cod", "prepaid"}:
            market_type = "prepaid"
        country_code_raw = (payload or {}).get("country_code") or (payload or {}).get(
            "countryCode"
        )
        country_code = (
            str(country_code_raw).strip().upper()[:2] if country_code_raw else None
        )
        selected_template_raw = (payload or {}).get("selectedTemplate") or (
            payload or {}
        ).get("selected_template")
        try:
            selected_template = int(selected_template_raw)
        except (TypeError, ValueError):
            selected_template = 1
        if selected_template not in {1, 2}:
            selected_template = 1

        from .store.pack_utils import store_template_pack_for_mode

        # Cinematic and Amour are single-product only; Lumenook is multi-product only.
        store_template_pack = store_template_pack_for_mode(
            (payload or {}).get("storeTemplatePack")
            or (payload or {}).get("store_template_pack"),
            mode,
        )

        product_ids = (
            (payload or {}).get("productIds")
            or (payload or {}).get("product_ids")
            or []
        )
        if not isinstance(product_ids, list):
            product_ids = []
        product_ids = [
            str(x).strip() for x in product_ids if x is not None and str(x).strip()
        ]
        premium_product_ids = (
            (payload or {}).get("premiumProductIds")
            or (payload or {}).get("premium_product_ids")
            or []
        )
        if not isinstance(premium_product_ids, list):
            premium_product_ids = []

        if isinstance(generation, dict):
            generation.setdefault("market_type", market_type)
            generation.setdefault("country_code", country_code)
            generation.setdefault("selectedTemplate", selected_template)
            generation.setdefault("store_category", store_category)
            generation.setdefault("category", store_category)
            generation["storeTemplatePack"] = store_template_pack
            generation["store_template_pack"] = store_template_pack
            generation["product_ids"] = product_ids
            generation["premiumProductIds"] = premium_product_ids
            generation["premium_product_ids"] = premium_product_ids

        update_success = document_store.update_generated_page(
            page_id=page_id,
            generation_data={
                **generation,
                "mode": generation_mode,
                "style_preferences": style_preferences,
                "market_type": market_type,
                "country_code": country_code,
                "selectedTemplate": selected_template,
                "store_category": store_category,
                "category": store_category,
                "storeTemplatePack": store_template_pack,
                "store_template_pack": store_template_pack,
                "product_ids": product_ids,
                "premiumProductIds": premium_product_ids,
                "premium_product_ids": premium_product_ids,
            },
            step=2,
            mode=mode,
            selectedTemplate=selected_template,
            store_category=store_category,
            category=store_category,
            market_type=market_type,
            country_code=country_code,
            storeTemplatePack=store_template_pack,
            store_template_pack=store_template_pack,
            product_ids=product_ids,
            premiumProductIds=premium_product_ids,
            premium_product_ids=premium_product_ids,
            **page_extra,
        )
        if update_success:
            document_store.update_generation_status(page_id, "completed")
            document_store.update_generation_percentage(page_id, 100)
            logger.info(f"Store generation completed for page_id={page_id}")
        else:
            logger.error(f"Failed to update store generation_data for page_id={page_id}")
            document_store.update_generation_status(page_id, "failed")
            _safe_refund(
                feature="store_creation",
                user_id=user_id,
                reference_id=page_id,
                spend_ledger_id=spend_ledger_id,
                reason="page_update_failed",
            )

    except Exception as e:
        logger.error(f"Error in store generation task for page_id={page_id}: {str(e)}")
        if page_id:
            try:
                document_store.update_generation_status(page_id, "failed")
            except Exception as status_error:
                logger.error(f"Error updating store status to failed: {status_error}")
            _safe_refund(
                feature="store_creation",
                user_id=user_id,
                reference_id=page_id,
                spend_ledger_id=spend_ledger_id,
                reason="store_generation_exception",
            )

