"""
Brand DNA Service
Business logic for Brand DNA workflows will live here.
"""

import json
import logging
import random
import base64
import os
import tempfile
import concurrent.futures
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict

from ...clients import openai_client as client
from ...clients import gemini_client
from .brand_assets import HEADERS, dedupe_urls, try_collect_storefront_signals
from .brand_prompt import (
    build_brand_dna_prompt,
    build_campaign_ideas_prompt,
)
from .signature import (
    BrandDNAProfile,
    CampaignIdeasResponse,
    GenerateCreativesResponse,
)
from ..generate.generate_images import upload_images_to_cdn
from google.genai import types
import requests

logger = logging.getLogger(__name__)
_BRAND_DNA_ROOT = Path(__file__).resolve().parent
TEXT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-3-pro-image-preview"
MAX_CREATIVE_IMAGE_WORKERS = 3
_CAMPAIGN_FIDELITY_MARKER = "PRODUCT FIDELITY (catalog generation standard"

PRODUCT_FIDELITY_PROMPT = """
MAKE SURE to Preserve the product exactly as it is—true shape, proportions, materials, and all components—without inventing or removing details. Keep all brand elements, logos, labels, and on-product text perfectly sharp, unchanged, and undistorted. Maintain the original dimensions, aspect ratio, framing, and accurate colours with no stylization or shifts. Avoid adding text, stickers, watermarks, or anything not explicitly requested to keep images marketplace-safe. If any instruction conflicts with product accuracy or brand integrity, always prioritize fidelity.
"""

# Template ids + fallback layout slugs for downstream compatibility.
AD_TEMPLATE_CATALOG = {
    "brand_bar_2x2_grid": "Top: brand strip or logo zone; bottom: 2x2 grid of product or lifestyle shots with small caption lines.",
    "usage_hero_caption_band": "Full-width usage or lifestyle hero; bottom third or band for headline + supporting body lines.",
    "split_product_type": "Horizontal split only: top half vs bottom half (a horizontal dividing line). Product or scene in one band; typographic panel in the other - never a left/right vertical column split.",
    "editorial_full_bleed": "Magazine-style full-bleed photograph; type in lower third, side rail, or corner - not only a top headline band.",
    "product_showcase_hero": "Product-forward hero with catalog clarity; text wraps or anchors beside, below, or around the product.",
    "collage_mosaic": "Collage or mosaic of multiple frames; integrated captions; cohesive color grading.",
    "color_block_product_float": "Bold brand color field with floating product cutout or large inset; type in a distinct zone (not text-only).",
    "stories_safe_zone_center": "Stories-native 9:16: keep the top ~14% and bottom ~20% visually calm for interface overlays; place hero subject and primary type in the middle band or side rails - Meta safe-zone guidance.",
    "carousel_swipe_panels": "Stories carousel storytelling in one static frame: 2-3 clear horizontal panels or card strips suggesting swipe / sequence; one cohesive narrative across panels; product in at least one panel.",
    "reel_hook_cover": "Reels-style thumb-stopping frame: high contrast, dynamic crop, bold focal moment; favor a person in-scene, in-hand, or demoing the product for native performance-ad energy (face optional, partial body fine) when it suits the product - or a strong dynamic product hero if a human would feel off-brand; vertical-native; headline sized for small-screen feed.",
    "feed_square_shopping": "Feed placement energy (1:1 or 4:5): centered product or flat-lay; clean shopping / catalog clarity; headline + supporting line; minimal chrome - like Instagram Feed static or catalog still.",
    "ugc_quote_social_proof": "UGC / testimonial layout: quote or review line, casual authentic lighting, optional star or social-proof cue; product in-hand or in-scene - performance ads social-proof pattern.",
    "before_after_split": "Before/after or comparison split: clear divider; show product or result vs baseline; compliant, non-deceptive claims only; product visible.",
    "promo_offer_ledge": "Offer-led performance layout: discount, bundle, or urgency as the visual anchor; product clearly visible; promotional hierarchy without fake app UI or misleading buttons.",
    "explore_bento_grid": "Explore / discovery aesthetic: asymmetric bento or tile grid of crops with one hero tile; editorial discovery feel; cohesive color grade across tiles.",
}
AD_TEMPLATE_TO_LAYOUT = {
    "brand_bar_2x2_grid": "color_block",
    "usage_hero_caption_band": "editorial_photo",
    "split_product_type": "split_screen_horizontal",
    "editorial_full_bleed": "editorial_photo",
    "product_showcase_hero": "product_showcase",
    "collage_mosaic": "editorial_photo",
    "color_block_product_float": "color_block",
    "stories_safe_zone_center": "editorial_photo",
    "carousel_swipe_panels": "editorial_photo",
    "reel_hook_cover": "editorial_photo",
    "feed_square_shopping": "product_showcase",
    "ugc_quote_social_proof": "split_screen",
    "before_after_split": "split_screen",
    "promo_offer_ledge": "color_block",
    "explore_bento_grid": "editorial_photo",
}


