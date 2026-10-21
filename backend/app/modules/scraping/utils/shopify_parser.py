import os, re, json, time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

def scraperapi_get(target_url: str, api_key: str, **params) -> requests.Response:
    endpoint = "https://api.scraperapi.com"
    query = {
        "api_key": api_key,
        "url": target_url,
        "render": params.pop("render", "true"),
        "keep_headers": params.pop("keep_headers", "true"),
    }
    query.update({k: v for k, v in params.items() if v})
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
    resp = requests.get(endpoint, params=query, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp

def smart_fetch_html(url: str, api_key: str) -> str:
    attempts = [
        {"device_type": "desktop"},
        {"country_code": "US", "premium": "true", "device_type": "desktop"},
        {"country_code": "GB", "premium": "true", "device_type": "desktop", "session_number": "1"},
        {"country_code": "DE", "premium": "true", "device_type": "desktop", "session_number": "2"},
        {"country_code": "SG", "premium": "true", "device_type": "desktop", "keep_headers": "false"},
    ]
    last_exc = None
    for params in attempts:
        try:
            r = scraperapi_get(url, api_key, **params)
            html = r.text or ""
            if re.search(r"(page not found|access denied|robot check)", html, re.IGNORECASE):
                time.sleep(0.5)
                continue
            return html
        except Exception as e:
            last_exc = e
            time.sleep(0.4)
    if last_exc:
        raise last_exc
    return ""

def clean_text(t: Optional[str]) -> Optional[str]:
    if not t:
        return None
    return re.sub(r"\s+", " ", t).strip() or None

def to_absolute(u: str) -> str:
    if u.startswith("//"):
        return "https:" + u
    return u

def dedupe(seq: List[str]) -> List[str]:
    seen, out = set(), []
    for x in seq:
        x = x.strip()
        if x and x not in seen:
            out.append(x)
            seen.add(x)
    return out

def find_meta(soup: BeautifulSoup, *names) -> Optional[str]:
    for n in names:
        tag = soup.find("meta", attrs={"property": n}) or soup.find("meta", attrs={"name": n})
        if tag and tag.get("content"):
            return clean_text(tag["content"])
    return None

# Shopify CDN hosts
_HOST_ALLOW = ("cdn.shopify.com", "shopifycdn.com", "shopify.com")
_IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".avif")

def is_product_image_url(u: str, store_domain: Optional[str] = None) -> bool:
    u = to_absolute(u)
    try:
        p = urlparse(u)
    except Exception:
        return False
    
    # Exclude common non-product image patterns
    path_lower = (p.path or "").lower()
    exclude_patterns = [
        'logo', 'icon', 'banner', 'header', 'footer', 'nav', 'menu',
        'social', 'facebook', 'instagram', 'twitter', 'tiktok',
        'badge', 'ribbon', 'star', 'rating', 'review',
        'placeholder', 'default', 'empty', 'no-image',
        'favicon', 'apple-touch', 'og-image', 'meta-image'
    ]
    if any(pattern in path_lower for pattern in exclude_patterns):
        return False
    
    # Check if it's from Shopify CDN or the store's own domain
    host_ok = any(h in (p.netloc or "") for h in _HOST_ALLOW)
    if not host_ok and store_domain:
        # Also allow images from the store's own domain
        if store_domain in (p.netloc or ""):
            host_ok = True
    if not host_ok:
        return False
    
    # Must have valid image extension
    return any(ext in path_lower for ext in _IMG_EXTS)

def normalize_shopify_image(u: str) -> str:
    u = to_absolute(u)
    # Remove size handles like _1024x1024, _large, etc. if present before extension.
    u = re.sub(r"_(?:[0-9]+x[0-9]+|pico|icon|thumb|small|compact|medium|large|grande|original)(?=\.(?:jpe?g|png|webp|avif))", "", u, flags=re.IGNORECASE)
    # Strip query params like ?v=... &width=...
    u = re.sub(r"(\.(?:jpe?g|png|webp|avif))(\?.*)$", r"\1", u, flags=re.IGNORECASE)
    return u

def parse_jsonld_product(soup: BeautifulSoup) -> Dict[str, Any]:
    result = {"title": None, "description": None, "images": []}
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue
        objs = data if isinstance(data, list) else [data]
        for obj in objs:
            if not isinstance(obj, dict):
                continue
            t = obj.get("@type")
            if not (t == "Product" or (isinstance(t, list) and "Product" in t)):
                continue
            result["title"] = result["title"] or clean_text(obj.get("name"))
            result["description"] = result["description"] or clean_text(obj.get("description"))
            imgs = obj.get("image")
            if isinstance(imgs, list):
                result["images"].extend([i for i in imgs if isinstance(i, str)])
            elif isinstance(imgs, str):
                result["images"].append(imgs)
    return result

