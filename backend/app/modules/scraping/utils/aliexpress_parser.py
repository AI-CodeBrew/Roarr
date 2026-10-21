import os, re, json, time
from typing import Any, Dict, List, Optional, Tuple
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
            if re.search(r"(Robot Check|CAPTCHA|automated access|To discuss automated access)", html, re.IGNORECASE):
                time.sleep(0.6)
                continue
            return html
        except Exception as e:
            last_exc = e
            time.sleep(0.5)
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

_ALI_HOST_ALLOW = ("alicdn.com", "aliexpress-media.com")

def is_ali_image(u: str) -> bool:
    u = to_absolute(u)
    try:
        p = urlparse(u)
    except Exception:
        return False
    if not any(h in (p.netloc or "") for h in _ALI_HOST_ALLOW):
        return False
    path = (p.path or "").lower()
    return "/kf/" in path and any(ext in path for ext in [".jpg", ".jpeg", ".png", ".webp", ".avif"])

def normalize_ali_media_to_jpg(u: str) -> str:
    u = to_absolute(u)
    try:
        p = urlparse(u)
    except Exception:
        return u
    path = p.path
    m = re.search(r"(/kf/[^/?#]+?\.(?:jpg|jpeg|png))", path, re.IGNORECASE)
    if not m:
        return re.sub(r"(\.(?:jpg|jpeg|png|webp|avif))(\?.*)$", r"\1", u, flags=re.IGNORECASE)
    base = m.group(1)
    return f"https://ae01.alicdn.com{base}"

def normalize_ali_image(u: str) -> str:
    u = to_absolute(u)
    if "aliexpress-media.com" in u:
        return normalize_ali_media_to_jpg(u)
    return re.sub(r"(\.(?:jpg|jpeg|png|webp|avif))(\?.*)$", r"\1", u, flags=re.IGNORECASE)

ALI_IMG_URL_REGEX = re.compile(
    r'((?:https?:)?//[^\s"\'\\]+?(?:alicdn\\.com|aliexpress-media\\.com)[^\s"\'\\]*\.(?:jpe?g|png|webp|avif)(?:[^\s"\'\\]*)?)',
    re.IGNORECASE,
)

def parse_gallery_imgs(soup: BeautifulSoup) -> List[str]:
    urls: List[str] = []
    # New AliExpress component classes
    selectors = [
        'div[class^="main-image--wrap--"]',
        'div[class^="image-view-v2--wrap--"]',
        'div[class^="slider--wrap--"]',
        'div[class^="slider--img--"]',
    ]
    for sel in selectors:
        for wrap in soup.select(sel):
            for img in wrap.find_all("img"):
                if img.get("src"):
                    urls.append(img["src"])
                for att in ("srcset", "data-srcset"):
                    ss = img.get(att)
                    if ss:
                        for part in ss.split(","):
                            url_only = part.strip().split(" ")[0]
                            urls.append(url_only)
    # Regex fallback within gallery area
    for wrap in soup.select('div[class^="main-image--wrap--"], div[class^="image-view-v2--wrap--"], div[class^="slider--wrap--"]'):
        html = wrap.decode()
        for m in ALI_IMG_URL_REGEX.finditer(html):
            urls.append(m.group(1))
    return dedupe([normalize_ali_image(u) for u in urls if is_ali_image(u)])

def parse_title_desc(soup: BeautifulSoup) -> Tuple[Optional[str], Optional[str]]:
    title = None
    desc = None
    for sc in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(sc.string or "")
        except Exception:
            continue
        objs = data if isinstance(data, list) else [data]
        for obj in objs:
            if isinstance(obj, dict) and (obj.get("@type") == "Product" or (isinstance(obj.get("@type"), list) and "Product" in obj.get("@type"))):
                title = title or clean_text(obj.get("name"))
                desc = desc or clean_text(obj.get("description"))
    if not title:
        title = find_meta(soup, "og:title", "twitter:title", "title")
    if not desc:
        desc = find_meta(soup, "og:description", "twitter:description", "description")
    return title, desc

def extract_product(url: str, api_key: str) -> Dict[str, Any]:
    """
    Extract product information from AliExpress.
    
    Args:
        url: AliExpress product URL
        api_key: ScraperAPI key
        
    Returns:
        Dictionary with product data:
        - url: Original URL
        - title: Product name
        - description: Product description
        - image_urls: List of product images
    """
    html = smart_fetch_html(url, api_key)
    soup = BeautifulSoup(html, "lxml")
    title, description = parse_title_desc(soup)
    images = parse_gallery_imgs(soup)
    
    # Broad regex scan as fallback
    for m in ALI_IMG_URL_REGEX.finditer(html):
        images.append(normalize_ali_image(m.group(1)))
    
    images = dedupe([u for u in images if is_ali_image(u)])
    
    result = {"url": url, "title": title, "description": description, "image_urls": images}
    
    # Translate to English if needed (using generic translation utility)
    try:
        from ..translation_utils import ensure_english_product_data
        result = ensure_english_product_data(result)
    except Exception as e:
        # If translation fails, just log and continue with original data
        print(f"Translation skipped: {str(e)}")
    
    return result

