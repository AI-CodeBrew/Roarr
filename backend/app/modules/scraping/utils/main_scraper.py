import os
import logging
from typing import Dict, Any
from urllib.parse import urlparse

from .alibaba_parser import extract_product as alibaba_extract_product
from .amazon_parser import extract_product as amazon_extract_product
from .aliexpress_parser import extract_product as aliexpress_extract_product
from .shopify_parser import extract_product as shopify_extract_product

logger = logging.getLogger(__name__)

# ScraperAPI key from environment
SCRAPERAPI_KEY = os.environ.get("SCRAPER_API_KEY", "")


def detect_platform(url: str) -> str:
    """
    Detect which e-commerce platform a URL belongs to.
    
    Args:
        url: Product URL
        
    Returns:
        Platform name: 'alibaba', 'aliexpress', 'amazon', 'shopify', or 'unknown'
    """
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc
        path = parsed.path.lower()
        
        # Check specific platforms first (order matters)
        if 'alibaba.com' in domain:
            return 'alibaba'
        elif 'aliexpress.com' in domain or 'aliexpress.us' in domain:
            return 'aliexpress'
        elif 'amazon.' in domain:
            return 'amazon'
        elif '/products/' in path:
            # Check for Shopify: /products/ path indicates Shopify store
            # Supports both /products/... and /collections/.../products/... patterns
            # Exclude known non-Shopify domains that might also use /products/
            non_shopify_domains = ['amazon', 'alibaba', 'aliexpress']
            is_non_shopify = any(non_shopify in domain for non_shopify in non_shopify_domains)
            if not is_non_shopify:
                return 'shopify'
        elif 'myshopify.com' in domain:
            # Explicit .myshopify.com domain
            return 'shopify'
        else:
            return 'unknown'
    except Exception as e:
        logger.error(f"Error detecting platform for URL {url}: {str(e)}")
        return 'unknown'