def campaign_list_summary(row: Dict[str, Any]) -> Dict[str, Any]:
    """Lightweight row for list APIs / hub tables (omit heavy ``creatives`` payloads)."""
    product = row.get("product") or {}
    idea = row.get("idea") or {}
    if not isinstance(product, dict):
        product = {}
    if not isinstance(idea, dict):
        idea = {}
    thumb_url = ""
    raw_imgs = product.get("images")
    if isinstance(raw_imgs, list) and len(raw_imgs) > 0:
        first = raw_imgs[0]
        if isinstance(first, str) and first.strip():
            thumb_url = first.strip()
        elif isinstance(first, dict):
            u = first.get("url") or first.get("src")
            if isinstance(u, str) and u.strip():
                thumb_url = u.strip()
    return {
        "campaign_id": row.get("campaign_id"),
        "brand_name": str(row.get("brand_name") or "").strip(),
        "product_title": str(product.get("title") or "").strip(),
        "idea_title": str(idea.get("title") or "").strip(),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "image_url": thumb_url,
        "generation_status": row.get("generation_status") or "completed",
        "generation_percentage": row.get("generation_percentage"),
        "generation_error": row.get("generation_error"),
    }


def _parse_json_response(raw_text):
    text = (raw_text or "").strip()
    if not text:
        return {}
    if text.startswith("```"):
        lines = [line for line in text.splitlines() if not line.strip().startswith("```")]
        text = "\n".join(lines).strip()
    return json.loads(text)


def _dna_fonts_for_creatives_prompt(dna):
    if not dna:
        return ""
    raw = dna.get("fonts")
    if isinstance(raw, str) and raw.strip():
        fonts = [raw.strip()]
    elif isinstance(raw, list):
        fonts = [str(f).strip() for f in raw if str(f).strip()]
    else:
        return ""
    fonts = fonts[:6]
    if not fonts:
        return ""
    lines = "\n".join(f"  - {f}" for f in fonts)
    return (
        "\nBRAND WEB FONTS (from storefront — use as typographic anchors when writing `typography_placement`; "
        "the image model only approximates these, not exact font files):\n"
        f"{lines}"
    )


def dna_rich_addon(dna):
    if not dna or not isinstance(dna, dict):
        return ""
    parts = []
    so = (dna.get("selling_outlook") or "").strip()
    if so:
        parts.append(f"Selling outlook: {so[:900]}")
    pc = dna.get("product_categories")
    if isinstance(pc, list) and pc:
        parts.append("Category focus: " + ", ".join(str(x) for x in pc[:10]))
    hp = dna.get("hero_products")
    if isinstance(hp, list) and hp:
        lines = []
        for h in hp[:8]:
            if not isinstance(h, dict):
                continue
            t = (h.get("title") or "").strip()
            if not t:
                continue
            role = (h.get("role") or "").strip()
            note = (h.get("note") or "").strip()
            if role and note:
                lines.append(f"{t} ({role}): {note[:120]}")
            elif note:
                lines.append(f"{t}: {note[:120]}")
            else:
                lines.append(t)
        if lines:
            parts.append("Hero / emphasis products: " + " | ".join(lines))
    if not parts:
        return ""
    return "\n" + "\n".join(parts) + "\n"


def _campaign_image_generation_suffix():
    return (
        "\n\nPRODUCT FIDELITY (catalog generation standard — non-negotiable):\n"
        f"{PRODUCT_FIDELITY_PROMPT.strip()}"
    )


