"""
Simmer image prompts: soft, warm editorial photography for kitchen electronics stores.

Each slot belongs to one selected product, so a store with three products shows all three.
Keys must match the images the roarr-simmer-*.liquid sections read. Product-specific variables
are filled by the Amour one-shot LLM helper; palette and mood are pinned for one house look.
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

SIMMER_PALETTE = "warm stone, soft cream, brushed steel and matte black"
SIMMER_MOOD = "calm, warm and editorial"

STYLE = (
    "STYLE: premium kitchen appliance campaign photography, {mood} mood, color palette {palette}, soft "
    "natural window light, modern uncluttered kitchen, realistic materials, sharp focus on {product}, "
    "true-to-life colors, proportions, buttons and controls. Any person is shown only as hands and "
    "forearms, never a face. 85mm lens, high resolution."
)

_HERO = (
    "Wide lifestyle photograph of {product} on a warm stone kitchen counter, placed entirely in the "
    "right half of the frame, in rich mid-dark warm tones. The left half is a calm, softly shaded "
    "empty wall and counter with no objects, for overlaid white text."
)
_SIDE = (
    "Tall narrow lifestyle photograph of hands using {product} in a warm modern kitchen, the appliance "
    "in the upper two thirds. The lower third is calm and slightly darker, for an overlaid white title."
)
_PICK_DETAIL = (
    "Tall close-up still life of {product} on a pale stone counter, showing its finish and controls, "
    "soft daylight, a few fresh ingredients nearby. No people."
)
_PICK_USE = (
    "Tall lifestyle photograph of {product} in use in a bright kitchen, food or drink being made, "
    "hands only, soft morning light."
)
_GALLERY = (
    "Social-media style tall photograph of {product} in a real home kitchen moment, natural light, "
    "warm and inviting."
)
_GALLERY_FOOD = (
    "Social-media style tall photograph of fresh food or drink made with {product}, the appliance "
    "softly visible behind, natural light."
)

# (product slot, key, aspect ratio, image_type for model routing, template body)
TEMPLATES: List[Dict[str, Any]] = [
    {"slot": 1, "key": "banner_image_1", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 1, "key": "hero_side_image", "ratio": "9:16", "image_type": "creative_image", "template": _SIDE},
    {"slot": 1, "key": "picks_left_1", "ratio": "3:4", "image_type": "creative_image", "template": _PICK_DETAIL},
    {"slot": 1, "key": "picks_right_1", "ratio": "3:4", "image_type": "creative_image", "template": _PICK_USE},
    {"slot": 1, "key": "gallery_image_1", "ratio": "3:4", "image_type": "creative_image", "template": _GALLERY},
    {"slot": 1, "key": "gallery_image_4", "ratio": "3:4", "image_type": "product_images", "template": _GALLERY_FOOD},
    {
        "slot": 1,
        "key": "lookbook_image_1",
        "ratio": "21:9",
        "image_type": "banner_image",
        "template": (
            "Very wide editorial photograph of {product} on a long kitchen counter, placed in the right "
            "half of the frame, in soft mid-dark warm tones. The left half is calm empty counter and "
            "wall, for overlaid white text. No people."
        ),
    },
    {"slot": 2, "key": "banner_image_2", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 2, "key": "picks_left_2", "ratio": "3:4", "image_type": "creative_image", "template": _PICK_DETAIL},
    {"slot": 2, "key": "picks_right_2", "ratio": "3:4", "image_type": "creative_image", "template": _PICK_USE},
    {"slot": 2, "key": "gallery_image_2", "ratio": "3:4", "image_type": "creative_image", "template": _GALLERY},
    {"slot": 2, "key": "gallery_image_5", "ratio": "3:4", "image_type": "product_images", "template": _GALLERY_FOOD},
    {"slot": 2, "key": "lookbook_image_2", "ratio": "4:5", "image_type": "creative_image", "template": "Tall calm detail photograph of {product} beside a sunlit kitchen window, soft shadows. No people."},
    {"slot": 2, "key": "faq_image", "ratio": "1:1", "image_type": "creative_image", "template": "Square lifestyle photograph of hands using {product} at a kitchen island, warm side light, shallow depth of field."},
    {"slot": 3, "key": "banner_image_3", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 3, "key": "picks_left_3", "ratio": "3:4", "image_type": "creative_image", "template": _PICK_DETAIL},
    {"slot": 3, "key": "picks_right_3", "ratio": "3:4", "image_type": "creative_image", "template": _PICK_USE},
    {"slot": 3, "key": "gallery_image_3", "ratio": "3:4", "image_type": "creative_image", "template": _GALLERY},
    {"slot": 3, "key": "gallery_image_6", "ratio": "3:4", "image_type": "product_images", "template": _GALLERY_FOOD},
    {"slot": 3, "key": "lookbook_image_3", "ratio": "4:5", "image_type": "creative_image", "template": "Tall close photograph of hands pressing the controls of {product}, soft daylight."},
    {
        "slot": 3,
        "key": "lookbook_image_4",
        "ratio": "21:9",
        "image_type": "banner_image",
        "template": (
            "Very wide moody kitchen photograph with {product} on the counter, in soft mid-dark warm tones. "
            "The center of the frame stays calm, for an overlaid white heading and play button. No people."
        ),
    },
]

_PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


def build_image_variables(
    product_title: str,
    product_description: str,
    category: Optional[str] = None,
    brand_colors: Optional[Sequence[str]] = None,
    *,
    llm: Any = None,
) -> AmourImageVariables:
    """Fill product variables once via the LLM, then pin the Simmer palette and mood."""
    filled = _fill_product_variables(
        product_title, product_description, category, None, llm=llm
    )
    return filled.model_copy(update={"palette": SIMMER_PALETTE, "mood": SIMMER_MOOD})


def _format(template: str, variables: Dict[str, str]) -> str:
    class _Safe(dict):
        def __missing__(self, key: str) -> str:
            return "{" + key + "}"

    return template.format_map(_Safe(variables))


def build_all_prompts(
    vars: AmourImageVariables | Dict[str, Any],
    slots: Sequence[int] = (1, 2, 3),
) -> List[Dict[str, str]]:
    """
    Expand the Simmer templates for the given product slots.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if a required variable is blank or a `{placeholder}` is left over.
    """
    source = vars.model_dump() if isinstance(vars, AmourImageVariables) else (vars or {})
    variables = {k: str(source.get(k) or "").strip() for k in REQUIRED_VAR_KEYS}
    variables["palette"] = variables["palette"] or SIMMER_PALETTE
    variables["mood"] = variables["mood"] or SIMMER_MOOD

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Simmer image variables missing required fields: {missing}")

    style = _format(STYLE, variables)
    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        if row["slot"] not in slots:
            continue
        prompt = f"{_format(row['template'], variables)}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Simmer prompt '{row['key']}': {leftover}"
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


def slots_for_product(index: int, product_count: int) -> List[int]:
    """Image slots for product `index` (1-based): products share all three slots between them."""
    if product_count <= 1:
        return [1, 2, 3]
    if product_count == 2:
        return [1, 3] if index == 1 else [2]
    return [index]
