import re
from typing import Any, Optional
from urllib.parse import urljoin

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; RoarrBrandAds/1.0)"}


def fetch_html(url: str, timeout: int = 15) -> str:
    try:
        r = requests.get(url, timeout=timeout, verify=False, headers=HEADERS)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"[fetch] Failed {url}: {e}")
        return ""


def strip_html(html: str) -> str:
    text = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL)
    text = re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_colors(html: str) -> list:
    colors = set()
    for c in re.findall(r"#([0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)\b", html):
        if len(c) == 3:
            c = "".join(x * 2 for x in c)
        r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
        brightness = (r * 299 + g * 587 + b * 114) / 1000
        if 20 < brightness < 235:
            colors.add("#" + c.upper())
    return list(colors)[:20]


def extract_meta(html: str) -> dict:
    meta = {}
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if m:
        meta["title"] = re.sub(r"\s+", " ", m.group(1)).strip()
    for name in ["description", "og:description", "og:title", "og:image"]:
        m = re.search(
            rf'<meta[^>]+(?:name|property)=["\']?{re.escape(name)}["\']?[^>]+'
            r'content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        if m:
            meta[name] = m.group(1).strip()
    return meta


def extract_fonts(html: str) -> list:
    fonts: list = []
    seen: set = set()
    for url_chunk in re.findall(r'fonts\.googleapis\.com/css[^"\'>\s]+', html):
        for family in re.findall(r"family=([^&\"'>\s]+)", url_chunk):
            for part in re.split(r"[|,]", family):
                name = part.split(":")[0].replace("+", " ").strip()
                if name and name not in seen:
                    seen.add(name)
                    fonts.append(name)
    skip = {
        "inherit", "initial", "unset", "sans-serif", "serif", "monospace",
        "system-ui", "cursive", "fantasy", "ui-sans-serif", "ui-serif",
        "-apple-system", "BlinkMacSystemFont",
    }
    for block in re.findall(r"<style[^>]*>(.*?)</style>", html, re.DOTALL | re.IGNORECASE):
        for match in re.findall(r"font-family\s*:\s*([^;}]+)", block, re.IGNORECASE):
            for raw_name in match.split(","):
                name = raw_name.strip().strip("'\"")
                if name and name.lower() not in skip and not name.startswith("var("):
                    if name not in seen:
                        seen.add(name)
                        fonts.append(name)
    return fonts[:4]


def find_logo_url(html: str, base_url: str) -> str:
    def make_absolute(src: str) -> str:
        if src.startswith("//"):
            return "https:" + src
        if src.startswith("/"):
            return urljoin(base_url, src)
        return src

    for pattern in [
        r'<img[^>]+(?:class|id|alt)=["\'][^"\']*logo[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
        r'<img[^>]+src=["\']([^"\']+)["\'][^>]+(?:class|id|alt)=["\'][^"\']*logo[^"\']*["\']',
        r'<a[^>]+class=["\'][^"\']*(?:logo|brand|header)[^"\']*["\'][^>]*>\s*<img[^>]+src=["\']([^"\']+)["\']',
    ]:
        m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if m:
            return make_absolute(m.group(1))
    for m in re.finditer(
        r'src=["\']([^"\']+(?:logo|brand)[^"\']*\.(?:png|jpg|svg|webp))["\']',
        html,
        re.IGNORECASE,
    ):
        return make_absolute(m.group(1))
    return ""


def dedupe_urls(urls: list) -> list:
    seen = set()
    out = []
    for u in urls or []:
        if not u or not isinstance(u, str):
            continue
        u = u.strip()
        if not u:
            continue
        key = u.split("?")[0]
        if key not in seen:
            seen.add(key)
            out.append(u)
    return out


def scrape_product_images(store_url: str, limit: int = 50) -> list:
    images = []
    seen = set()
    page = 1
    try:
        while len(images) < limit:
            resp = requests.get(
                f"{store_url.rstrip('/')}/products.json?limit=250&page={page}",
                timeout=20,
                verify=False,
                headers=HEADERS,
            )
            resp.raise_for_status()
            products = resp.json().get("products") or []
            if not products:
                break
            for product in products:
                for img in product.get("images", []):
                    src = (img.get("src") or "").strip()
                    if not src:
                        continue
                    key = src.split("?")[0]
                    if key in seen:
                        continue
                    seen.add(key)
                    images.append(src)
                    if len(images) >= limit:
                        return images
            if len(products) < 250:
                break
            page += 1
            if page > 20:
                break
    except Exception as e:
        print(f"[dna] Product image scrape failed: {e}")
    return images


def collect_storefront_signals(url: str) -> dict[str, Any]:
    u = (url or "").strip().rstrip("/")
    if not u:
        raise ValueError("url is required")
    if not u.startswith("http"):
        u = "https://" + u

    print(f"\n[dna] Collecting storefront signals: {u}")
    main_html = fetch_html(u)
    if not main_html:
        raise RuntimeError(
            f"Could not fetch {u}. Check the URL is correct and publicly accessible."
        )
    page_texts = {"home": strip_html(main_html)[:3000]}
    colors = extract_colors(main_html)
    fonts = extract_fonts(main_html)

    about_html = fetch_html(u + "/pages/about")
    if about_html:
        page_texts["about"] = strip_html(about_html)[:2000]

    return {
        "page_texts": page_texts,
        "colors": list(set(colors)),
        "fonts": fonts,
    }


def try_collect_storefront_signals(url: Optional[str]) -> Optional[dict]:
    u = (url or "").strip() if url else ""
    if not u:
        return None
    if not u.startswith("http"):
        u = "https://" + u
    try:
        return collect_storefront_signals(u)
    except Exception as e:
        print(
            f"[dna] Optional storefront scrape failed (proceeding with admin data if any): {e}"
        )
        return None
