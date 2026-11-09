"""
Hearth image prompts: warm, moody editorial photography for kitchen stores.

Each slot belongs to one selected product, so a store with three products shows all three.
Keys must match the images the roarr-hearth-*.liquid sections read. Product-specific variables
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

HEARTH_PALETTE = "deep umber, warm wood, brushed steel and soft cream"
HEARTH_MOOD = "warm and editorial"

STYLE = (
    "STYLE: premium kitchenware campaign photography, {mood} mood, color palette {palette}, soft "
    "directional window light, uncluttered kitchen setting, realistic material texture, sharp focus "
    "on {product}, true-to-life colors and proportions. Any person is shown only as hands and "
    "forearms, never a face. 85mm lens, high resolution."
)

_HERO = (
    "Wide kitchen campaign photograph of hands using {product}, entirely on the right half of the "
    "frame, against a plain dark umber backdrop. The left half is empty dark backdrop with no "
    "objects, for overlaid white text."
)
_TILE = (
    "Tall styled kitchen photograph of {product} on a dark wood or stone surface, in rich mid-dark "
    "tones. The center stays calm, for an overlaid white label. No people."
)
_DETAIL = (
    "Close editorial crop of {product} being used in a real kitchen, showing the material and "
    "finish, warm soft light, shallow depth of field."
)

# (product slot, key, aspect ratio, image_type for model routing, template body)
TEMPLATES: List[Dict[str, Any]] = [
    {"slot": 1, "key": "banner_image_1", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 1, "key": "gallery_image_1", "ratio": "3:4", "image_type": "creative_image", "template": _TILE},
    {"slot": 1, "key": "showcase_image_1", "ratio": "16:9", "image_type": "creative_image", "template": _DETAIL},
    {"slot": 1, "key": "story_image_1", "ratio": "3:2", "image_type": "creative_image", "template": "Relaxed lifestyle photograph of {product} in use at a sunlit kitchen island, the cook seen from the chest down."},
    {
        "slot": 1,
        "key": "lookbook_image",
        "ratio": "1:1",
        "image_type": "creative_image",
        "template": "Warm kitchen counter still life with {product} as the hero, seen from the front, with room around it, soft window light. No people.",
    },
    {"slot": 2, "key": "banner_image_2", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 2, "key": "gallery_image_2", "ratio": "3:4", "image_type": "creative_image", "template": _TILE},
    {"slot": 2, "key": "showcase_image_2", "ratio": "16:9", "image_type": "creative_image", "template": _DETAIL},
    {"slot": 2, "key": "story_image_2", "ratio": "3:2", "image_type": "creative_image", "template": "Relaxed lifestyle photograph of {product} on a rustic table set for a meal, warm evening light, no faces in frame."},
    {
        "slot": 2,
        "key": "statement_image",
        "ratio": "16:9",
        "image_type": "banner_image",
        "template": (
            "Very wide, low-key photograph of {product} on a dark slate surface, on the right half "
            "of the frame. The left half is an empty near-black surface with no objects, for "
            "overlaid white text. No people."
        ),
    },
    {"slot": 3, "key": "banner_image_3", "ratio": "16:9", "image_type": "banner_image", "template": _HERO},
    {"slot": 3, "key": "gallery_image_3", "ratio": "3:4", "image_type": "creative_image", "template": _TILE},
    {"slot": 3, "key": "gallery_image_4", "ratio": "3:4", "image_type": "product_images", "template": "Tall styled still life of {product} with a few fresh ingredients on a dark stone counter, in rich mid-dark tones. No people."},
    {"slot": 3, "key": "showcase_image_3", "ratio": "16:9", "image_type": "creative_image", "template": _DETAIL},
    {"slot": 3, "key": "showcase_image_4", "ratio": "16:9", "image_type": "product_images", "template": "Wide close-up of the material and finish of {product} on a warm neutral kitchen surface, soft daylight. No people."},
    {"slot": 3, "key": "story_image_3", "ratio": "3:2", "image_type": "creative_image", "template": "Calm, beautifully ordered kitchen counter with {product} ready to use, soft morning light. No people."},
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
    """Fill product variables once via the LLM, then pin the Hearth palette and mood."""
    filled = _fill_product_variables(
        product_title, product_description, category, None, llm=llm
    )
    return filled.model_copy(update={"palette": HEARTH_PALETTE, "mood": HEARTH_MOOD})


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
    Expand the Hearth templates for the given product slots.

    Returns list of { key, ratio, image_type, prompt, negativePrompt }.
    Raises ValueError if a required variable is blank or a `{placeholder}` is left over.
    """
    source = vars.model_dump() if isinstance(vars, AmourImageVariables) else (vars or {})
    variables = {k: str(source.get(k) or "").strip() for k in REQUIRED_VAR_KEYS}
    variables["palette"] = variables["palette"] or HEARTH_PALETTE
    variables["mood"] = variables["mood"] or HEARTH_MOOD

    missing = [k for k in REQUIRED_VAR_KEYS if not variables[k]]
    if missing:
        raise ValueError(f"Hearth image variables missing required fields: {missing}")

    style = _format(STYLE, variables)
    results: List[Dict[str, str]] = []
    for row in TEMPLATES:
        if row["slot"] not in slots:
            continue
        prompt = f"{_format(row['template'], variables)}\n\n{style}\n\nAvoid: {NEGATIVE}"
        leftover = _PLACEHOLDER_RE.findall(prompt)
        if leftover:
            raise ValueError(
                f"Unreplaced placeholders in Hearth prompt '{row['key']}': {leftover}"
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
