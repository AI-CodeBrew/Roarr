#!/usr/bin/env python3
"""
Print all 12 filled Amour image prompts for a sample product (no image generation).

Usage (from backend/backend):
    python3 scripts/preview_amour_prompts.py
    python3 scripts/preview_amour_prompts.py --category beauty --title "Rose Serum"
    python3 scripts/preview_amour_prompts.py --llm   # call LLM for variables (needs OPENAI_API_KEY)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

try:
    from dotenv import load_dotenv

    load_dotenv(backend_dir / ".env")
except ImportError:
    pass

from app.modules.generate.store.templates.packs.amour.image_prompts import (
    build_all_prompts,
    build_image_variables,
    fallback_image_variables,
)

SAMPLES = {
    "beauty": {
        "title": "Noir Rose Face Serum",
        "description": "A glass dropper bottle of rose-gold facial oil serum for glowing skin.",
        "category": "health_beauty",
        "brand_colors": ["#4A0E1F", "#C9A86A"],
    },
    "furniture": {
        "title": "Oak Lounge Armchair",
        "description": "A mid-century oak frame armchair with soft ivory boucle upholstery.",
        "category": "home_kitchen",
        "brand_colors": ["#2C241B", "#E8DFD0"],
    },
    "electronics": {
        "title": "Aurora Wireless Earbuds",
        "description": "Matte black true wireless earbuds with a compact charging case.",
        "category": "general",
        "brand_colors": ["#111111", "#5B8DEF"],
    },
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Preview Amour templated image prompts")
    parser.add_argument(
        "--sample",
        choices=sorted(SAMPLES.keys()),
        default="beauty",
        help="Built-in sample product (default: beauty)",
    )
    parser.add_argument("--title", default=None, help="Override product title")
    parser.add_argument("--description", default=None, help="Override product description")
    parser.add_argument("--category", default=None, help="Override category key")
    parser.add_argument(
        "--brand-color",
        action="append",
        dest="brand_colors",
        default=None,
        help="Brand hex color (repeatable)",
    )
    parser.add_argument(
        "--llm",
        action="store_true",
        help="Fill variables via LLM instead of deterministic fallbacks",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable JSON instead of human text",
    )
    args = parser.parse_args()

    sample = dict(SAMPLES[args.sample])
    title = args.title or sample["title"]
    description = args.description or sample["description"]
    category = args.category or sample["category"]
    brand_colors = args.brand_colors or sample.get("brand_colors")

    if args.llm:
        variables = build_image_variables(
            product_title=title,
            product_description=description,
            category=category,
            brand_colors=brand_colors,
        )
    else:
        variables = fallback_image_variables(
            product_title=title,
            category=category,
            brand_colors=brand_colors,
        )
        # Enrich product description into the visual product string for preview.
        variables.product = (
            f"a product matching '{title}' — {description[:120].rstrip()}"
        )

    slots = build_all_prompts(variables)

    if args.json:
        print(
            json.dumps(
                {
                    "variables": variables.model_dump(),
                    "prompts": slots,
                },
                indent=2,
            )
        )
        return 0

    print("=" * 72)
    print(f"Amour prompt preview — sample={args.sample}")
    print(f"title: {title}")
    print(f"category: {category}")
    print(f"variables: {json.dumps(variables.model_dump(), indent=2)}")
    print("=" * 72)
    for spec in slots:
        print(f"\n### {spec['key']}  ({spec['ratio']})")
        print(spec["prompt"])
        print(f"\n[negativePrompt] {spec['negativePrompt']}")
    print(f"\nTotal slots: {len(slots)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