def _ensure_campaign_image_suffix(prompt):
    p = (prompt or "").strip()
    if _CAMPAIGN_FIDELITY_MARKER in p:
        return p
    return p + _campaign_image_generation_suffix()


def _pick_distinct_ad_templates(n):
    ids = list(AD_TEMPLATE_CATALOG.keys())
    random.shuffle(ids)
    return ids[: max(0, min(n, len(ids)))]


def _extend_assigned_templates(assigned, need):
    """Ensure ``assigned`` has at least ``need`` distinct template ids (mutates list)."""
    if need <= len(assigned):
        return assigned
    pool = [tid for tid in AD_TEMPLATE_CATALOG if tid not in assigned]
    random.shuffle(pool)
    for tid in pool:
        if len(assigned) >= need:
            break
        assigned.append(tid)
    while len(assigned) < need:
        assigned.append(random.choice(list(AD_TEMPLATE_CATALOG.keys())))
    return assigned


def _fallback_creative_dict(slot_index, ad_template_id, dna, idea, product):
    """Minimal creative when the LLM omits or corrupts a slot — still runs image generation."""
    brand = ((dna or {}).get("brand_name") or "").strip() or "the brand"
    title = ((idea or {}).get("title") or "").strip() or "Campaign"
    desc = ((idea or {}).get("description") or "").strip()
    strategy = ((idea or {}).get("strategy") or "").strip()
    prod_title = ((product or {}).get("title") or "").strip()
    brief_bits = [b for b in (desc[:280], strategy[:120]) if b]
    brief_core = " ".join(brief_bits) if brief_bits else f"Premium campaign moment for {brand}."
    return {
        "platform": "meta",
        "ad_template": ad_template_id,
        "creative_brief": (
            f"Scene and lighting aligned with «{title}». Hero focus on "
            f"{prod_title or 'the product'} — {brief_core}"
        ).strip(),
        "typography_placement": (
            "Horizontal LTR headline and body sized for the assigned template; refined editorial hierarchy "
            "with generous whitespace; strong headline weight paired with a clean secondary line."
        ),
        "composition_mode": "lifestyle_full_bleed" if slot_index % 2 else "product_studio_hero",
        "text_image_relationship": "overlay",
        "headline": (title[:90] if title else f"Discover {brand}"),
        "body": (desc[:280] if desc else f"Crafted with care for {brand}."),
        "cta": "Shop now",
        "layout": AD_TEMPLATE_TO_LAYOUT.get(ad_template_id, "editorial_photo"),
        "visual_direction": "",
    }


def _normalize_creatives_to_count(raw_creatives, count, assigned, dna, idea, product):
    """
    Guarantee exactly ``count`` dict creatives so image generation always queues ``count`` jobs.

    Gemini occasionally returns too few rows or non-object entries; those slots were previously skipped
    entirely (fewer ThreadPool workers / no attempt for missing images).
    """
    _extend_assigned_templates(assigned, count)
    normalized = []
    for i in range(count):
        tpl = assigned[i]
        cand = raw_creatives[i] if i < len(raw_creatives) else None
        if isinstance(cand, dict) and cand:
            normalized.append(cand)
        else:
            logger.warning(
                "[generate-creatives] creative slot %s missing or invalid from LLM (type=%s); "
                "using fallback for ad_template=%s",
                i,
                type(cand).__name__,
                tpl,
            )
            normalized.append(_fallback_creative_dict(i, tpl, dna, idea, product))
    return normalized


def _build_creatives_response_schema(count: int) -> Dict[str, Any]:
    """
    Build runtime JSON schema for creatives with exact item count.

    We still keep app-side normalization as a defense-in-depth fallback, but this
    schema nudges Gemini to always emit the full array shape we expect.
    """
    schema = deepcopy(GenerateCreativesResponse.model_json_schema())
    creatives_prop = schema.get("properties", {}).get("creatives")
    if isinstance(creatives_prop, dict):
        creatives_prop["minItems"] = count
        creatives_prop["maxItems"] = count
    return schema


