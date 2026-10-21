"""
Shopify Core Utils: Utility functions for Shopify operations
"""
import requests
import base64
import mimetypes
import logging

logger = logging.getLogger(__name__)

def process_images(images):
    """
    Process images and convert all to base64 format for consistent Shopify handling.
    Returns a list of base64 images and temporary files for cleanup.
    """
    processed_images = []
    temp_files = []  # Keep track of temp files for cleanup
    
    for i, image_data in enumerate(images):
        if isinstance(image_data, str):
            if image_data.startswith('data:image'):
                # Already in base64 format, use as is
                processed_images.append(image_data)
                logger.info(f"Using existing base64 image {i+1}")
                
            elif image_data.startswith('http://') or image_data.startswith('https://'):
                # Convert URL image to base64
                try:
                    logger.info(f"Converting URL image {i+1} to base64: {image_data[:50]}...")
                    
                    # Download the image
                    response = requests.get(image_data, timeout=30)
                    response.raise_for_status()
                    
                    # Get content type
                    content_type = response.headers.get('content-type', 'image/jpeg')
                    
                    # Convert to base64
                    image_base64 = base64.b64encode(response.content).decode('utf-8')
                    base64_data = f"data:{content_type};base64,{image_base64}"
                    
                    processed_images.append(base64_data)
                    logger.info(f"Successfully converted URL image {i+1} to base64")
                    
                except Exception as e:
                    logger.error(f"Error converting URL image {i+1} to base64: {str(e)}")
                    # Skip this image if there's an error
                    continue
            else:
                # Handle file paths (if any)
                try:
                    logger.info(f"Converting file path image {i+1} to base64: {image_data}")
                    
                    with open(image_data, 'rb') as f:
                        image_data_bytes = f.read()
                    
                    # Determine mime type from file extension
                    ext = mimetypes.guess_type(image_data)[0] or 'image/jpeg'
                    
                    # Convert to base64
                    image_base64 = base64.b64encode(image_data_bytes).decode('utf-8')
                    base64_data = f"data:{ext};base64,{image_base64}"
                    
                    processed_images.append(base64_data)
                    logger.info(f"Successfully converted file path image {i+1} to base64")
                    
                except Exception as e:
                    logger.error(f"Error converting file path image {i+1} to base64: {str(e)}")
                    continue
        else:
            # Handle other types (dict, etc.)
            logger.warning(f"Skipping unknown image type {i+1}: {type(image_data)}")
            continue
    
    return processed_images, temp_files

