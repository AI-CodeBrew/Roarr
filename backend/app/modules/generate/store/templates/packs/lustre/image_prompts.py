"""
Lustre image prompts: warm, bright boutique photography for fashion and jewelry stores.

Each slot belongs to one selected product, so a store with three products shows all three.
Keys must match the images the roarr-lustre-*.liquid sections read. Product-specific variables
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

LUSTRE_PALETTE = "warm tan, soft cream, pale grey and natural skin tones"
LUSTRE_MOOD = "polished and warm"

STYLE = (
    "STYLE: premium fashion e-commerce photography, {mood} mood, color palette {palette}, soft "
    "studio light, clean uncluttered backdrop, realistic materials, sharp focus on {product}, "
    "true-to-life product colors and proportions, 85mm lens, high resolution."
)

# (product slot, key, aspect ratio, image_type for model routing, template body)
TEMPLATES: List[Dict[str, Any]] = [
    {
        "slot": 1,
        "key": "banner_image_1",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Wide campaign photograph of {person} wearing or holding {product} on the right half "
            "of the frame, on a plain warm tan seamless backdrop. The left half is empty backdrop "
            "with no objects, for overlaid text."
        ),
    },
    {
        "slot": 1,
        "key": "about_image_1",
        "ratio": "4:5",
        "image_type": "creative_image",
        "template": "Close editorial portrait of {person} with {product}, soft neutral backdrop.",
    },
    {
        "slot": 1,
        "key": "feature_image_1",
        "ratio": "3:4",
        "image_type": "creative_image",
        "template": (
            "Tall, tightly cropped lifestyle photograph with {product} as the clear subject, worn "
            "or held by {person}, warm skin tones. The lower quarter is calm, with no key detail."
        ),
    },
    {
        "slot": 1,
        "key": "promo_image_1",
        "ratio": "5:4",
        "image_type": "creative_image",
        "template": "Photograph of {person} with {product}, in front of a plain pale grey studio wall, color #f5f5f5.",
    },
    {
        "slot": 2,
        "key": "banner_image_2",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Wide campaign photograph of {person} wearing or holding {product} on the right half "
            "of the frame, on a plain warm tan seamless backdrop. The left half is empty backdrop "
            "with no objects, for overlaid text."
        ),
    },
    {
        "slot": 2,
        "key": "about_image_2",
        "ratio": "1:1",
        "image_type": "product_images",
        "template": "Elegant flat lay of {product} on crumpled ivory paper and pale stone, soft daylight. No people.",
    },
    {
        "slot": 2,
        "key": "feature_image_2",
        "ratio": "3:4",
        "image_type": "creative_image",
        "template": (
            "Tall, tightly cropped lifestyle photograph with {product} as the clear subject, worn "
            "or held by {person}, warm skin tones. The lower quarter is calm, with no key detail."
        ),
    },
    {
        "slot": 2,
        "key": "promo_image_2",
        "ratio": "5:4",
        "image_type": "creative_image",
        "template": "Photograph of {person} with {product}, in front of a plain pale grey studio wall, color #f5f5f5.",
    },
    {
        "slot": 3,
        "key": "banner_image_3",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Wide campaign photograph of {person} wearing or holding {product} on the right half "
            "of the frame, on a plain warm tan seamless backdrop. The left half is empty backdrop "
            "with no objects, for overlaid text."
        ),
    },
    {
        "slot": 3,
        "key": "feature_image_3",
        "ratio": "3:4",
        "image_type": "creative_image",
        "template": (
            "Tall, tightly cropped lifestyle photograph with {product} as the clear subject, worn "
            "or held by {person}, warm skin tones. The lower quarter is calm, with no key detail."
        ),
    },
    {
        "slot": 3,
        "key": "split_image",
        "ratio": "4:3",
        "image_type": "creative_image",
        "template": "Joyful portrait of {person} with {product}, on a plain warm tan seamless backdrop.",
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
    """Fill product variables once via the LLM, then pin the Lustre palette and mood."""
    filled = _fill_product_variables(
        product_title, product_description, category, None, llm=llm
    )
    return filled.model_copy(update={"palette": LUSTRE_PALETTE, "mood": LUSTRE_MOOD})


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
    Expand the Lustre templates for the given product slots.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if a required variable is blank or a `{placeholder}` is left over.
    """
    source = vars.model_dump() if isinstance(vars, AmourImageVariables) else (vars or {})
    variables = {k: str(source.get(k) or "").strip() for k in REQUIRED_VAR_KEYS}
    variables["palette"] = variables["palette"] or LUSTRE_PALETTE
    variables["mood"] = variables["mood"] or LUSTRE_MOOD

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Lustre image variables missing required fields: {missing}")

    style = _format(STYLE, variables)
    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        if row["slot"] not in slots:
            continue
        prompt = f"{_format(row['template'], variables)}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Lustre prompt '{row['key']}': {leftover}"
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