def _creative_fewshot_image_parts():
    parts = []
    assets_dir = _BRAND_DNA_ROOT / "assets"
    if not assets_dir.exists():
        return parts
    for path in sorted(assets_dir.glob("creative_fewshot_*.png")):
        if not path.is_file():
            continue
        try:
            parts.append(types.Part.from_bytes(mime_type="image/png", data=path.read_bytes()))
        except OSError as e:
            logger.warning(f"[generate-creatives] few-shot skip {path.name}: {e}")
    return parts


def _image_parts_from_urls(urls, max_n):
    parts = []
    for url in dedupe_urls(urls)[:max_n]:
        try:
            response = requests.get(url, timeout=30, verify=False, headers=HEADERS)
            response.raise_for_status()
            mime = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
            if not mime.startswith("image/"):
                mime = "image/jpeg"
            parts.append(types.Part.from_bytes(mime_type=mime, data=response.content))
        except Exception as e:
            logger.warning(f"[generate-creatives] image ref skipped {str(url)[:80]}: {e}")
    return parts


def _download_image(url):
    response = requests.get(url, timeout=30, verify=False, headers=HEADERS)
    response.raise_for_status()
    mime = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
    if not mime.startswith("image/"):
        mime = "image/jpeg"
    return response.content, mime


def _stream_image(model, contents, config):
    for chunk in gemini_client.models.generate_content_stream(
        model=model, contents=contents, config=config
    ):
        if (
            not chunk.candidates
            or not chunk.candidates[0].content
            or not chunk.candidates[0].content.parts
        ):
            continue
        for part in chunk.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                return (
                    base64.b64encode(part.inline_data.data).decode("utf-8"),
                    part.inline_data.mime_type,
                )
    return None


def _image_url_from_b64(image_b64: str, mime_type: str = "image/png") -> str:
    """Persist generated image bytes to S3 and return a public URL."""
    if not image_b64:
        raise RuntimeError("image generation returned empty image bytes")

    mime = (mime_type or "image/png").split(";")[0].strip()
    ext = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(mime, ".png")

    fd, path = tempfile.mkstemp(prefix="brand_ads_creative_", suffix=ext)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(base64.b64decode(image_b64))

        urls = upload_images_to_cdn([path])
        if not urls:
            raise RuntimeError("failed to upload generated image to S3")
        return urls[0]
    finally:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.warning("[campaign-image] temp cleanup failed: %s", e)


