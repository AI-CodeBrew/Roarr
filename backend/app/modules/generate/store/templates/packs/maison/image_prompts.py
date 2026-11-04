"""
Maison image prompts: quiet-luxury product photography on ivory, bone and champagne.

Keys and ratios must stay in sync with packs/maison/image_keys.json and the
roarr-maison-*.liquid sections that read them.

Product-specific variables (product, props, interaction, setting, person) are filled by the
Amour one-shot LLM helper. Palette and mood are pinned here so every Maison store keeps the
same house look whatever the category or brand colour.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Sequence

from app.modules.generate.store.templates.packs.amour.image_prompts import (
    NEGATIVE,
    REQUIRED_VAR_KEYS,
    AmourImageVariables,
    build_image_variables as _fill_product_variables,
)

MAISON_PALETTE = "ivory, bone, warm taupe and soft champagne gold"
MAISON_MOOD = "quiet luxury"

STYLE = (
    "STYLE: quiet-luxury commercial photography, {mood} mood, color palette {palette}, "
    "soft diffused window light, refined natural textures such as travertine, linen and "
    "brushed brass, calm composition with generous negative space, realistic materials, "
    "sharp focus on {product}, true-to-life product colors and proportions, 85mm lens, "
    "high resolution."
)

# (key, aspect ratio, image_type for Gemini routing, template body)
TEMPLATES: List[Dict[str, str]] = [
    {
        "key": "maison_hero_image",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Wide editorial campaign photograph of {product} standing on a low honed "
            "travertine plinth in the right half of the frame, in a calm room with a warm "
            "ivory plaster wall. Soft window light from the left casts long, gentle "
            "shadows across the wall. The left half of the frame is quiet negative space. "
            "No people."
        ),
    },
    {
        "key": "maison_inline_image",
        "ratio": "1:1",
        "image_type": "creative_image",
        "template": (
            "Abstract, tightly cropped close-up of the materials and finish of {product}, "
            "read as a texture swatch: soft focus at the edges, warm champagne and ivory "
            "tones, gentle light, no visible text. No people."
        ),
    },
    {
        "key": "maison_piece_image",
        "ratio": "4:5",
        "image_type": "product_images",
        "template": (
            "Refined packshot of {product}, three-quarter view, centered on a bone-white "
            "seamless sweep with a faint soft reflection on a polished surface below. "
            "Delicate rim light separates the product from the background, champagne "
            "highlights on its edges. Product fills about 65% of the frame. No people."
        ),
    },
    {
        "key": "maison_gallery_1",
        "ratio": "4:5",
        "image_type": "creative_image",
        "template": (
            "Close crop of {person}'s hands {interaction} {product}, wearing cream linen "
            "cuffs, face not visible, shallow depth of field, ivory and champagne tones, "
            "natural skin tones, unhurried and intimate."
        ),
    },
    {
        "key": "maison_gallery_2",
        "ratio": "4:5",
        "image_type": "creative_image",
        "template": (
            "Still life of {product} with {props} on a slab of honed marble, low side "
            "angle, long soft shadows, magazine-style composition with generous negative "
            "space on one side. No people."
        ),
    },
    {
        "key": "maison_gallery_3",
        "ratio": "4:5",
        "image_type": "creative_image",
        "template": (
            "{product} placed naturally in {setting}, styled as a refined quiet-luxury "
            "interior in warm neutrals with one champagne-gold accent, shallow depth of "
            "field, the product clearly the focal point. No people."
        ),
    },
    {
        "key": "maison_craft_image",
        "ratio": "1:1",
        "image_type": "creative_image",
        "template": (
            "Extreme macro close-up of {product} showing material texture and finish, "
            "ultra-sharp on a small area with creamy bokeh elsewhere, warm directional "
            "light, conveys craftsmanship and quality. No people."
        ),
    },
    {
        "key": "maison_banner_image",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Wide cinematic still life of {product} placed in the right third of the "
            "frame on dark honed stone, deep warm taupe and champagne tones, one soft "
            "directional light. The left half is calm, softly shadowed negative space "
            "suitable for overlaid text. No people."
        ),
    },
]

MAISON_IMAGE_RATIOS = {row["key"]: row["ratio"] for row in TEMPLATES}

_PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


def build_image_variables(
    product_title: str,
    product_description: str,
    category: Optional[str] = None,
    brand_colors: Optional[Sequence[str]] = None,
    *,
    llm: Any = None,
) -> AmourImageVariables:
    """Fill product variables once via the LLM, then pin the Maison palette and mood.

    `brand_colors` is accepted for call-compatibility with other packs and ignored:
    the Maison look is deliberately fixed.
    """
    filled = _fill_product_variables(
        product_title, product_description, category, None, llm=llm
    )
    return filled.model_copy(update={"palette": MAISON_PALETTE, "mood": MAISON_MOOD})


def _format(template: str, variables: Dict[str, str]) -> str:
    class _Safe(dict):
        def __missing__(self, key: str) -> str:
            return "{" + key + "}"

    return template.format_map(_Safe(variables))


def build_all_prompts(vars: AmourImageVariables | Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Expand all Maison templates.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if a required variable is blank or a `{placeholder}` is left over.
    """
    source = vars.model_dump() if isinstance(vars, AmourImageVariables) else (vars or {})
    variables = {k: str(source.get(k) or "").strip() for k in REQUIRED_VAR_KEYS}
    variables["palette"] = variables["palette"] or MAISON_PALETTE
    variables["mood"] = variables["mood"] or MAISON_MOOD

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Maison image variables missing required fields: {missing}")

    style = _format(STYLE, variables)
    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        prompt = f"{_format(row['template'], variables)}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Maison prompt '{row['key']}': {leftover}"
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
