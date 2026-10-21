"""
Image upload handler for Shopify integration.
Handles uploading AI-generated images to Shopify and updating template JSON.
"""

import logging
import uuid
import time
from typing import Dict, List, Any, Optional
# Template-specific mappings are now loaded dynamically
from ..shopify_utils import ShopifyUtils

logger = logging.getLogger(__name__)

class ImageUploadHandler:
    """Handles image uploads to Shopify and JSON template updates"""
    
    def __init__(self):
        self.shopify_utils = ShopifyUtils()
    
    def extract_product_images_from_magic_response(self, magic_response: Dict[str, Any]) -> List[str]:
        """
        Extract product image URLs from magic_response structure.
        New structure: { "text": {...}, "images": {"product_images": {...}, "body_images": {...}} }
        
        Args:
            magic_response: The magic response containing generated content
            
        Returns:
            List of product image URLs
        """
        product_image_urls = []
        
        if not magic_response:
            logger.warning("No magic_response provided")
            return product_image_urls
        
        try:
            # Check if magic_response has the new structure with 'images' key
            images_dict = None
            if isinstance(magic_response, dict):
                if 'images' in magic_response:
                    images_dict = magic_response['images']
                else:
                    # Fallback: maybe the whole response is the images dict (old structure)
                    images_dict = magic_response
            
            if not images_dict or not isinstance(images_dict, dict):
                logger.warning("No images dictionary found in magic_response")
                return product_image_urls
            
            # Check for new structure: images["product_images"]
            if 'product_images' in images_dict:
                product_images_dict = images_dict['product_images']
                if isinstance(product_images_dict, dict):
                    # Extract all URLs from product_images dictionary
                    for key, value in product_images_dict.items():
                        if isinstance(value, str) and value.strip():
                            if value.startswith('http://') or value.startswith('https://'):
                                product_image_urls.append(value)
                                logger.debug(f"Found product image: {key} -> {value[:50]}...")
            else:
                # Fallback: old structure - look for keys containing "product_image"
                for key, value in images_dict.items():
                    if isinstance(value, str) and value.strip():
                        if 'product_image' in key.lower():
                            if value.startswith('http://') or value.startswith('https://'):
                                product_image_urls.append(value)
                                logger.debug(f"Found product image (old structure): {key} -> {value[:50]}...")
            
            # Filter out empty URLs
            product_image_urls = [url for url in product_image_urls if url and url.strip()]
            
            logger.info(f"Extracted {len(product_image_urls)} product image URLs from magic_response")
            
        except Exception as e:
            logger.error(f"Error extracting product images from magic_response: {e}")
        
        return product_image_urls

    def extract_non_product_images_from_magic_response(self, magic_response: Dict[str, Any]) -> Dict[str, str]:
        """
        Extract non-product (body) image URLs from magic_response structure.
        New structure: { "text": {...}, "images": {"product_images": {...}, "body_images": {...}} }
        
        Args:
            magic_response: The magic response containing generated content
            
        Returns:
            Dictionary mapping image field names to their URLs (body images only)
        """
        image_urls = {}
        
        if not magic_response:
            logger.warning("No magic_response provided")
            return image_urls
        
        try:
            # Check if magic_response has the new structure with 'images' key
            images_dict = None
            if isinstance(magic_response, dict):
                if 'images' in magic_response:
                    images_dict = magic_response['images']
                else:
                    # Fallback: maybe the whole response is the images dict (old structure)
                    images_dict = magic_response
            
            if not images_dict or not isinstance(images_dict, dict):
                logger.warning("No images dictionary found in magic_response")
                return image_urls
            
            # Check for new structure: images["body_images"]
            if 'body_images' in images_dict:
                body_images_dict = images_dict['body_images']
                if isinstance(body_images_dict, dict):
                    # Extract all URLs from body_images dictionary
                    for key, value in body_images_dict.items():
                        if isinstance(value, str) and value.strip():
                            if value.startswith('http://') or value.startswith('https://'):
                                image_urls[key] = value
                                logger.debug(f"Found body image: {key} -> {value[:50]}...")
            else:
                # Fallback: old structure - look for keys that do NOT contain "product_image"
                for key, value in images_dict.items():
                    if isinstance(value, str) and value.strip():
                        if 'product_image' not in key.lower():
                            if value.startswith('http://') or value.startswith('https://'):
                                image_urls[key] = value
                                logger.debug(f"Found template image (old structure): {key} -> {value[:50]}...")
            
            # Filter out empty URLs and log results
            image_urls = {k: v for k, v in image_urls.items() if v and v.strip()}
            
            logger.info(f"Extracted {len(image_urls)} body image URLs from magic_response")
            logger.info(f"Image types found: {list(image_urls.keys())}")
            
        except Exception as e:
            logger.error(f"Error extracting body images from magic_response: {e}")
        
        return image_urls
    
    def upload_non_product_images_to_shopify(self, image_urls: Dict[str, str], user_id: str) -> Dict[str, str]:
        """
        Upload images to Shopify and return mapping of image types to Shopify URLs.
        
        Args:
            image_urls: Dictionary mapping image types to their URLs
            user_id: User ID for authentication
            
        Returns:
            Dictionary mapping image types to Shopify URLs
        """
        shopify_urls = {}
        upload_results = []
        
        logger.info(f"Starting upload of {len(image_urls)} images to Shopify")
        
        for image_type, image_url in image_urls.items():
            try:
                logger.info(f"Uploading {image_type}: {image_url[:50]}...")
                
                # Generate filename with 8-character unique prefix
                unique_prefix = str(uuid.uuid4().hex[:8])
                filename = f"{unique_prefix}_{image_type}.png"
                
                # Upload to Shopify
                result = self.shopify_utils.upload_image_to_shopify(
                    image_url=image_url,
                    filename=filename,
                    alt_text=f"AI Generated {image_type.replace('_', ' ').title()}",
                    user_id=user_id
                )
                
                if result.get('success'):
                    # Check if we have a direct image URL
                    shopify_url = result.get('image_url')
                    
                    if shopify_url:
                        # Convert to shopify:// format if needed
                        if shopify_url.startswith('https://'):
                            # Extract filename from URL for shopify:// format
                            filename = result.get('filename', filename)
                            shopify_url = f"shopify://shop_images/{filename}"
                        
                        shopify_urls[image_type] = shopify_url
                        logger.info(f"✅ Successfully uploaded {image_type}: {shopify_url}")
                    else:
                        # Upload was successful but image URL not immediately available
                        # Use the filename to construct shopify:// URL
                        filename = result.get('filename', filename)
                        shopify_url = f"shopify://shop_images/{filename}"
                        shopify_urls[image_type] = shopify_url
                        logger.info(f"✅ Successfully uploaded {image_type} (URL pending): {shopify_url}")
                else:
                    logger.error(f"❌ Failed to upload {image_type}: {result.get('error', 'Unknown error')}")
                
                upload_results.append({
                    'image_type': image_type,
                    'success': result.get('success', False),
                    'shopify_url': shopify_urls.get(image_type),
                    'error': result.get('error')
                })
                
            except Exception as e:
                logger.error(f"Error uploading {image_type}: {e}")
                upload_results.append({
                    'image_type': image_type,
                    'success': False,
                    'shopify_url': None,
                    'error': str(e)
                })
        
        # Log summary
        successful_uploads = sum(1 for r in upload_results if r['success'])
        failed_uploads = len(upload_results) - successful_uploads
        
        logger.info(f"Image upload summary: {successful_uploads} successful, {failed_uploads} failed")
        
        return shopify_urls
        
    def create_new_product_with_images(self, magic_response: Dict[str, Any], user_id: str) -> Optional[str]:
        """
        Create a new Shopify product with generated content and images.
        
        Args:
            magic_response: The magic response containing generated content
            user_id: User ID for Shopify API calls
            
        Returns:
            New product ID if successful, None if failed
        """
        try:
            logger.info("Creating new product with generated content and images")
            
            # Extract product images
            product_image_urls = self.extract_product_images_from_magic_response(magic_response)
            logger.info(f"Found {len(product_image_urls)} product images for new product")
            
            # Get product title and subtitle from text content if available
            product_title = "Generated Product"
            product_subtitle = ""
            if isinstance(magic_response, dict):
                # Try new structure first: magic_response['text']
                if 'text' in magic_response:
                    text_content = magic_response['text']
                    if isinstance(text_content, dict):
                        product_title = text_content.get("product_title", product_title)
                        product_subtitle = text_content.get("product_subtitle", "")
                # Fallback: old structure
                elif 'product_title' in magic_response:
                    product_title = magic_response.get("product_title", product_title)
                    product_subtitle = magic_response.get("product_subtitle", "")
            
            # Prepare product data for create_product
            product_data = {
                "title": product_title,
                "description": product_subtitle,
                "body_html": product_subtitle,
                "price": "0.00",
                "status": "draft",  # Create as draft, will be published later
                "vendor": "Roarr",
                "product_type": "Generated Product",
                "images": product_image_urls
            }
            
            # Create the product using ShopifyUtils
            new_product = self.shopify_utils.create_product(product_data, user_id)
            
            if new_product and new_product.get('id'):
                new_product_id = str(new_product['id'])
                logger.info(f"✅ Successfully created new product with ID: {new_product_id}")
                
                # Attach product images immediately via productCreateMedia
                if product_image_urls:
                    images_payload = [{ 'url': url, 'alt': f"Product Image {idx+1}" } for idx, url in enumerate(product_image_urls)]
                    try:
                        media_result = self.shopify_utils.create_media_images_for_product(new_product_id, images_payload, user_id)
                        if media_result.get('success'):
                            logger.info(f"✅ Attached {int(media_result.get('media_count') or 0)} product images to {new_product_id}")
                            if media_result.get('media_user_errors'):
                                logger.warning(f"Media user errors: {media_result.get('media_user_errors')}")
                        else:
                            logger.warning(f"⚠️ Failed attaching product images: {media_result.get('error')}")
                    except Exception as e:
                        logger.warning(f"⚠️ Error attaching product images: {e}")
                return new_product_id
            else:
                logger.error("❌ Failed to create new product - no ID returned")
                return None
                
        except Exception as e:
            logger.error(f"Error creating new product: {e}")
            return None

    def update_existing_product_with_images(
        self,
        product_id: str,
        magic_response: Dict[str, Any],
        user_id: str,
        replace_images: bool = True,
    ) -> Dict[str, Any]:
        """
        Update an existing Shopify product's title/description and optionally replace its images.

        - If replace_images=True: delete existing product image media then add new images.
        - If no new images are present in magic_response, images are left unchanged.
        """
        try:
            if not product_id:
                return {"success": False, "error": "product_id is required"}

            # Extract title/description from magic_response text
            product_title = None
            product_description = None
            if isinstance(magic_response, dict):
                text_content = magic_response.get("text") if isinstance(magic_response.get("text"), dict) else None
                if text_content:
                    product_title = text_content.get("product_title") or text_content.get("title")
                    product_description = (
                        text_content.get("product_description")
                        or text_content.get("product_subtitle")
                        or text_content.get("description")
                    )
                else:
                    # Fallback (older shape)
                    product_title = magic_response.get("product_title") or magic_response.get("title")
                    product_description = (
                        magic_response.get("product_description")
                        or magic_response.get("product_subtitle")
                        or magic_response.get("description")
                    )

            # Update product fields (title + descriptionHtml)
            update_payload: Dict[str, Any] = {"id": product_id}
            if product_title is not None:
                update_payload["title"] = product_title
            if product_description is not None:
                update_payload["body_html"] = product_description

            updated = None
            if len(update_payload.keys()) > 1:
                updated = self.shopify_utils.update_product(update_payload, user_id)
                logger.info(f"✅ Updated product fields for product_id={product_id}")
            else:
                logger.info("No title/description found to update; skipping productUpdate")

            # Replace product images (delete old, add new)
            product_image_urls = self.extract_product_images_from_magic_response(magic_response)
            if replace_images and product_image_urls:
                # Replace images means: delete previous, then add new
                # Prefer official GraphQL productDeleteMedia; fall back to REST if needed.
                deleted_any = False
                should_fallback_to_rest = True

                existing_media_ids = self.shopify_utils.get_product_media_image_ids(
                    product_id, user_id, first=100
                )
                if existing_media_ids:
                    delete_media_result = self.shopify_utils.delete_product_media(
                        product_id, existing_media_ids, user_id
                    )

                    deleted_count = int(delete_media_result.get("deleted_count") or 0)
                    errors = delete_media_result.get("errors") or delete_media_result.get("error") or []

                    if deleted_count > 0:
                        deleted_any = True
                        should_fallback_to_rest = False
                        logger.info(
                            f"✅ Deleted {deleted_count} existing media image(s) via GraphQL"
                        )
                    else:
                        # If Shopify says "media ids ... do not exist", this is effectively "nothing to delete" for GraphQL.
                        # We'll quietly fall back to REST to ensure the product images are actually cleared.
                        msg = str(errors)
                        if "do not exist" in msg:
                            logger.info(
                                "GraphQL delete reported non-existent media IDs; falling back to REST image deletion."
                            )
                        else:
                            logger.warning(
                                f"⚠️ GraphQL media delete had issues; falling back to REST image deletion. Error={errors}"
                            )

                # REST fallback (reliable for product image replacement)
                if should_fallback_to_rest:
                    delete_result = self.shopify_utils.delete_all_product_images(
                        product_id, user_id
                    )
                    if delete_result.get("deleted_count", 0) > 0:
                        deleted_any = True
                    if not delete_result.get("success"):
                        logger.warning(
                            f"⚠️ Failed to delete some existing images for product_id={product_id}. "
                            f"Deleted={delete_result.get('deleted_count', 0)} Failed={len(delete_result.get('failed') or [])}"
                        )
                    elif deleted_any:
                        logger.info(
                            f"✅ Deleted {delete_result.get('deleted_count', 0)} existing product images via REST"
                        )

                # Add new images
                images_payload = [
                    {"url": url, "alt": f"Product Image {idx + 1}"}
                    for idx, url in enumerate(product_image_urls)
                ]
                media_result = self.shopify_utils.create_media_images_for_product(product_id, images_payload, user_id)
                if not media_result.get("success"):
                    logger.warning(f"⚠️ Failed to add new images: {media_result.get('error')}")
                else:
                    logger.info(
                        f"✅ Added {int(media_result.get('media_count') or 0)} new image(s) to product_id={product_id}"
                    )
                return {
                    "success": True,
                    "product_id": str(product_id),
                    "updated_product": updated,
                    "replaced_images": True,
                    "new_images_count": len(product_image_urls),
                }

            if replace_images and not product_image_urls:
                logger.info("No new product images found in magic_response; leaving existing images unchanged")

            return {
                "success": True,
                "product_id": str(product_id),
                "updated_product": updated,
                "replaced_images": False,
                "new_images_count": len(product_image_urls),
            }

        except Exception as e:
            logger.error(f"Error updating existing product with images: {e}")
            return {"success": False, "error": str(e)}

    def process_images_for_template(self, magic_response: Dict[str, Any], template_data: Dict[str, Any], user_id: str, product_id: str = None, category: str = None, template_number: int = None) -> bool:
        """
        Complete image processing pipeline: extract, upload, and update template.
        
        Args:
            magic_response: The magic response containing generated content
            template_data: The template JSON data to update
            user_id: User ID for authentication
            product_id: Shopify product ID for uploading product images
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info("Starting complete image processing pipeline")
            
            # Step 1: Product images are handled during product creation; skip here
            
            # Step 2: Process template images (upload to Shopify and update JSON)
            template_image_urls = self.extract_non_product_images_from_magic_response(magic_response)
            
            if not template_image_urls:
                logger.warning("No template images found to process")
                return True  # Return success if no template images to process
            
            # Step 3: Upload template images to Shopify
            shopify_urls = self.upload_non_product_images_to_shopify(template_image_urls, user_id)
            
            if not shopify_urls:
                logger.error("No template images were successfully uploaded to Shopify")
                return False
            
            # Step 4: Images uploaded successfully (template JSON updates no longer needed)
                logger.info("✅ Image processing pipeline completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error in image processing pipeline: {e}")
            return False

    def _get_file_extension_from_url(self, url: str) -> str:
        """
        Extract file extension from URL or default to .png
        
        Args:
            url: Image URL
            
        Returns:
            File extension with dot (e.g., '.png', '.jpg')
        """
        try:
            # Try to extract extension from URL
            if '.' in url:
                # Get the part after the last dot
                extension = url.split('.')[-1].lower()
                # Validate it's a common image extension
                if extension in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
                    return f'.{extension}'
            
            # Default to .png if no valid extension found
            return '.png'
        except Exception as e:
            logger.warning(f"Error extracting file extension from URL {url}: {e}")
            return '.png'