def _assemble_campaign_image_prompt(
    *,
    dna,
    creative,
    aspect_ratio,
    product_title,
    product_desc,
    product_image_urls,
    prompt_override,
):
    headline = creative.get("headline", "")
    body = creative.get("body", "")
    visual_dir = (creative.get("visual_direction") or "").strip()
    layout = (creative.get("layout") or "editorial_photo").lower().replace(" ", "_")
    creative_brief = (creative.get("creative_brief") or "").strip()
    typo_place = (creative.get("typography_placement") or "").strip()
    ad_template = (creative.get("ad_template") or "").strip()
    template_desc = AD_TEMPLATE_CATALOG.get(ad_template, "")
    has_product_refs = bool(dedupe_urls(product_image_urls or []))
    brief_primary = creative_brief or visual_dir
    brand_name = dna.get("brand_name", "")

    product_block = ""
    if product_title or product_desc:
        product_block = f"""PRODUCT (maintain exact fidelity to reference images):
Name: {product_title}
{f'Description: {product_desc[:300]}' if product_desc else ''}

"""

    text_block = f"""ON-IMAGE TEXT — the advertisement may show exactly two text blocks, with these exact words and no others from this prompt (no labels, no UI chrome, no section titles):
— {(headline or '').strip()}
— {(body or '').strip()}"""

    product_in_frame_hint = (
        "PRODUCT VISIBILITY: When reference product images are provided, the real product must appear "
        "clearly in-frame (hero, in-hand, worn, or large inset). Do not output text-only, abstract color-field, "
        "or poster layouts with no product visible."
    )

    if ad_template and not template_desc:
        template_desc = "Follow the stated template id; keep composition coherent and on-brand."

    if prompt_override:
        base = prompt_override.strip()
        if has_product_refs:
            base += f"\n\n{product_in_frame_hint}"
        return base

    tpl_line = f'{ad_template}: {template_desc}' if ad_template else "Editorial social ad - varied hierarchy, not a single default stack."
    typo_line = typo_place or (
        "Horizontal LTR headline and body in zones implied by the structure above; clear hierarchy vs product."
    )
    brief_body = brief_primary or f"Premium {layout.replace('_', ' ')} advertising for {brand_name}, bold and aspirational."
    product_extra = f"\n\n{product_in_frame_hint}\n" if has_product_refs else "\n"
    return f"""You are an AI image generator executing a pre-approved advertising creative brief. Follow the brief precisely.

{product_block}Structure (internal layout - follow; do not paint this section title or any instruction words as ad text):
{tpl_line}

Scene and subject (what to show - paint the scene; do not paint this paragraph heading as visible text):
{brief_body}

Typesetting (internal - follow exactly; horizontal LTR only; do not paint this block as visible text):
{typo_line}

{text_block}

BRAND REFERENCE (use to stay on-brand, do not override the brief):
- Brand: {dna.get("brand_name", "")} | Tone: {dna.get("tone_of_voice", "") or "premium, aspirational"}
- Primary palette: {", ".join((dna.get("primary_colors") or [])[:3]) or "dark, sophisticated tones"} | Accent: {", ".join((dna.get("accent_colors") or [])[:2]) or "none"}
- Aesthetic: {", ".join((dna.get("brand_aesthetic") or [])[:3]) or "modern, clean, editorial"}
- Audience: {(dna.get("target_audience") or "")[:120] or "modern lifestyle consumers"}
{product_extra}HARD CONSTRAINTS:
- {aspect_ratio} aspect ratio, print-quality output
- Honor the structure above; do not invent a conflicting layout type
- No watermarks, no borders, no UI chrome
- No buttons, no pill-shaped CTAs, no rounded badge elements
- No extra on-image words beyond the two lines in ON-IMAGE TEXT
- Visible wording must be only the two lines after the em dashes in ON-IMAGE TEXT (no extra words, no prompt vocabulary)."""


def build_dna(payload=None):
    """Build Brand DNA from storefront signals + selected products."""
    data = payload or {}
    storefront_url = (
        data.get("store_url")
        or data.get("storeUrl")
        or data.get("url")
        or ""
    )
    selected_products = data.get("products") or []

    storefront_signals = try_collect_storefront_signals(storefront_url)
    prompt = build_brand_dna_prompt(
        storefront_signals=storefront_signals,
        selected_products=selected_products,
    )

    schema = BrandDNAProfile.model_json_schema()
    schema["additionalProperties"] = False

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You generate structured Brand DNA JSON from ecommerce storefront context.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "brand_dna_profile",
                    "schema": schema,
                },
            },
        )

        choice = response.choices[0].message
        if hasattr(choice, "parsed") and choice.parsed is not None:
            brand_dna = (
                choice.parsed.model_dump()
                if hasattr(choice.parsed, "model_dump")
                else choice.parsed
            )
        else:
            brand_dna = json.loads(choice.content)
    except Exception as e:
        logger.error(f"Error building brand DNA: {str(e)}")
        raise

    return {
        "status": "completed",
        "brand_dna": brand_dna,
        "storefront_signals": storefront_signals,
    }


def get_brand_dna_service_status():
    """Temporary placeholder until Brand DNA logic is implemented."""
    return {
        "module": "brand_dna",
        "status": "ready",
    }


def generate_campaign_ideas(payload=None):
    """Generate three campaign ideas from Brand DNA + selected product."""
    data = payload or {}
    dna = data.get("dna") or {}
    product = data.get("product") or {}
    prompt_text = data.get("prompt") or ""

    prompt = build_campaign_ideas_prompt(
        dna=dna,
        product=product,
        prompt_text=prompt_text,
    )

    schema = CampaignIdeasResponse.model_json_schema()
    schema["additionalProperties"] = False

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You generate structured JSON campaign ideas for ecommerce ads.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "campaign_ideas_response",
                    "schema": schema,
                },
            },
        )

        choice = response.choices[0].message
        if hasattr(choice, "parsed") and choice.parsed is not None:
            parsed = (
                choice.parsed.model_dump()
                if hasattr(choice.parsed, "model_dump")
                else choice.parsed
            )
        else:
            parsed = json.loads(choice.content)

        ideas = parsed.get("ideas") or []
        return {"ideas": ideas[:3]}
    except Exception as e:
        logger.error(f"Error generating campaign ideas: {str(e)}")
        raise


