import re
import requests
from typing import Dict, Any, Optional, Tuple
from urllib.parse import urlparse, parse_qs


# ScraperAPI supported Amazon TLDs
SUPPORTED_TLDS = [
    "ae", "ca", "cn", "co.jp", "co.uk", "com", "com.au", "com.be",
    "com.br", "com.mx", "com.tr", "de", "eg", "es", "fr", "in",
    "it", "nl", "pl", "sa", "se", "sg"
]

# All valid country codes (ScraperAPI supported)
VALID_COUNTRY_CODES = [
    "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "ar", "as", "at", "au",
    "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj",
    "bl", "bm", "bn", "bo", "bq", "br", "bs", "bt", "bw", "by", "bz", "ca",
    "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr",
    "cu", "cv", "cw", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec",
    "ee", "eg", "er", "es", "et", "fi", "fj", "fk", "fm", "fo", "fr", "ga",
    "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq",
    "gr", "gt", "gu", "gw", "gy", "hk", "hn", "hr", "ht", "hu", "id", "ie",
    "il", "im", "in", "io", "is", "it", "je", "jm", "jo", "jp", "ke", "kg",
    "kh", "km", "kn", "kr", "kw", "ky", "kz", "la", "lc", "li", "lk", "lr",
    "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mf", "mg", "mh",
    "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv",
    "mw", "mx", "my", "mz", "na", "nc", "ne", "ng", "ni", "nl", "no", "np",
    "nz", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pr", "ps", "pt",
    "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd",
    "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "ss",
    "st", "sv", "sx", "sy", "sz", "tc", "td", "th", "tj", "tl", "tm", "tn",
    "to", "tr", "tv", "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va",
    "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "ye", "yt", "za", "zm", "zw"
]

# Special TLD to country code mappings (where they differ)
TLD_TO_COUNTRY_CODE = {
    "co.uk": "gb",      # United Kingdom uses 'gb' country code
    "co.jp": "jp",      # Japan
    "com.au": "au",     # Australia
    "com.be": "be",     # Belgium
    "com.br": "br",     # Brazil
    "com.mx": "mx",     # Mexico
    "com.tr": "tr",     # Turkey
    "com": "us",        # Default .com is US
}


def get_amazon_region(url: str) -> Optional[Tuple[str, str]]:
    """
    Dynamically extract the Amazon country code and TLD from any Amazon URL.
    
    This function handles ALL Amazon domains by:
    1. Extracting the TLD from the domain
    2. Validating it's in the supported TLD list
    3. Deriving the country code from the TLD
    
    Args:
        url: Amazon product URL from any region
        
    Returns:
        Tuple of (country_code, tld) e.g., ('br', 'com.br') or None if not Amazon
    """
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc.replace('www.', '')
        
        # Check if it's an Amazon domain
        if not domain.startswith('amazon.'):
            return None
        
        # Extract TLD (everything after 'amazon.')
        tld = domain.replace('amazon.', '')
        
        # Check if this TLD is supported by ScraperAPI
        if tld not in SUPPORTED_TLDS:
            # If not in supported list, default to .com (US)
            tld = 'com'
        
        # Determine country code from TLD
        if tld in TLD_TO_COUNTRY_CODE:
            country_code = TLD_TO_COUNTRY_CODE[tld]
        else:
            # For simple TLDs like 'de', 'fr', 'it', etc., the country code is the TLD itself
            country_code = tld
        
        # Validate country code
        if country_code not in VALID_COUNTRY_CODES:
            # Fallback to US if invalid
            country_code = 'us'
            tld = 'com'
        
        return (country_code, tld)
        
    except Exception as e:
        # If anything goes wrong, return None
        return None


