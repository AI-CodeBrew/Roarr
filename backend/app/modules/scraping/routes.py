"""
Scraping Routes: Product import from URL endpoints
"""
from flask import Blueprint, request, jsonify
import re
import logging
from ..auth.utils import require_shopify_auth
from .utils.main_scraper import scrape_product_from_url

logger = logging.getLogger(__name__)

# Create Blueprint for scraping routes
scraping_bp = Blueprint('scraping', __name__)

def is_valid_product_url(url: str) -> tuple[bool, str]:
    """
    Validate if the provided URL is a valid product URL
    from AliExpress, Amazon, Alibaba, MyZambeel, or Shopify.
    Each platform only accepts its own URLs.
    
    Returns:
        tuple: (is_valid, platform_name or error_message)
    """
    # Known non-Shopify domains to exclude
    non_shopify_domains = ['amazon', 'alibaba', 'aliexpress', 'myzambeel']
    
    # Check specific platforms first (order matters - check specific ones before Shopify)
    specific_patterns = {
        "amazon": (
            r"^https?:\/\/(www\.)?amazon\.[a-z.]+\/.*(dp|gp\/product)\/[A-Z0-9]{8,10}",
            "Amazon URLs only. Example: https://amazon.com/dp/B08N5WRWNW"
        ),
        "aliexpress": (
            r"^https?:\/\/(www\.)?aliexpress\.[a-z.]+\/item\/\d+\.html",
            "AliExpress URLs only. Example: https://aliexpress.com/item/1005004567890123.html"
        ),
        "alibaba": (
            r"^https?:\/\/(www\.)?alibaba\.com\/product-detail\/[^\/]+_\d+\.html",
            "Alibaba URLs only. Example: https://alibaba.com/product-detail/Product-Name_1234567890.html"
        ),
        "myzambeel": (
            r"^https?:\/\/(www\.)?myzambeel\.com\/products\/[a-zA-Z0-9\-\_]+",
            "MyZambeel URLs only. Example: https://myzambeel.com/products/product-name"
        )
    }

    # Check specific platforms first
    for site, (pattern, example) in specific_patterns.items():
        if re.match(pattern, url, re.IGNORECASE):
            return True, site
    
    # Check for Shopify: URLs with /products/ path that aren't from known non-Shopify domains
    # This handles both .myshopify.com domains and custom domains
    # Supports both /products/... and /collections/.../products/... patterns
    shopify_pattern = r"^https?:\/\/[^\/]+(?:\/collections\/[^\/]+)?\/products\/[a-zA-Z0-9\-\_]+"
    if re.match(shopify_pattern, url, re.IGNORECASE):
        # Extract domain to check if it's a known non-Shopify domain
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc.replace('www.', '')
            # Check if domain contains any known non-Shopify domain
            is_non_shopify = any(non_shopify in domain for non_shopify in non_shopify_domains)
            if not is_non_shopify:
                return True, "shopify"
        except Exception:
            # If parsing fails, still try to match the pattern
            pass
    
    # If no match, provide helpful error message
    return False, "Invalid URL format. Please provide a valid product URL from Amazon, AliExpress, Alibaba, MyZambeel, or Shopify."

@scraping_bp.route('/api/import-from-url', methods=['POST'])
@require_shopify_auth
def import_from_url():
    """Receive product URL, scrape it, and return the scraped data"""


    # aa = {
    #     "success": True,
    #     "data": {
    #         "message": "Successfully scraped product data from: https://www.aliexpress.com/item/1005009935392993.html",
    #         "product_data": {
    #             "category": "General",
    #             "description": [
    #                 "Smarter Shopping, Better Living! Aliexpress.com"
    #             ],
    #             "images": [
    #                 "https://ae01.alicdn.com/kf/S42063313190046de9b3686f4c7bf32deT.jpg",
    #                 "https://ae01.alicdn.com/kf/Sca723763c9dc4ca8b982a3589c2b75a3y.jpg",
    #                 "https://ae01.alicdn.com/kf/S4051db7754444ba89b43516eb7f11832j.jpg",
    #                 "https://ae01.alicdn.com/kf/Sdccaedca78574f3d869ba39e2351d3fer.jpg",
    #                 "https://ae01.alicdn.com/kf/S9136a3d8eed64eb999315bb89ba9feffe.jpg",
    #                 "https://ae01.alicdn.com/kf/S200a0daaabe0474b802f5c7a54d9096eN.jpg"
    #             ],
    #             "name": "Vichy Anti-dandruff Anti-itch Shampoo Refreshing Nourishing Fluffy Shampoo Soothing Damaged Hair Damaged Scalp Care Shampoo",
    #             "price": "0.00",
    #             "tags": "",
    #             "title": "Vichy Anti-dandruff Anti-itch Shampoo Refreshing Nourishing Fluffy Shampoo Soothing Damaged Hair Damaged Scalp Care Shampoo"
    #         },
    #         "success": True
    #     }
    # }
    # return jsonify(aa)
    try:
        data = request.get_json()
        if not data or not data.get('product_url'):
            return jsonify({
                'success': False,
                'error': 'Product URL is required'
            }), 400
        
        product_url = data['product_url']
        product_url = product_url.split("?")[0]
        source = data.get('source')
        
        # Validate URL format before attempting to scrape
        is_valid, detected_platform = is_valid_product_url(product_url)
        if not is_valid:
            logger.error(f"Invalid URL format: {product_url}")
            return jsonify({
                'success': False,
                'error': detected_platform
            }), 400
        
        # If source is provided, validate it matches the detected platform
        if source:
            source_lower = source.lower()
            if source_lower != detected_platform:
                logger.error(f"Source mismatch: provided source '{source}' (lowered: '{source_lower}') does not match detected platform '{detected_platform}' for URL: {product_url}")
                return jsonify({
                    'success': False,
                    'error': f"Source mismatch: URL is for {detected_platform}, but source was specified as {source}"
                }), 400
        
        # Scrape the product URL
        scrape_result = scrape_product_from_url(product_url)
        print(scrape_result)
        
        if not scrape_result.get('success'):
            error_msg = scrape_result.get('error', 'Unknown error')
            logger.error(f"Scraping failed for URL {product_url}: {error_msg}")
            return jsonify({
                'success': False,
                'error': "Couldn't import the product. Please try again or use a different URL."
            }), 400
        
        scraped_data = scrape_result.get('product', {})
        platform = scrape_result.get('platform', '').lower()
        
        # Extract and format the scraped data for the frontend
        product_data = {
            'title': scraped_data.get('title', ''),
            'name': scraped_data.get('title', ''),  # Alternative field name
            'description': scraped_data.get('description', ''),
            'price': scraped_data.get('price', '0.00'),
            'category': scraped_data.get('category', 'General'),
            'tags': scraped_data.get('tags', ''),
            'images': scraped_data.get('images', [])
        }
        
        # Validate that products have images (required for all platforms)
        if not product_data['images']:
            platform_name = platform.title() if platform else 'the platform'
            error_msg = f'Failed to extract product images from {platform_name}. Please try a different product URL.'
            logger.error(f"{platform_name} scraping failed - no images extracted for URL: {product_url}")
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # Log the scraped data for debugging
        if product_data['images']:
            logger.info(f"First image URL: {product_data['images'][0]}")
        
        return jsonify({
            'success': True,
            'product_data': product_data,
            'message': f'Successfully scraped product data from: {product_url}'
        })
    except Exception as e:
        logger.error(f"Error in import_from_url: {str(e)}")
        return jsonify({
            'success': False,
            'error': "Couldn't import the product. Please try again or use a different URL."
        }), 500