def generate_creatives(payload=None):
    """Generate creatives using Gemini multimodal pipeline."""
    data = payload or {}
    dna = data.get("dna") or {}
    product = data.get("product") or {}
    idea = data.get("idea") or {}
    count = max(1, min(int(data.get("count", 3)), 4))
    product_image_urls = dedupe_urls(
        data.get("product_image_urls")
        or product.get("images")
        or []
    )
    has_product_refs = len(product_image_urls) > 0
    has_product_title = bool((product.get("title") or "").strip())

    industry = dna.get("industry", "e-commerce")
    dna_ctx = (
        f"""Brand: {dna.get('brand_name', 'Unknown')}
Industry: {industry}
Tone: {dna.get('tone_of_voice', 'professional')} — {dna.get('tone_description', '')}
Visual style: {dna.get('visual_description', '')}
Brand aesthetic: {', '.join(dna.get('brand_aesthetic') or [])}
Target audience: {dna.get('target_audience', 'general consumers')}
Primary colors: {', '.join(dna.get('primary_colors') or [])}
Accent colors: {', '.join((dna.get('accent_colors') or [])[:2])}
Key messages: {', '.join(dna.get('key_messages') or [])}{dna_rich_addon(dna)}"""
        if dna
        else ""
    )
    if dna:
        dna_ctx += _dna_fonts_for_creatives_prompt(dna)

    product_ctx = ""
    if product:
        product_ctx = f"\nProduct: {product.get('title', '')} — {(product.get('description') or '')[:300]}"

    fewshot_parts = _creative_fewshot_image_parts()
    fewshot_preamble = ""
    if fewshot_parts:
        fewshot_preamble = """STYLE REFERENCE IMAGES (below, after any product photos): Example 9:16 social ads — diverse composition and layout grammar.
Use only as inspiration for art-direction richness. Do NOT copy brands, packs, or literal scenes.

"""

    product_grounding = ""
    if has_product_refs:
        product_grounding = """
PRODUCT PHOTOS (when shown above): These are real product images from the merchant. MANDATORY: Every creative must show this product clearly in the final ad concept (hero, in-hand, in-scene, worn, or large inset). FORBIDDEN: layouts that are only flat color fields + typography with no product visible; pure typographic posters; abstract brand patterns with no product. Pick a different `ad_template` if needed.

"""
    elif has_product_title:
        product_grounding = """
PRODUCT VISIBILITY: This campaign has a named product — `creative_brief` must describe the product as a visible subject (rendered or photographed), not text-only compositions.

"""

    assigned = _pick_distinct_ad_templates(count)
    catalog_items = list(AD_TEMPLATE_CATALOG.items())
    random.shuffle(catalog_items)
    catalog_lines = "\n".join(f'  - "{tid}": {desc}' for tid, desc in catalog_items)
    assignment_lines = "\n".join(
        f'  - creatives[{i}] `ad_template` MUST be exactly "{tid}"'
        for i, tid in enumerate(assigned)
    )
    platforms = ["Instagram", "Facebook", "TikTok", "Pinterest", "Email"]
    prompt = fewshot_preamble + product_grounding + f"""You are a world-class advertising creative director specialising in {industry} brands. Generate {count} distinct, production-ready social media ad creatives.

PRE-ASSIGNED TEMPLATES (mandatory — use these exact ids in order; do not replace with editorial_full_bleed or product_showcase_hero unless they appear below):
{assignment_lines}
Align each `creative_brief` and `typography_placement` with that row's template structure.

Reference catalog (all valid ids — yours are fixed above):
{catalog_lines}
- Do NOT restate full layout grammar in `creative_brief` — the template id already defines structure. In `creative_brief`, describe ONLY scene, subject, product visibility, lighting, mood, and art direction (what is IN the image).

TYPOGRAPHY (authoritative field `typography_placement` — 2–4 short sentences, passed verbatim to the image model):
- Sentence 1: Where horizontal LTR headline and body sit relative to the assigned template (zones, alignment, hierarchy vs product).
- Sentences 2–4: Typographic character aimed at restrained elegance — pairing (e.g. refined high-contrast serif or editorial serif for headline + clean humanist sans for body), approximate weights, case (title case vs sentence case), tracking/leading feel. Optimize so headline + body copy read as one elegant composition (not generic system-UI or condensed marketing-template sans).
- If BRAND WEB FONTS appear above, anchor the described type feel to those families (or the closest tasteful editorial equivalent). If none listed, infer from brand aesthetic and tone — still restrained, not decorative or novelty fonts.
- Avoid novelty/blackletter/comic/bubble styles; no fake drop-shadow or 3D bevel clichés.
- FORBIDDEN in output: vertical letter orientation, sideways type, or phrases like "vertical text" for copy. "Vertical split" means composition zones, not rotated letters. For `split_product_type` only: frame split must be horizontal (top half vs bottom half), never a left/right column split."

ORTHOGONAL METADATA (vary across creatives):
- `composition_mode`: short phrase — e.g. product_studio_hero | lifestyle_full_bleed | collage_or_grid | instructional_step | split_panel — NOT typographic_first if a product must appear.
- `text_image_relationship`: overlay | split_screen | inset_panel | grid_with_captions | image_dominant | type_dominant.

COPY:
- Headlines may be metaphorical, tonal, or benefit-led. Body: 1–2 sentences on-brand. Shape headline/body length and cadence so they pair elegantly with the `typography_placement` you write (same creative).

BRAND DNA:
{dna_ctx}{product_ctx}

CAMPAIGN:
Title: {idea.get('title', '')}
Description: {idea.get('description', '')}
Strategy: {idea.get('strategy', '')}

Return ONLY a valid JSON object:
{{
  "creatives": [
    {{
      "platform": "Instagram",
      "ad_template": "must match the PRE-ASSIGNED value for this index",
      "creative_brief": "Scene, product, lighting, mood — no duplicated layout boilerplate",
      "typography_placement": "2–4 sentences: zones + elegant type + optional alignment to brand web fonts above",
      "composition_mode": "short phrase, unique per creative",
      "text_image_relationship": "one of the allowed tokens",
      "headline": "…",
      "body": "…",
      "cta": "…",
      "layout": "optional legacy slug: color_block | editorial_photo | split_screen | split_screen_horizontal | product_showcase — if omitted, server maps from ad_template"
    }}
  ]
}}

Generate exactly {count} creatives. Platforms from: {', '.join(platforms[:count+1])}. Each `typography_placement` must differ in both layout and typographic direction. The `ad_template` field for each array element must match the PRE-ASSIGNED list exactly."""

    try:
        parts = []
        product_parts = _image_parts_from_urls(product_image_urls, 4)
        if product_parts:
            parts.extend(product_parts)
            parts.append(
                types.Part.from_text(
                    text=(
                        f"Above: {len(product_parts)} product reference image(s). "
                        "Every creative must include this product visibly."
                    )
                )
            )
        parts.extend(fewshot_parts)
        parts.append(types.Part.from_text(text=prompt))

        response_schema = _build_creatives_response_schema(count)
        response = gemini_client.models.generate_content(
            model=TEXT_MODEL,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )

        result = _parse_json_response(response.text)
        raw_creatives = result if isinstance(result, list) else (result.get("creatives") or [])
        creatives = _normalize_creatives_to_count(
            raw_creatives, count, assigned, dna, idea, product
        )

        for i, creative in enumerate(creatives):
            expected = assigned[i] if i < len(assigned) else ""
            ad_template = (creative.get("ad_template") or "").strip()
            if ad_template not in AD_TEMPLATE_CATALOG and expected:
                creative["ad_template"] = expected
                ad_template = expected
            creative["platform"] = "meta"
            if ad_template in AD_TEMPLATE_CATALOG:
                creative["layout"] = AD_TEMPLATE_TO_LAYOUT.get(ad_template, "editorial_photo")
            if (creative.get("creative_brief") or "").strip() and not (creative.get("visual_direction") or "").strip():
                creative["visual_direction"] = creative["creative_brief"]
        aspect_ratio = (data.get("aspect_ratio") or "9:16").strip()
        product_title = (product.get("title") or "").strip()
        product_desc = (product.get("description") or "").strip()

        generate_creative_images_parallel(
            creatives=creatives,
            dna=dna,
            product=product,
            product_title=product_title,
            product_desc=product_desc,
            product_image_urls=product_image_urls,
            aspect_ratio=aspect_ratio,
        )

        return {"creatives": creatives}
    except Exception as e:
        logger.error(f"Error generating creatives: {str(e)}")
        raise


