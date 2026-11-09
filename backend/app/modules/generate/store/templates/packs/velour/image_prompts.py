"""
Velour image prompts: warm, moody editorial photography for clothing stores.

Each slot belongs to one selected product, so a store with three products shows all three.
Keys must match the images the roarr-velour-*.liquid sections read. Product-specific variables
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

VELOUR_PALETTE = "deep umber, warm taupe, soft cream and natural skin tones"
VELOUR_MOOD = "warm and editorial"

STYLE = (
    "STYLE: premium clothing campaign photography, {mood} mood, color palette {palette}, soft "
    "directional studio light, clean uncluttered backdrop, realistic fabric texture and drape, "
    "sharp focus on {product}, true-to-life garment colors and proportions, 85mm lens, high resolution."
)

_HERO = (
    "Wide fashion campaign photograph of {person} wearing {product}, standing on the right half of "
    "the frame, against a plain deep umber studio backdrop. The left half is empty dark backdrop "
    "with no objects, for overlaid white text."
)
_TILE = (
    "Tall full-length fashion photograph of {person} wearing {product}, soft neutral backdrop, "
    "the garment fills the frame. The center stays calm, for an overlaid white label."
)
_DETAIL = (
    "Close editorial crop of {person} wearing {product}, showing the fabric, seams and how the "
    "garment falls, warm soft light, shallow depth of field."
)

# (product slot, key, aspect ratio, image_type for model routing, template body)
TEMPLATES: List[Dict[str, Any]] = [
    {"slot": 1, "key": "banner_image_1", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 1, "key": "gallery_image_1", "ratio": "3:4", "image_type": "creative_image", "template": _TILE},
    {"slot": 1, "key": "showcase_image_1", "ratio": "16:9", "image_type": "creative_image", "template": _DETAIL},
    {"slot": 1, "key": "story_image_1", "ratio": "3:2", "image_type": "creative_image", "template": "Relaxed lifestyle photograph of {person} wearing {product}, walking through a calm sunlit interior."},
    {
        "slot": 1,
        "key": "lookbook_image",
        "ratio": "1:1",
        "image_type": "creative_image",
        "template": "Fashion lookbook photograph of {person} wearing {product}, three-quarter length, the outfit fills the frame, warm neutral studio backdrop.",
    },
    {"slot": 2, "key": "banner_image_2", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 2, "key": "gallery_image_2", "ratio": "3:4", "image_type": "creative_image", "template": _TILE},
    {"slot": 2, "key": "showcase_image_2", "ratio": "16:9", "image_type": "creative_image", "template": _DETAIL},
    {"slot": 2, "key": "story_image_2", "ratio": "3:2", "image_type": "creative_image", "template": "Relaxed lifestyle photograph of {person} wearing {product}, seated by a tall window in soft daylight."},
    {
        "slot": 2,
        "key": "statement_image",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Very wide, low-key photograph of {product} hanging on a slim dark rail, on the right "
            "half of the frame, in a dim charcoal room. The left half is empty dark wall with no "
            "objects, for overlaid white text. No people."
        ),
    },
    {"slot": 3, "key": "banner_image_3", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 3, "key": "gallery_image_3", "ratio": "3:4", "image_type": "creative_image", "template": _TILE},
    {"slot": 3, "key": "gallery_image_4", "ratio": "3:4", "image_type": "product_images", "template": "Tall styled flat lay of {product} neatly folded on pale linen with soft daylight. No people."},
    {"slot": 3, "key": "showcase_image_3", "ratio": "16:9", "image_type": "creative_image", "template": _DETAIL},
    {"slot": 3, "key": "showcase_image_4", "ratio": "16:9", "image_type": "product_images", "template": "Wide close-up of the fabric weave and stitching of {product}, draped softly on a warm neutral surface, soft daylight. No people."},
    {"slot": 3, "key": "story_image_3", "ratio": "3:2", "image_type": "creative_image", "template": "Relaxed lifestyle photograph of {person} wearing {product}, on a quiet city street in soft morning light."},
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
    """Fill product variables once via the LLM, then pin the Velour palette and mood."""
    filled = _fill_product_variables(
        product_title, product_description, category, None, llm=llm
    )
    return filled.model_copy(update={"palette": VELOUR_PALETTE, "mood": VELOUR_MOOD})


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
    Expand the Velour templates for the given product slots.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if a required variable is blank or a `{placeholder}` is left over.
    """
    source = vars.model_dump() if isinstance(vars, AmourImageVariables) else (vars or {})
    variables = {k: str(source.get(k) or "").strip() for k in REQUIRED_VAR_KEYS}
    variables["palette"] = variables["palette"] or VELOUR_PALETTE
    variables["mood"] = variables["mood"] or VELOUR_MOOD

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Velour image variables missing required fields: {missing}")

    style = _format(STYLE, variables)
    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        if row["slot"] not in slots:
            continue
        prompt = f"{_format(row['template'], variables)}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Velour prompt '{row['key']}': {leftover}"
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
