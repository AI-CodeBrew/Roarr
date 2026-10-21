#!/usr/bin/env python3
"""
Showcase card images (product_image_1..3) for the Amour homepage demo.

Uses the same prompts as real Amour stores (packs/amour/image_prompts.py) and each
category's existing Amour demo product (product_base_image in home-data.js) as the
reference, so the demo matches what merchants get.

Usage (from backend/backend):
    ./venv/bin/python -u scripts/generate_amour_showcase_demo_images.py
    ./venv/bin/python -u scripts/generate_amour_showcase_demo_images.py --category fashion
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

try:
    from dotenv import load_dotenv

    load_dotenv(backend_dir / ".env")
except ImportError:
    pass

from app.modules.generate.generate_images import (
    PRODUCT_FIDELITY_PROMPT,
    cleanup_temp_directory,
    convert_urls_to_paths,
    generate_images_concurrent,
)
from app.modules.generate.store.templates.packs.amour.image_prompts import (
    build_all_prompts,
    fallback_image_variables,
)

AMOUR_CATEGORY_ACCENTS = {
    "health_beauty": "#6B0808",
    "fashion": "#EC4899",
    "kids_toys": "#EA580C",
    "home_kitchen": "#6C4E2D",
    "car_accessories": "#2563EB",
    "general": "#64748B",
}

# Amour demo products (title + product_base_image from home-data.js).
CATEGORY_REFERENCES = {
    "health_beauty": {
        "title": "Noir Rose Eau de Parfum",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3e293a6f_zambeel_ai_generated_image.jpg",
    },
    "fashion": {
        "title": "Bordeaux Leather Crossbody Bag",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a24f68bd_zambeel_ai_generated_image.jpg",
    },
    "home_kitchen": {
        "title": "Amber Glow Soy Candle",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/10fac164_zambeel_ai_generated_image.jpg",
    },
    "kids_toys": {
        "title": "Twirling Ballerina Music Box",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/74192ec1_zambeel_ai_generated_image.jpg",
    },
    "car_accessories": {
        "title": "Aura Car Vent Diffuser",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8d681d84_zambeel_ai_generated_image.jpg",
    },
    "general": {
        "title": "Heritage Leather Strap Watch",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/eb7e5688_zambeel_ai_generated_image.jpg",
    },
}

IMAGE_KEYS = ["product_image_1", "product_image_2", "product_image_3"]
MANIFEST_PATH = backend_dir / "scripts" / "amour_showcase_demo_images_manifest.json"


def generate_category(category: str, dry_run: bool = False) -> dict:
    meta = CATEGORY_REFERENCES[category]
    print(f"\n{'=' * 72}\n{category}: {meta['title']}\n{'=' * 72}", flush=True)
    accent = AMOUR_CATEGORY_ACCENTS.get(category)
    variables = fallback_image_variables(
        meta["title"],
        category=category,
        brand_colors=[accent] if accent else None,
    )
    slot_specs = [
        spec for spec in build_all_prompts(variables) if spec["key"] in IMAGE_KEYS
    ]
    context = (
        f"Reference product: {meta['title']}\n"
        f"Keep the product visually faithful to the reference images.\n\n"
        f"{PRODUCT_FIDELITY_PROMPT}"
    )
    prompts = [f"{context}\n\n{spec['prompt']}" for spec in slot_specs]
    if dry_run:
        return {spec["key"]: "(dry-run)" for spec in slot_specs}

    temp_dir = tempfile.mkdtemp(prefix=f"amour_showcase_{category}_")
    try:
        paths = convert_urls_to_paths([meta["reference"]], temp_dir)
        if not paths:
            raise RuntimeError(f"Failed to download reference for {category}")
        urls = generate_images_concurrent(
            paths,
            prompts,
            temp_dir,
            image_types=[spec["image_type"] for spec in slot_specs],
            aspect_ratios=[spec["ratio"] for spec in slot_specs],
            max_workers=min(4, len(slot_specs)),
        )
        out = {}
        for i, spec in enumerate(slot_specs):
            url = urls[i] if i < len(urls) else None
            out[spec["key"]] = url
            print(f"  {'OK' if url else 'FAIL'} {spec['key']}: {url}", flush=True)
        return out
    finally:
        cleanup_temp_directory(temp_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=sorted(CATEGORY_REFERENCES.keys()))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    required = ["GEMINI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    missing = [v for v in required if not os.getenv(v)]
    if missing and not args.dry_run:
        print("Missing env:", ", ".join(missing))
        sys.exit(1)

    categories = [args.category] if args.category else list(CATEGORY_REFERENCES.keys())
    manifest = {}
    if MANIFEST_PATH.exists() and not args.dry_run:
        try:
            manifest = json.loads(MANIFEST_PATH.read_text())
        except Exception:
            manifest = {}

    for cat in categories:
        result = generate_category(cat, dry_run=args.dry_run)
        if args.dry_run:
            continue
        merged = {**(manifest.get(cat) or {})}
        merged.update({k: v for k, v in result.items() if v})
        manifest[cat] = merged
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Wrote {MANIFEST_PATH}", flush=True)

    print("\nDone.", flush=True)


if __name__ == "__main__":
    main()