def generate_creative_images_parallel(
    creatives,
    dna,
    product,
    product_title,
    product_desc,
    product_image_urls,
    aspect_ratio,
):
    """Render each Brand Ads creative image concurrently, preserving creative order."""
    if not creatives:
        return creatives

    work_items = [
        (idx, creative)
        for idx, creative in enumerate(creatives)
        if isinstance(creative, dict)
    ]
    if not work_items:
        return creatives

    max_workers = min(MAX_CREATIVE_IMAGE_WORKERS, len(work_items))
    logger.info(
        "[generate-creatives] generating %s campaign images concurrently with %s workers",
        len(work_items),
        max_workers,
    )

    def _generate_one(idx, creative):
        image_payload = {
            "dna": dna,
            "creative": creative,
            "product": product,
            "product_title": product_title,
            "product_description": product_desc,
            "product_image_urls": product_image_urls,
            "creative_index": idx,
            "aspect_ratio": aspect_ratio,
        }
        return idx, generate_creative_image(image_payload)

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {
            executor.submit(_generate_one, idx, creative): idx
            for idx, creative in work_items
        }

        for future in concurrent.futures.as_completed(future_to_index):
            idx = future_to_index[future]
            creative = creatives[idx]
            try:
                _, img = future.result()
                creative["image_url"] = img.get("image_url")
                creative["image_mime_type"] = img.get("mime_type") or "image/png"
                creative["image_prompt"] = img.get("prompt") or ""
                creative.pop("image_error", None)
            except Exception as e:
                logger.warning("[generate-creatives] image %s failed: %s", idx, e)
                creative["image_url"] = None
                creative["image_mime_type"] = None
                creative["image_prompt"] = ""
                creative["image_error"] = str(e)

    return creatives