IMAGE_URL_REGEX = re.compile(
    r'((?:https?:)?//[^\s"\'\\]+?(?:cdn\.shopify\.com|shopifycdn\.com)[^\s"\'\\]*\.(?:jpe?g|png|webp|avif)(?:[^\s"\'\\]*)?)',
    re.IGNORECASE,
)

def parse_media_gallery(soup: BeautifulSoup) -> List[str]:
    urls: List[str] = []
    # Look inside <media-gallery> and its <img> tags
    for mg in soup.find_all("media-gallery"):
        for img in mg.find_all("img"):
            # src
            if img.get("src"):
                urls.append(img["src"])
            # srcset
            for att in ("srcset", "data-srcset"):
                ss = img.get(att)
                if ss:
                    for part in ss.split(","):
                        part = part.strip().split(" ")[0]
                        urls.append(part)
    # Also catch <slider-component> galleries
    for sc in soup.find_all("slider-component"):
        for img in sc.find_all("img"):
            if img.get("src"):
                urls.append(img["src"])
            for att in ("srcset", "data-srcset"):
                ss = img.get(att)
                if ss:
                    for part in ss.split(","):
                        part = part.strip().split(" ")[0]
                        urls.append(part)
    urls = [to_absolute(u) for u in urls]
    return urls

