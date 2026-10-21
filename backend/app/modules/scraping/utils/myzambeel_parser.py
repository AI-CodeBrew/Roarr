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

_HOST_ALLOW = ("cdn.shopify.com", "myzambeel.com")
_IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".avif")

def is_product_image_url(u: str) -> bool:
    u = to_absolute(u)
    try:
        p = urlparse(u)
    except Exception:
        return False
    host_ok = any(h in (p.netloc or "") for h in _HOST_ALLOW)
    if not host_ok:
        return False
    path = (p.path or "").lower()
    return any(ext in path for ext in _IMG_EXTS)

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
    images = [normalize_shopify_image(u) for u in result["images"] if is_product_image_url(u)]
    result["images"] = dedupe(images)
    return result

IMAGE_URL_REGEX = re.compile(
    r'((?:https?:)?//[^\s"\'\\]+?(?:cdn\\.shopify\\.com|myzambeel\\.com)[^\s"\'\\]*\.(?:jpe?g|png|webp|avif)(?:[^\s"\'\\]*)?)',
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
    urls = [normalize_shopify_image(u) for u in urls if is_product_image_url(u)]
    return dedupe(urls)

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
    imgs = [normalize_shopify_image(u) for u in imgs if is_product_image_url(u)]
    return dedupe(imgs)

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
    imgs = [normalize_shopify_image(u) for u in imgs if is_product_image_url(u)]
    return dedupe(imgs)

def parse_attribute_scan(html: str) -> List[str]:
    candidates: List[str] = []
    # Regex scan whole HTML
    for um in IMAGE_URL_REGEX.finditer(html):
        candidates.append(um.group(1))
    # Attribute scan
    soup = BeautifulSoup(html, "lxml")
    for tag in soup.find_all(True):
        for attr, val in list(tag.attrs.items()):
            if not isinstance(val, str):
                continue
            if attr in ("srcset", "data-srcset"):
                for part in val.split(","):
                    url_only = part.strip().split(" ")[0]
                    candidates.append(url_only)
            else:
                m = IMAGE_URL_REGEX.search(val)
                if m:
                    candidates.append(m.group(1))
    candidates = [to_absolute(u) for u in candidates]
    candidates = [normalize_shopify_image(u) for u in candidates if is_product_image_url(u)]
    return dedupe(candidates)

def extract_product(url: str, api_key: str) -> Dict[str, Any]:
    """
    Extract product information from MyZambeel (Shopify-based) store.
    
    Args:
        url: Product URL from myzambeel.com
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
    jd = parse_jsonld_product(soup)
    title = jd.get("title")
    description = jd.get("description")
    images: List[str] = []
    
    # Merge **all** sources (order from most-structured to broadest)
    images += fetch_shopify_product_json(url, api_key)
    images += parse_inline_json_media(soup)
    images += parse_media_gallery(soup)
    images += parse_attribute_scan(html)
    
    # Title/description fallbacks
    if not title:
        title = find_meta(soup, "og:title", "twitter:title", "title")
    if not title:
        h = soup.find(["h1", "h2"]) 
        title = clean_text(h.get_text(strip=True)) if h else None
    if not description:
        description = find_meta(soup, "og:description", "twitter:description", "description")
    
    images = dedupe([normalize_shopify_image(u) for u in images if is_product_image_url(u)])
    
    # Filter out Zambeel logo
    ZAMBEEL_LOGO_URL = "https://www.myzambeel.com/cdn/shop/files/Zambeel-logo-only-full.png"
    images = [img for img in images if img != ZAMBEEL_LOGO_URL and not img.endswith("Zambeel-logo-only-full.png")]
    
    result = {"url": url, "title": title, "description": description, "image_urls": images}
    
    # Translate to English if needed (using generic translation utility)
    try:
        from ..translation_utils import ensure_english_product_data
        result = ensure_english_product_data(result)
    except Exception as e:
        # If translation fails, just log and continue with original data
        print(f"Translation skipped: {str(e)}")
    
    return result