def generate_creative_image(payload=None):
    """Generate a single image for one selected creative."""
    data = payload or {}
    dna = data.get("dna") or {}
    creative = data.get("creative") or {}
    aspect_ratio = (data.get("aspect_ratio") or "9:16").strip()
    product_title = (data.get("product_title") or "").strip() or (data.get("product") or {}).get("title", "")
    product_desc = (data.get("product_description") or "").strip() or (data.get("product") or {}).get("description", "")
    product_image_urls = dedupe_urls(data.get("product_image_urls") or [])

    prompt = _assemble_campaign_image_prompt(
        dna=dna,
        creative=creative,
        aspect_ratio=aspect_ratio,
        product_title=product_title,
        product_desc=product_desc,
        product_image_urls=product_image_urls,
        prompt_override=(creative.get("_prompt_override") or "").strip(),
    )
    prompt = _ensure_campaign_image_suffix(prompt)

    contents = []
    loaded = 0
    for image_url in product_image_urls[:8]:
        try:
            img_data, img_mime = _download_image(image_url)
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_bytes(mime_type=img_mime, data=img_data)],
                )
            )
            loaded += 1
        except Exception as e:
            logger.warning(f"[campaign-image] failed loading image {image_url[:80]}: {e}")

    if loaded > 0:
        contents.append(
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text=(
                            f"These are {loaded} reference image(s) of the product. "
                            "The final rendered ad must show this product clearly — not text-only. "
                            "Match shape, materials, logos, labels, and colours; the prompt ends with PRODUCT FIDELITY."
                        )
                    )
                ],
            )
        )
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    )

    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
    )

    result = _stream_image(IMAGE_MODEL, contents, config)
    if not result:
        raise RuntimeError("image generation failed, please try again")

    image_b64, mime_type = result
    image_url = _image_url_from_b64(image_b64, mime_type)
    return {"image_url": image_url, "mime_type": mime_type, "prompt": prompt}