def parse_inline_json_media(soup: BeautifulSoup) -> List[str]:
    imgs: List[str] = []
    for sc in soup.find_all("script", attrs={"type": "application/json"}):
        raw = sc.string or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        def walk(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    kl = str(k).lower()
                    if kl in ("images", "media") and isinstance(v, list):
                        for item in v:
                            if isinstance(item, str):
                                imgs.append(item)
                            elif isinstance(item, dict):
                                for kk in ("src", "url", "preview_image"):
                                    if kk in item:
                                        val = item[kk]
                                        if isinstance(val, str):
                                            imgs.append(val)
                                        elif isinstance(val, dict):
                                            s = val.get("src")
                                            if isinstance(s, str):
                                                imgs.append(s)
                    walk(v)
            elif isinstance(obj, list):
                for el in obj:
                    walk(el)
        walk(data)
    imgs = [to_absolute(u) for u in imgs]
    return imgs

def fetch_shopify_product_json(product_url: str, api_key: str) -> List[str]:
    parsed = urlparse(product_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    path = parsed.path.rstrip("/")
    json_url = base + path + ".json"
    try:
        r = scraperapi_get(json_url, api_key, render="false", country_code="US")
        data = r.json()
    except Exception:
        return []
    imgs: List[str] = []
    prod = data.get("product") if isinstance(data, dict) else None
    if isinstance(prod, dict):
        if isinstance(prod.get("images"), list):
            for u in prod["images"]:
                if isinstance(u, str):
                    imgs.append(u)
                elif isinstance(u, dict) and isinstance(u.get("src"), str):
                    imgs.append(u["src"])
        if isinstance(prod.get("media"), list):
            for m in prod["media"]:
                if isinstance(m, dict):
                    if m.get("media_type") == "image":
                        if isinstance(m.get("src"), str):
                            imgs.append(m["src"])
                        prev = m.get("preview_image")
                        if isinstance(prev, dict) and isinstance(prev.get("src"), str):
                            imgs.append(prev["src"])
        if isinstance(prod.get("variants"), list):
            for v in prod["variants"]:
                if isinstance(v, dict):
                    fi = v.get("featured_image")
                    if isinstance(fi, dict) and isinstance(fi.get("src"), str):
                        imgs.append(fi["src"])
    imgs = [to_absolute(u) for u in imgs]
    return imgs

def parse_product_images_from_soup(soup: BeautifulSoup) -> List[str]:
    """
    Extract product images from specific product-related containers in the HTML.
    Focuses on product gallery areas and avoids general page images.
    """
    urls: List[str] = []
    
    # Look for product-specific containers
    product_selectors = [
        'product-media', 'product-gallery', 'product-images',
        'product-photos', 'product-slider', 'product-carousel',
        '[data-product-images]', '[data-product-media]',
        '.product__media', '.product__gallery', '.product__photos'
    ]
    
    for selector in product_selectors:
        containers = soup.select(selector)
        for container in containers:
            for img in container.find_all("img"):
                if img.get("src"):
                    urls.append(img["src"])
                for att in ("srcset", "data-srcset", "data-src"):
                    ss = img.get(att)
                    if ss:
                        if att == "srcset":
                            for part in ss.split(","):
                                part = part.strip().split(" ")[0]
                                urls.append(part)
                        else:
                            urls.append(ss)
    
    # Also check for images in product JSON data embedded in script tags
    # This is more reliable than scanning all images
    for script in soup.find_all("script", attrs={"type": "application/json"}):
        raw = script.string or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
            # Look for product-related data structures
            if isinstance(data, dict):
                # Check for product data
                product_data = data.get("product") or data.get("Product") or data.get("productData")
                if isinstance(product_data, dict):
                    # Extract images from product data
                    for key in ["images", "media", "photos", "gallery"]:
                        imgs = product_data.get(key)
                        if isinstance(imgs, list):
                            for img in imgs:
                                if isinstance(img, str):
                                    urls.append(img)
                                elif isinstance(img, dict):
                                    for img_key in ["src", "url", "originalSrc", "preview"]:
                                        if img_key in img and isinstance(img[img_key], str):
                                            urls.append(img[img_key])
        except Exception:
            continue
    
    urls = [to_absolute(u) for u in urls]
    return urls

def extract_product(url: str, api_key: str) -> Dict[str, Any]:
    """
    Extract product information from any Shopify store.
    
    Args:
        url: Product URL from a Shopify store
        api_key: ScraperAPI key
        
    Returns:
        Dictionary with product data:
        - url: Original URL
        - title: Product name
        - description: Product description
        - image_urls: List of product images
        - price: Product price (if available)
    """
    html = smart_fetch_html(url, api_key)
    soup = BeautifulSoup(html, "lxml")
    jd = parse_jsonld_product(soup)
    title = jd.get("title")
    description = jd.get("description")
    images: List[str] = []
    
    # Get store domain for image filtering
    parsed = urlparse(url)
    store_domain = parsed.netloc
    
    # Merge sources in order of reliability (most reliable first)
    # 1. JSON API - most reliable, official Shopify product data
    images += fetch_shopify_product_json(url, api_key)
    # 2. JSON-LD structured data - official product schema
    images += jd.get("images", [])
    # 3. Product-specific containers in HTML
    images += parse_product_images_from_soup(soup)
    # 4. Media galleries (product sliders/carousels)
    images += parse_media_gallery(soup)
    # 5. Inline JSON media (less reliable but still product-focused)
    images += parse_inline_json_media(soup)
    
    # Title/description fallbacks
    if not title:
        title = find_meta(soup, "og:title", "twitter:title", "title")
    if not title:
        h = soup.find(["h1", "h2"]) 
        title = clean_text(h.get_text(strip=True)) if h else None
    if not description:
        description = find_meta(soup, "og:description", "twitter:description", "description")
    
    # Filter and normalize images - only keep product images
    images = [normalize_shopify_image(u) for u in images if is_product_image_url(u, store_domain)]
    images = dedupe(images)
    
    # Additional filtering: Remove images that are too small (likely icons/logos)
    # and prioritize images from product-specific sources
    filtered_images = []
    for img_url in images:
        # Skip very small images (likely icons/logos) - check for size indicators in URL
        path_lower = (urlparse(img_url).path or "").lower()
        if any(size in path_lower for size in ['_16x', '_32x', '_64x', '_128x', '_icon', '_thumb']):
            # Only skip if it's a very small size indicator
            if any(size in path_lower for size in ['_16x', '_32x', '_64x', '_icon']):
                continue
        filtered_images.append(img_url)
    
    # If we have filtered images, use them; otherwise fall back to all images
    images = filtered_images if filtered_images else images
    
    # Try to extract price from JSON-LD or meta tags
    price = None
    try:
        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                data = json.loads(script.string or "")
                objs = data if isinstance(data, list) else [data]
                for obj in objs:
                    if isinstance(obj, dict):
                        t = obj.get("@type")
                        if t == "Product" or (isinstance(t, list) and "Product" in t):
                            offers = obj.get("offers")
                            if isinstance(offers, dict):
                                price = offers.get("price")
                            elif isinstance(offers, list) and len(offers) > 0:
                                price = offers[0].get("price") if isinstance(offers[0], dict) else None
                            break
            except Exception:
                continue
    except Exception:
        pass
    
    result = {
        "url": url,
        "title": title,
        "description": description,
        "image_urls": images,
    }
    
    if price:
        result["price"] = str(price)
    
    # Translate to English if needed (using generic translation utility)
    try:
        from ..translation_utils import ensure_english_product_data
        result = ensure_english_product_data(result)
    except Exception as e:
        # If translation fails, just log and continue with original data
        print(f"Translation skipped: {str(e)}")
    
    return result