def extract_asin_from_url(url: str) -> Optional[str]:
    """
    Extract ASIN (Amazon Standard Identification Number) from an Amazon product URL.
    
    ASINs are typically 10-character alphanumeric codes.
    Supports various Amazon URL formats:
    - https://www.amazon.com/dp/B07FTKQ97Q
    - https://www.amazon.com/product/B07FTKQ97Q
    - https://www.amazon.com/gp/product/B07FTKQ97Q
    - https://www.amazon.com/Product-Title/dp/B07FTKQ97Q/ref=...
    - https://www.amazon.co.uk/dp/B07FTKQ97Q (and other country domains)
    
    Args:
        url: Amazon product URL
        
    Returns:
        ASIN string or None if not found
    """
    try:
        # Pattern 1: /dp/ASIN or /product/ASIN or /gp/product/ASIN
        match = re.search(r'/(?:dp|product|gp/product)/([A-Z0-9]{10})', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Pattern 2: ASIN in query parameters
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        if 'asin' in query_params:
            asin = query_params['asin'][0]
            if len(asin) == 10 and asin.isalnum():
                return asin
        
        # Pattern 3: /exec/obidos/ASIN/
        match = re.search(r'/exec/obidos/ASIN/([A-Z0-9]{10})', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Pattern 4: Look for any 10-character alphanumeric code that starts with B
        # This is a fallback for uncommon URL formats
        match = re.search(r'\b(B[A-Z0-9]{9})\b', url)
        if match:
            return match.group(1)
        
        return None
        
    except Exception as e:
        print(f"Error extracting ASIN from URL {url}: {str(e)}")
        return None


def extract_product(url: str, api_key: str) -> Dict[str, Any]:
    """
    Extract product information from Amazon using ScraperAPI's structured data endpoint.
    Supports all Amazon regions worldwide.
    
    Args:
        url: Amazon product URL from any region
        api_key: ScraperAPI key
        
    Returns:
        Dictionary with product data:
        - url: Original URL
        - title: Product name
        - description: Product description (combined from available fields)
        - image_urls: List of product images
        - price: Product price (if available)
        - rating: Average rating (if available)
        - reviews_count: Number of reviews (if available)
        - asin: Amazon ASIN
        - country_code: Amazon country code (e.g., 'us', 'br', 'uk')
        - tld: Amazon TLD (e.g., 'com', 'com.br', 'co.uk')
    """
    # Extract ASIN from URL
    asin = extract_asin_from_url(url)
    if not asin:
        raise ValueError(f"Could not extract ASIN from URL: {url}")
    
    # Get Amazon region (country code and TLD)
    region = get_amazon_region(url)
    country_code = region[0] if region else 'us'
    tld = region[1] if region else 'com'
    
    # Call ScraperAPI structured endpoint
    endpoint = "https://api.scraperapi.com/structured/amazon/product/v1"
    payload = {
        'api_key': api_key,
        'asin': asin,
        'country_code': country_code,
        'tld': tld
    }
    
    try:
        response = requests.get(endpoint, params=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch Amazon product data: {str(e)}")
    except ValueError as e:
        raise Exception(f"Failed to parse Amazon product response: {str(e)}")
    
    # Parse the response
    title = data.get('name') or data.get('title')
    
    # Build description from multiple fields
    description_parts = []
    
    if data.get('small_description'):
        description_parts.append(data['small_description'].strip())
    
    if data.get('full_description'):
        description_parts.append(data['full_description'].strip())
    
    # Add feature bullets
    feature_bullets = data.get('feature_bullets', [])
    if feature_bullets:
        description_parts.append("Features:\n" + "\n".join(f"• {bullet}" for bullet in feature_bullets))
    
    # Add product information
    product_info = data.get('product_information', {})
    if product_info and isinstance(product_info, dict):
        info_lines = []
        for key, value in product_info.items():
            if key not in ['best_sellers_rank', 'customer_reviews'] and value:
                # Format key nicely
                formatted_key = key.replace('_', ' ').title()
                if isinstance(value, list):
                    info_lines.append(f"{formatted_key}: {', '.join(str(v) for v in value)}")
                else:
                    info_lines.append(f"{formatted_key}: {value}")
        
        if info_lines:
            description_parts.append("Product Information:\n" + "\n".join(info_lines))
    
    # Get images
    images = data.get('images', [])
    if isinstance(images, list):
        # Filter out any invalid URLs
        images = [img for img in images if img and isinstance(img, str) and img.startswith('http')]
    else:
        images = []
    
    # Get pricing information
    price = data.get('pricing') or data.get('list_price') or None
    
    # Get rating information
    rating = data.get('average_rating')
    reviews_count = data.get('total_reviews')
    
    # Build result
    result = {
        'url': url,
        'title': title,
        'description': '\n\n'.join(description_parts) if description_parts else None,
        'image_urls': images,
        'asin': asin,
        'country_code': country_code,
        'tld': tld,
    }
    
    # Add optional fields if available
    if price:
        result['price'] = price
    if rating:
        result['rating'] = rating
    if reviews_count:
        result['reviews_count'] = reviews_count
    
    # Add product category if available
    if data.get('product_category'):
        result['category'] = data['product_category']
    
    # Add brand if available
    if data.get('brand'):
        result['brand'] = data['brand']
    
    # Translate to English if needed (using generic translation utility)
    try:
        from ..translation_utils import ensure_english_product_data
        result = ensure_english_product_data(result)
    except Exception as e:
        # If translation fails, just log and continue with original data
        print(f"Translation skipped: {str(e)}")
    
    return result

