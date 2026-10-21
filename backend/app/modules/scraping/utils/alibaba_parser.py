import os, re, json, time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

# ---------- ScraperAPI fetch with smart fallbacks ----------
def scraperapi_get(product_url: str, api_key: str, **params) -> requests.Response:
    endpoint = "https://api.scraperapi.com"
    query = {
        "api_key": api_key,
        "url": product_url,
        "render": "true",
        # forwarding headers often helps on Alibaba
        "keep_headers": "true",
    }
    query.update({k: v for k, v in params.items() if v})
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
        )
    }
    resp = requests.get(endpoint, params=query, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp

def smart_fetch_html(url: str, api_key: str) -> str:
    """Try several ScraperAPI parameter combos to bypass geo/antibot 'Product Not Available' states."""
    attempts = [
        {"device_type": "desktop"},
        {"country_code": "US", "premium": "true", "device_type": "desktop"},
        {"country_code": "SG", "premium": "true", "device_type": "desktop", "session_number": "1"},
        # As a last resort, avoid forwarding headers
        {"country_code": "US", "premium": "true", "device_type": "desktop", "keep_headers": "false"},
    ]
    last_exc = None
    for i, params in enumerate(attempts, 1):
        try:
            r = scraperapi_get(url, api_key, **params)
            html = r.text or ""
            # If the page explicitly says Product Not Available, try next attempt
            if "Product Not Available" in html or \
               re.search(r"not\s+available", html, re.IGNORECASE):
                # brief backoff then retry alt route
                time.sleep(0.8)
                continue
            return html
        except Exception as e:
            last_exc = e
            time.sleep(0.6)
            continue
    # If every attempt failed, raise last exception or return whatever we have
    if last_exc:
        raise last_exc
    return ""

# ---------- Helpers & Filters ----------
def clean_text(t: Optional[str]) -> Optional[str]:
    if not t:
        return None
    return re.sub(r"\s+", " ", t).strip() or None

def find_meta(soup: BeautifulSoup, *names) -> Optional[str]:
    for n in names:
        tag = soup.find("meta", attrs={"property": n}) or soup.find("meta", attrs={"name": n})
        if tag and tag.get("content"):
            return clean_text(tag["content"])
    return None

def dedupe(seq: List[str]) -> List[str]:
    seen, out = set(), []
    for x in seq:
        if x and x not in seen:
            out.append(x)
            seen.add(x)
    return out

_ALICDN_HOST_ALLOW = ("alicdn.com",)
_ALICDN_PATH_ALLOW = ("/kf/", "/imgextra/")
_ALICDN_PATH_DENY = ("sprite", "logo", "icon", "avatar", "qr", "track", "pixel")

def is_product_image_url(u: str) -> bool:
    try:
        p = urlparse(u)
    except Exception:
        return False
    host_ok = any(h in (p.netloc or "") for h in _ALICDN_HOST_ALLOW)
    if not host_ok:
        return False
    path = (p.path or "").lower()
    if not any(k in path for k in _ALICDN_PATH_ALLOW):
        return False
    if any(bad in path for bad in _ALICDN_PATH_DENY):
        return False
    return any(ext in path for ext in [".jpg", ".jpeg", ".png", ".webp"])    

def normalize_alicdn(u: str) -> str:
    u = re.sub(r"(\.jpg|\.jpeg|\.png|\.webp)(_.+?)(?=$|\?)", r"\1", u, flags=re.IGNORECASE)
    u = re.sub(r"(\.jpg|\.jpeg|\.png|\.webp)(\?.*)$", r"\1", u, flags=re.IGNORECASE)
    return u

# ---------- Parsers (product-only) ----------
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
            is_product = (t == "Product") or (isinstance(t, list) and "Product" in t)
            if not is_product:
                continue
            if not result["title"]:
                result["title"] = clean_text(obj.get("name"))
            if not result["description"]:
                result["description"] = clean_text(obj.get("description"))
            imgs = obj.get("image")
            if isinstance(imgs, list):
                result["images"].extend([i for i in imgs if isinstance(i, str)])
            elif isinstance(imgs, str):
                result["images"].append(imgs)
    # Filter product-like AliCDN images
    images = [normalize_alicdn(u) for u in result["images"] if is_product_image_url(u)]
    result["images"] = dedupe(images)
    return result

_INLINE_IMAGE_KEYS = (
    "imagePathList",
    "imageList",
    "images",
    "mainImageUrl",
    "originalMainPicture",
)

IMAGE_URL_REGEX = re.compile(
    r'(https?://[^\s"\'\\]+(?:alicdn\\.com)[^\s"\'\\]*\.(?:jpe?g|png|webp)(?:[^\s"\'\\]*)?)',
    re.IGNORECASE,
)

def parse_inline_product_images(html: str) -> List[str]:
    candidates: List[str] = []
    # Scan for keys and grab nearby URLs (covers common embedded payloads)
    for key in _INLINE_IMAGE_KEYS:
        for m in re.finditer(rf"{re.escape(key)}\s*[:=]\s*(\[[^\]]+\]|\{{{{[^}}}}]+\}}|\"[^\"]+\"|'[^']+')",html):
            blob = m.group(0)
            for um in IMAGE_URL_REGEX.finditer(blob):
                candidates.append(um.group(1))
    # Broad scan of large inline scripts if still empty
    if not candidates:
        for script_blob in re.findall(r"<script[^>]*>(.*?)</script>", html, flags=re.DOTALL | re.IGNORECASE):
            if len(script_blob) < 500:
                continue
            for um in IMAGE_URL_REGEX.finditer(script_blob):
                candidates.append(um.group(1))
    candidates = [normalize_alicdn(u) for u in candidates if is_product_image_url(u)]
    return dedupe(candidates)

def extract_product(url: str, api_key: str) -> Dict[str, Any]:
    html = smart_fetch_html(url, api_key)
    soup = BeautifulSoup(html, "lxml")
    # 1) JSON-LD
    jd = parse_jsonld_product(soup)
    title = jd.get("title")
    description = jd.get("description")
    images = list(jd.get("images", []))
    # 2) Inline payloads if JSON-LD had no images
    if not images:
        images = parse_inline_product_images(html)
    # 3) Fallbacks for title/description (keep image set strict)
    if not title:
        title = find_meta(soup, "og:title", "twitter:title", "title")
    if not title:
        h = soup.find(["h1", "h2"]) 
        title = clean_text(h.get_text(strip=True)) if h else None
    if not description:
        description = find_meta(soup, "og:description", "twitter:description", "description")
    # If the page truly is unavailable, reflect that
    if (not title and not description) and ("Product Not Available" in html):
        title = title or "Product Not Available"
        description = description or "Product Not Available"
    
    result = {"url": url, "title": title, "description": description, "image_urls": images}
    
    # Translate to English if needed (using generic translation utility)
    try:
        from ..translation_utils import ensure_english_product_data
        result = ensure_english_product_data(result)
    except Exception as e:
        # If translation fails, just log and continue with original data
        print(f"Translation skipped: {str(e)}")
    
    return result

