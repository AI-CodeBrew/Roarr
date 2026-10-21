"""
Amour image prompts — category-agnostic templated system.

Keys and ratios must stay in sync with packs/amour/image_keys.json and the
kluck-ai-amour-*.liquid sections that read them.

Edit TEMPLATES / STYLE / NEGATIVE / CATEGORY_DEFAULTS here; do not hardcode
per-category prompt lists elsewhere.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional, Sequence

from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Placeholders filled per product: {product} {category} {props} {interaction}
# {setting} {palette} {mood} {person}
# ---------------------------------------------------------------------------

# interaction / setting / mood / palette — palette drives light vs dark scenes.
CATEGORY_DEFAULTS: Dict[str, Dict[str, str]] = {
    # User-facing labels
    "beauty": {
        "interaction": "applying",
        "setting": "elegant bathroom vanity",
        "mood": "dark editorial",
        "palette": "deep wine red, oxblood, charcoal and soft gold highlights",
    },
    "beauty/skincare": {
        "interaction": "applying",
        "setting": "elegant bathroom vanity",
        "mood": "dark editorial",
        "palette": "deep wine red, oxblood, charcoal and soft gold highlights",
    },
    "skincare": {
        "interaction": "applying",
        "setting": "elegant bathroom vanity",
        "mood": "dark editorial",
        "palette": "deep wine red, oxblood, charcoal and soft gold highlights",
    },
    "fashion": {
        "interaction": "wearing",
        "setting": "city street or full-length mirror",
        "mood": "bright airy",
        "palette": "vivid pink, lilac, clean white and soft daylight",
    },
    "fashion/jewelry": {
        "interaction": "wearing",
        "setting": "city street or full-length mirror",
        "mood": "bright airy",
        "palette": "vivid pink, lilac, clean white and soft daylight",
    },
    "jewelry": {
        "interaction": "wearing",
        "setting": "city street or full-length mirror",
        "mood": "bright airy",
        "palette": "vivid pink, lilac, clean white and soft daylight",
    },
    "furniture": {
        "interaction": "sitting on or relaxing with",
        "setting": "modern living room",
        "mood": "warm inviting",
        "palette": "warm oak, ivory, soft taupe and natural light",
    },
    "furniture/home": {
        "interaction": "sitting on or relaxing with",
        "setting": "modern living room",
        "mood": "warm inviting",
        "palette": "warm oak, ivory, soft taupe and natural light",
    },
    "home": {
        "interaction": "sitting on or relaxing with",
        "setting": "modern living room",
        "mood": "warm inviting",
        "palette": "warm oak, ivory, soft taupe and natural light",
    },
    "electronics": {
        "interaction": "using",
        "setting": "clean desk setup",
        "mood": "sleek modern",
        "palette": "bright blues, clean white, soft grey and cool daylight",
    },
    "kitchen": {
        "interaction": "pouring or serving",
        "setting": "kitchen counter",
        "mood": "fresh inviting",
        "palette": "warm wood, cream, soft terracotta and kitchen daylight",
    },
    "kitchen/food": {
        "interaction": "pouring or serving",
        "setting": "kitchen counter",
        "mood": "fresh inviting",
        "palette": "warm wood, cream, soft terracotta and kitchen daylight",
    },
    "food": {
        "interaction": "pouring or serving",
        "setting": "kitchen counter",
        "mood": "fresh inviting",
        "palette": "warm wood, cream, soft terracotta and kitchen daylight",
    },
    "fitness": {
        "interaction": "training with",
        "setting": "gym or outdoors",
        "mood": "energetic bright",
        "palette": "fresh greens, sky blue, white and outdoor light",
    },
    "kids": {
        "interaction": "playing with",
        "setting": "bright playroom",
        "mood": "playful bright",
        "palette": "sunny orange, lime, soft yellow, pastel blue — never dark or moody",
    },
    "kids/toys": {
        "interaction": "playing with",
        "setting": "bright playroom",
        "mood": "playful bright",
        "palette": "sunny orange, lime, soft yellow, pastel blue — never dark or moody",
    },
    "toys": {
        "interaction": "playing with",
        "setting": "bright playroom",
        "mood": "playful bright",
        "palette": "sunny orange, lime, soft yellow, pastel blue — never dark or moody",
    },
    # Kluck store category keys
    "health_beauty": {
        "interaction": "applying",
        "setting": "elegant bathroom vanity",
        "mood": "dark editorial",
        "palette": "deep wine red, oxblood, charcoal and soft gold highlights",
    },
    "home_kitchen": {
        "interaction": "sitting on or relaxing with",
        "setting": "modern living room",
        "mood": "warm inviting",
        "palette": "warm oak, ivory, soft taupe and natural light",
    },
    "kids_toys": {
        "interaction": "playing with",
        "setting": "bright playroom",
        "mood": "playful bright",
        "palette": "sunny orange, lime, soft yellow, pastel blue — never dark or moody",
    },
    "car_accessories": {
        "interaction": "using",
        "setting": "clean desk setup",
        "mood": "sleek modern",
        "palette": "bright blues, clean white, soft grey and cool daylight",
    },
    "general": {
        "interaction": "using",
        "setting": "natural home setting",
        "mood": "clean commercial",
        "palette": "soft neutral tones with gentle daylight",
    },
    "default": {
        "interaction": "using",
        "setting": "natural home setting",
        "mood": "clean commercial",
        "palette": "soft neutral tones with gentle daylight",
    },
}

NEUTRAL_PALETTE = "soft neutral tones"

STYLE = (
    "STYLE: professional commercial photography, {mood} mood, color palette {palette}, "
    "consistent soft directional lighting from the left, realistic textures, sharp focus "
    "on {product}, true-to-life product colors and proportions, high resolution."
)

NEGATIVE = (
    "no text, no logos, no watermark, no brand names, no distorted hands, no extra fingers, "
    "no warped product, no clutter, no duplicate products."
)

# (key, aspect ratio, image_type for Gemini routing, template body)
TEMPLATES: List[Dict[str, str]] = [
    {
        "key": "banner_image",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Wide hero shot of {product} placed in the right third of the frame on a "
            "minimal surface in {setting}, dramatic directional light highlighting its shape. "
            "Left 45% of the frame is clean, uncluttered, softly blurred negative space with "
            "even tone for headline text."
        ),
    },
    {
        "key": "banner_image_2",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "{person} {interaction} {product} in {setting}, medium shot, subject in the "
            "lower two-thirds, natural candid pose, cinematic depth of field. Top third calm "
            "and uncluttered for text overlay."
        ),
    },
    {
        "key": "product_image_1",
        "ratio": "3:4",
        "image_type": "product_images",
        "template": (
            "{product} as the single hero on a simple pedestal, slight low angle, rim light "
            "separating it from a seamless {palette} background, 2 small {props} subtly at "
            "the base. No people. Product fills ~60% of frame."
        ),
    },
    {
        "key": "product_image_2",
        "ratio": "3:4",
        "image_type": "product_images",
        "template": (
            "Close-up of hands {interaction} {product}, 45° angle, focus on point of contact "
            "showing how it is used, shallow depth of field, face not visible, natural skin tones."
        ),
    },
    {
        "key": "product_image_3",
        "ratio": "3:4",
        "image_type": "product_images",
        "template": (
            "Overhead flat lay: {product} centered on a textured fabric surface in {palette}, "
            "surrounded by {props} in a balanced asymmetric composition with breathing room. "
            "No people."
        ),
    },
    {
        "key": "look_image_1",
        "ratio": "3:4",
        "image_type": "creative_image",
        "template": (
            "Lifestyle portrait of {person} naturally {interaction} {product} in {setting}, "
            "relaxed genuine expression, product clearly visible at chest height, background "
            "softly blurred. Center-top area calm for title."
        ),
    },
    {
        "key": "look_image_2",
        "ratio": "3:4",
        "image_type": "creative_image",
        "template": (
            "Signature campaign scene: {product} as hero in an elevated, styled version of "
            "{setting}, bold composition, single strong light source, {mood} atmosphere. "
            "No people."
        ),
    },
    {
        "key": "look_image_3",
        "ratio": "3:4",
        "image_type": "creative_image",
        "template": (
            "Gifting moment: {product} partially placed in an open gift box with ribbon in "
            "{palette}, hands about to present it, warm inviting light, close shot."
        ),
    },
    {
        "key": "split_image",
        "ratio": "1:1",
        "image_type": "creative_image",
        "template": (
            "Extreme macro close-up of {product} showing material texture and finish detail, "
            "ultra-sharp on a small area, creamy bokeh elsewhere, conveys quality and "
            "craftsmanship. No people."
        ),
    },
    {
        "key": "editorial_image_1",
        "ratio": "16:9",
        "image_type": "creative_image",
        "template": (
            "Editorial still life: {product} with {props} on a surface, low side angle, long "
            "soft shadows, magazine-style composition with generous negative space on one side. "
            "No people."
        ),
    },
    {
        "key": "editorial_image_2",
        "ratio": "16:9",
        "image_type": "creative_image",
        "template": (
            "Wide environmental shot of {setting} with {person} at the side or background, "
            "{product} naturally integrated, showing real-life scale and context, shallow "
            "depth of field."
        ),
    },
    {
        "key": "story_image",
        "ratio": "4:5",
        "image_type": "creative_image",
        "template": (
            "Intimate emotional moment: {person} enjoying {product}, genuine calm or happy "
            "expression, single warm light source, close framing, cinematic film look; product "
            "visible but emotion is the focus."
        ),
    },
]

REQUIRED_VAR_KEYS = (
    "product",
    "category",
    "props",
    "interaction",
    "setting",
    "palette",
    "mood",
    "person",
)

_PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


class AmourImageVariables(BaseModel):
    """Strict JSON returned by the one-shot LLM variable fill."""

    product: str = Field(
        description="Short visual description of the product (material, color, shape). No brand names."
    )
    category: str = Field(
        description="Product category label used for defaults (e.g. beauty/skincare, fashion/jewelry)."
    )
    props: str = Field(
        description="2–3 small complementary prop names as a comma-separated string."
    )
    interaction: str = Field(
        description="Physically realistic verb phrase for how a person uses this product."
    )
    setting: str = Field(description="Scene / location for lifestyle shots.")
    palette: str = Field(
        description="Short color-palette phrase for backgrounds and styling."
    )
    mood: str = Field(description="1–3 word photographic mood (e.g. warm editorial).")
    person: str = Field(
        description=(
            "Generic person description for lifestyle shots (no real/celebrity people), "
            "diverse and age-appropriate for the category."
        )
    )


# Backward-compatible exports used by older callers / demo scripts.
AMOUR_IMAGE_SLOTS = [
    (row["key"], row["ratio"], row["image_type"], row["template"]) for row in TEMPLATES
]
AMOUR_IMAGE_RATIOS = {row["key"]: row["ratio"] for row in TEMPLATES}
# Deprecated mood block — kept so accidental imports do not break.
AMOUR_DARK_MOOD = (
    "AMOUR MOOD (legacy): prefer a refined commercial look matching {mood} and {palette}."
)


def _normalize_category_key(category: Optional[str]) -> str:
    raw = str(category or "").strip().lower().replace(" ", "_").replace("-", "_")
    if not raw:
        return "default"
    if raw in CATEGORY_DEFAULTS:
        return raw
    # "beauty/skincare" style
    slash = str(category or "").strip().lower().replace(" ", "")
    if slash in CATEGORY_DEFAULTS:
        return slash
    # Fuzzy contains
    for key in (
        "health_beauty",
        "beauty",
        "skincare",
        "fashion",
        "jewelry",
        "furniture",
        "home_kitchen",
        "kitchen",
        "electronics",
        "fitness",
        "kids_toys",
        "kids",
        "toys",
        "car_accessories",
    ):
        if key in raw or key.replace("_", "") in raw.replace("_", ""):
            return key if key in CATEGORY_DEFAULTS else "default"
    return "default"


def category_defaults_for(category: Optional[str]) -> Dict[str, str]:
    key = _normalize_category_key(category)
    return dict(CATEGORY_DEFAULTS.get(key) or CATEGORY_DEFAULTS["default"])


def _palette_from_brand_colors(brand_colors: Optional[Sequence[str]]) -> Optional[str]:
    if not brand_colors:
        return None
    cleaned = [str(c).strip() for c in brand_colors if c and str(c).strip()]
    if not cleaned:
        return None
    if len(cleaned) == 1:
        return f"tones drawn from brand color {cleaned[0]}"
    return f"tones drawn from brand colors {', '.join(cleaned[:3])}"


def fallback_image_variables(
    product_title: str,
    category: Optional[str] = None,
    brand_colors: Optional[Sequence[str]] = None,
) -> AmourImageVariables:
    """Deterministic fallback when the LLM call fails or returns incomplete data."""
    defaults = category_defaults_for(category)
    title = (product_title or "the product").strip() or "the product"
    # Brand colors tint the category palette; they do not force dark wine for kids/fashion.
    brand_palette = _palette_from_brand_colors(brand_colors)
    category_palette = defaults.get("palette") or NEUTRAL_PALETTE
    palette = (
        f"{category_palette}, accented with {brand_palette}"
        if brand_palette
        else category_palette
    )
    cat_label = str(category or "general").strip() or "general"
    person = (
        "a diverse child or parent with a child"
        if _normalize_category_key(category) in {"kids", "kids_toys", "toys", "kids/toys"}
        else "a diverse adult model"
    )
    return AmourImageVariables(
        product=f"the product ({title})",
        category=cat_label,
        props="subtle complementary accents, soft fabric folds, a small ceramic dish",
        interaction=defaults["interaction"],
        setting=defaults["setting"],
        palette=palette,
        mood=defaults.get("mood") or "clean commercial",
        person=person,
    )


def build_image_variables(
    product_title: str,
    product_description: str,
    category: Optional[str] = None,
    brand_colors: Optional[Sequence[str]] = None,
    *,
    llm: Any = None,
) -> AmourImageVariables:
    """
    Call the LLM once per product to fill template variables.

    On any failure, falls back to CATEGORY_DEFAULTS + neutral/brand palette.
    """
    fallback = fallback_image_variables(product_title, category, brand_colors)
    brand_hint = _palette_from_brand_colors(brand_colors) or "none provided"

    try:
        from app.clients.langchain_client import llm_4_1_nano

        client = llm if llm is not None else llm_4_1_nano
        structured = client.with_structured_output(AmourImageVariables)
        prompt = (
            "You fill visual variables for commercial product photo prompts.\n"
            "Return JSON matching the schema.\n\n"
            "Rules:\n"
            "- product: short visual description (material, color, shape). No brand names.\n"
            "- interaction: physically realistic for THIS product "
            "(never 'holding' a sofa; never 'wearing' a candle).\n"
            "- person: generic only (no real/celebrity people), diverse, age-appropriate "
            "for the category (kids products → child or parent with child).\n"
            "- props: exactly 2–3 small items as a comma-separated string.\n"
            "- palette: match the category look (kids/fashion = bright, never dark; "
            "beauty/perfume = dark wine editorial; home = warm wood). "
            "Blend in store brand colors when present.\n"
            "- mood: match category (playful bright / bright airy / dark editorial / etc).\n"
            f"- Prefer category defaults when unsure: interaction="
            f"\"{fallback.interaction}\", setting=\"{fallback.setting}\", "
            f"mood=\"{fallback.mood}\", palette=\"{fallback.palette}\".\n\n"
            f"Store category key: {category or 'general'}\n"
            f"Store brand colors: {brand_hint}\n"
            f"Product title: {product_title}\n"
            f"Product description: {product_description or '(none)'}\n"
        )
        parsed = structured.invoke(prompt)
        if not isinstance(parsed, AmourImageVariables):
            parsed = AmourImageVariables.model_validate(parsed)

        # Fill any blank fields from fallback.
        data = parsed.model_dump()
        for key in REQUIRED_VAR_KEYS:
            if not str(data.get(key) or "").strip():
                data[key] = getattr(fallback, key)
        if not str(data.get("palette") or "").strip():
            data["palette"] = fallback.palette
        return AmourImageVariables.model_validate(data)
    except (ValidationError, Exception) as exc:
        logger.warning(
            "Amour build_image_variables falling back to defaults: %s", exc
        )
        return fallback


def _format_template(template: str, variables: Dict[str, str]) -> str:
    class _Safe(dict):
        def __missing__(self, key: str) -> str:
            return "{" + key + "}"

    return template.format_map(_Safe(variables))


def build_all_prompts(vars: AmourImageVariables | Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Expand all 12 Amour templates.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if any `{placeholder}` remains unreplaced.
    """
    if isinstance(vars, AmourImageVariables):
        variables = {k: str(getattr(vars, k) or "").strip() for k in REQUIRED_VAR_KEYS}
    else:
        variables = {k: str((vars or {}).get(k) or "").strip() for k in REQUIRED_VAR_KEYS}

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Amour image variables missing required fields: {missing}")

    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        body = _format_template(row["template"], variables)
        style = _format_template(STYLE, variables)
        prompt = f"{body}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Amour prompt '{row['key']}': {leftover}"
            )
        results.append(
            {
                "key": row["key"],
                "ratio": row["ratio"],
                "image_type": row["image_type"],
                "prompt": prompt,
                "negativePrompt": NEGATIVE,
            }
        )
    return results
