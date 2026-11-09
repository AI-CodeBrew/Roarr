"""
Tempo image prompts: bright, clean product photography on pure white (so the shots blend into the peach,
grey and white sections) plus three warm lifestyle scenes.

Keys and ratios must stay in sync with packs/tempo/image_keys.json and the
roarr-tempo-*.liquid sections that read them.

Product-specific variables (product, props, interaction, setting, person) are filled by the
Amour one-shot LLM helper. Palette and mood are pinned here so every Tempo store keeps the
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

TEMPO_PALETTE = "pure white, soft peach, deep navy and coral orange"
TEMPO_MOOD = "fresh, bright and friendly"

STYLE = (
    "STYLE: clean commercial product photography, {mood} mood, color palette {palette}, "
    "soft even studio light, gentle natural shadows, realistic materials, sharp focus on {product}, "
    "true-to-life product colors and proportions, 85mm lens, high resolution."
)

# Packshots sit on a pure white background so the sections can blend them in with multiply.
WHITE_BG = (
    "on a pure white seamless background (RGB 255, 255, 255) with a soft natural shadow beneath, "
    "no props, no text, no reflections of other objects. No people."
)

# (key, aspect ratio, image_type for Gemini routing, template body)
TEMPLATES: List[Dict[str, str]] = [
    {
        "key": "tempo_hero_1",
        "ratio": "4:5",
        "image_type": "product_images",
        "template": (
            "Product photograph of {product}, three-quarter view turned slightly to the left, "
            "centered with generous white margin around it, " + WHITE_BG
        ),
    },
    {
        "key": "tempo_hero_2",
        "ratio": "4:5",
        "image_type": "product_images",
        "template": (
            "Product photograph of {product}, three-quarter view turned slightly to the right "
            "and tilted a few degrees, centered with generous white margin around it, " + WHITE_BG
        ),
    },
    {
        "key": "tempo_hero_3",
        "ratio": "4:5",
        "image_type": "product_images",
        "template": (
            "Straight-on front view of {product}, perfectly centered with generous white margin "
            "around it, " + WHITE_BG
        ),
    },
    {
        "key": "tempo_product_image",
        "ratio": "1:1",
        "image_type": "product_images",
        "template": (
            "Clean e-commerce hero shot of {product}, slightly angled to show its form, centered, "
            "product fills about 70% of the frame, " + WHITE_BG
        ),
    },
    {
        "key": "tempo_detail_image",
        "ratio": "1:1",
        "image_type": "product_images",
        "template": (
            "Close, slightly cropped three-quarter view of {product} that shows its most distinctive "
            "detail and finish, product fills about 80% of the frame, " + WHITE_BG
        ),
    },
    {
        "key": "tempo_showcase_image",
        "ratio": "1:1",
        "image_type": "product_images",
        "template": (
            "Front three-quarter view of {product}, centered, product fills about 75% of the frame, "
            + WHITE_BG
        ),
    },
    {
        "key": "tempo_story_1",
        "ratio": "4:3",
        "image_type": "creative_image",
        "template": (
            "Bright overhead lifestyle photograph of {product} with {props} on a light wooden desk, "
            "{person}'s hand {interaction} {product}, soft daylight, warm neutral tones with a hint "
            "of coral, the product clearly the focal point. Face not visible."
        ),
    },
    {
        "key": "tempo_story_2",
        "ratio": "4:3",
        "image_type": "creative_image",
        "template": (
            "Bright lifestyle photograph of {product} being used on the move, {person} {interaction} "
            "{product} outdoors in soft daylight, light airy background, coral and navy accents, the "
            "product clearly the focal point. Face not the focus."
        ),
    },
    {
        "key": "tempo_story_3",
        "ratio": "4:3",
        "image_type": "creative_image",
        "template": (
            "Cozy lifestyle photograph of {product} placed naturally in {setting}, warm soft light, "
            "peach and cream tones with one navy accent, shallow depth of field, the product clearly "
            "the focal point. No people."
        ),
    },
]

TEMPO_IMAGE_RATIOS = {row["key"]: row["ratio"] for row in TEMPLATES}

_PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


def build_image_variables(
    product_title: str,
    product_description: str,
    category: Optional[str] = None,
    brand_colors: Optional[Sequence[str]] = None,
    *,
    llm: Any = None,
) -> AmourImageVariables:
    """Fill product variables once via the LLM, then pin the Tempo palette and mood.

    `brand_colors` is accepted for call-compatibility with other packs and ignored:
    the Tempo look is deliberately fixed.
    """
    filled = _fill_product_variables(
        product_title, product_description, category, None, llm=llm
    )
    return filled.model_copy(update={"palette": TEMPO_PALETTE, "mood": TEMPO_MOOD})


def _format(template: str, variables: Dict[str, str]) -> str:
    class _Safe(dict):
        def __missing__(self, key: str) -> str:
            return "{" + key + "}"

    return template.format_map(_Safe(variables))


def build_all_prompts(vars: AmourImageVariables | Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Expand all Tempo templates.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if a required variable is blank or a `{placeholder}` is left over.
    """
    source = vars.model_dump() if isinstance(vars, AmourImageVariables) else (vars or {})
    variables = {k: str(source.get(k) or "").strip() for k in REQUIRED_VAR_KEYS}
    variables["palette"] = variables["palette"] or TEMPO_PALETTE
    variables["mood"] = variables["mood"] or TEMPO_MOOD

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Tempo image variables missing required fields: {missing}")

    style = _format(STYLE, variables)
    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        prompt = f"{_format(row['template'], variables)}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Tempo prompt '{row['key']}': {leftover}"
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