def scrape_product_from_url(product_url: str) -> Dict[str, Any]:
    """
    Scrape product information from a given URL.
    
    Args:
        product_url: The product URL to scrape
        
    Returns:
        Dictionary with:
        - success (bool): Whether scraping was successful
        - product (dict): Product data with title, images, description
        - error (str): Error message if scraping failed
    """
    if not SCRAPERAPI_KEY:
        logger.error("SCRAPERAPI_KEY not found in environment variables")
        return {
            'success': False,
            'error': 'ScraperAPI key not configured'
        }
    
    if not product_url:
        return {
            'success': False,
            'error': 'No product URL provided'
        }
    
    # Detect platform
    platform = detect_platform(product_url)
    logger.info(f"Detected platform: {platform} for URL: {product_url}")
    
    try:
        if platform == 'alibaba':
            raw_data = alibaba_extract_product(product_url, SCRAPERAPI_KEY)
            
            # Transform to expected format
            product_data = {
                'title': raw_data.get('title'),
                'images': raw_data.get('image_urls', []),
                'description': [raw_data.get('description')] if raw_data.get('description') else [],
                'url': raw_data.get('url', product_url),
                'platform': 'alibaba'
            }
            
            # Validate we got some data
            if not product_data['title'] and not product_data['images']:
                return {
                    'success': False,
                    'error': 'No product data could be extracted from the page'
                }
            
            return {
                'success': True,
                'product': product_data
            }
            
        elif platform == 'aliexpress':
            raw_data = aliexpress_extract_product(product_url, SCRAPERAPI_KEY)
            
            # Transform to expected format
            product_data = {
                'title': raw_data.get('title'),
                'images': raw_data.get('image_urls', []),
                'description': [raw_data.get('description')] if raw_data.get('description') else [],
                'url': raw_data.get('url', product_url),
                'platform': 'aliexpress'
            }
            
            # Validate we got some data
            if not product_data['title'] and not product_data['images']:
                return {
                    'success': False,
                    'error': 'No product data could be extracted from the page'
                }
            
            return {
                'success': True,
                'product': product_data
            }
            
        elif platform == 'amazon':
            raw_data = amazon_extract_product(product_url, SCRAPERAPI_KEY)
            
            # Transform to expected format
            description_text = raw_data.get('description', '')
            description_list = [description_text] if description_text else []
            
            product_data = {
                'title': raw_data.get('title'),
                'images': raw_data.get('image_urls', []),
                'description': description_list,
                'url': raw_data.get('url', product_url),
                'platform': 'amazon',
                'asin': raw_data.get('asin'),
                'country_code': raw_data.get('country_code'),
                'tld': raw_data.get('tld')
            }
            
            # Add optional fields if present
            if raw_data.get('price'):
                product_data['price'] = raw_data['price']
            if raw_data.get('rating'):
                product_data['rating'] = raw_data['rating']
            if raw_data.get('reviews_count'):
                product_data['reviews_count'] = raw_data['reviews_count']
            if raw_data.get('brand'):
                product_data['brand'] = raw_data['brand']
            if raw_data.get('category'):
                product_data['category'] = raw_data['category']
            
            # Validate we got some data
            if not product_data['title'] and not product_data['images']:
                return {
                    'success': False,
                    'error': 'No product data could be extracted from the page'
                }
            
            return {
                'success': True,
                'product': product_data
            }
            
        elif platform == 'shopify':
            raw_data = shopify_extract_product(product_url, SCRAPERAPI_KEY)
            
            # Transform to expected format
            description_text = raw_data.get('description', '')
            description_list = [description_text] if description_text else []
            
            product_data = {
                'title': raw_data.get('title'),
                'images': raw_data.get('image_urls', []),
                'description': description_list,
                'url': raw_data.get('url', product_url),
                'platform': 'shopify'
            }
            
            # Add optional fields if present
            if raw_data.get('price'):
                product_data['price'] = raw_data['price']
            
            # Validate we got some data
            if not product_data['title'] and not product_data['images']:
                return {
                    'success': False,
                    'error': 'No product data could be extracted from the page'
                }
            
            return {
                'success': True,
                'product': product_data
            }
            
        else:
            return {
                'success': False,
                'error': f'Unsupported platform or invalid URL. Detected: {platform}'
            }
            
    except Exception as e:
        logger.error(f"Error scraping {platform} product from {product_url}: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': "Couldn't import the product."
        }


def search_products_on_platform(platform: str, search_query: str, max_pages: int = 1) -> Dict[str, Any]:
    """
    Search for products on a specific e-commerce platform.
    
    Args:
        platform: Platform to search ('alibaba', 'aliexpress', 'amazon')
        search_query: Search query string
        max_pages: Maximum number of pages to scrape (default: 1)
        
    Returns:
        Dictionary with:
        - success (bool): Whether search was successful
        - products (list): List of product URLs or data
        - error (str): Error message if search failed
    """
    if not SCRAPERAPI_KEY:
        logger.error("SCRAPERAPI_KEY not found in environment variables")
        return {
            'success': False,
            'error': 'ScraperAPI key not configured'
        }
    
    if not search_query:
        return {
            'success': False,
            'error': 'No search query provided'
        }
    
    platform_lower = platform.lower()
    
    try:
        if platform_lower == 'alibaba':
            # TODO: Implement Alibaba search
            return {
                'success': False,
                'error': 'Alibaba product search not yet implemented'
            }
            
        elif platform_lower == 'aliexpress':
            # TODO: Implement AliExpress search
            return {
                'success': False,
                'error': 'AliExpress product search not yet implemented'
            }
            
        elif platform_lower == 'amazon':
            # TODO: Implement Amazon search
            return {
                'success': False,
                'error': 'Amazon product search not yet implemented'
            }
            
        else:
            return {
                'success': False,
                'error': f'Unsupported platform: {platform}'
            }
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error searching {platform} for '{search_query}': {error_msg}", exc_info=True)
        return {
            'success': False,
            'error': f'Search error: {error_msg}'
        }

