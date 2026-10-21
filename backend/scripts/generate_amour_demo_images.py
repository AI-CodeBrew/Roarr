#!/usr/bin/env python3
"""
Generate Amour homepage demo images for every store category (all 12 slots),
using the category-aware templated prompts (kids/fashion bright; beauty dark).

Uploads to the public Zambeel S3 bucket and writes a JSON manifest. Paste the
manifest into frontend/.../home-data.js → AMOUR_HOME_IMAGES_BY_CATEGORY
(keeping each category's existing product_base_image as the reference).

Usage (from backend/backend):
    ./venv/bin/python -u scripts/generate_amour_demo_images.py
    ./venv/bin/python -u scripts/generate_amour_demo_images.py --category kids_toys
    ./venv/bin/python -u scripts/generate_amour_demo_images.py --dry-run
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

# Matches Amour category accents (preview/publish theme colors).
AMOUR_CATEGORY_ACCENTS = {
    "health_beauty": "#6B0808",
    "fashion": "#EC4899",
    "kids_toys": "#EA580C",
    "home_kitchen": "#6C4E2D",
    "car_accessories": "#2563EB",
    "general": "#64748B",
}

# Demo products (title + product_base_image currently in home-data.js).
CATEGORY_REFERENCES = {
    "health_beauty": {
        "title": "Noir Rose Eau de Parfum",
        "description": "A dark glass perfume bottle with rose-gold accents and a soft floral scent.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3e293a6f_zambeel_ai_generated_image.jpg",
    },
    "fashion": {
        "title": "Bordeaux Leather Crossbody Bag",
        "description": "A structured leather crossbody bag with polished hardware.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a24f68bd_zambeel_ai_generated_image.jpg",
    },
    "home_kitchen": {
        "title": "Amber Glow Soy Candle",
        "description": "A soy candle in an amber glass jar with a warm wooden lid.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/10fac164_zambeel_ai_generated_image.jpg",
    },
    "kids_toys": {
        "title": "Twirling Ballerina Music Box",
        "description": "A pastel music box with a twirling ballerina figure.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/74192ec1_zambeel_ai_generated_image.jpg",
    },
    "car_accessories": {
        "title": "Aura Car Vent Diffuser",
        "description": "A compact car vent fragrance diffuser with a clean modern finish.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8d681d84_zambeel_ai_generated_image.jpg",
    },
    "general": {
        "title": "Heritage Leather Strap Watch",
        "description": "A classic wristwatch with a leather strap and minimal dial.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/eb7e5688_zambeel_ai_generated_image.jpg",
    },
}

MANIFEST_PATH = backend_dir / "scripts" / "amour_demo_images_manifest.json"


def generate_category(category: str, dry_run: bool = False) -> dict:
    meta = CATEGORY_REFERENCES[category]
    accent = AMOUR_CATEGORY_ACCENTS.get(category)
    print(f"\n{'=' * 72}\n{category}: {meta['title']} (accent={accent})\n{'=' * 72}", flush=True)

    variables = fallback_image_variables(
        product_title=meta["title"],
        category=category,
        brand_colors=[accent] if accent else None,
    )
    # Prefer a visual product phrase for demos.
    variables.product = (
        f"{meta['title']} — {meta.get('description') or 'the product'}"
    )
    slot_specs = build_all_prompts(variables)
    context = (
        f"Reference product: {meta['title']}\n"
        f"Description: {meta.get('description') or ''}\n"
        f"Keep the product visually faithful to the reference images.\n\n"
        f"{PRODUCT_FIDELITY_PROMPT}"
    )
    prompts = [f"{context}\n\n{spec['prompt']}" for spec in slot_specs]
    if dry_run:
        for spec in slot_specs:
            print(f"  DRY {spec['key']} ({spec['ratio']})", flush=True)
        return {spec["key"]: "(dry-run)" for spec in slot_specs}

    temp_dir = tempfile.mkdtemp(prefix=f"amour_demo_{category}_")
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
            max_workers=4,
        )
        out = {"product_base_image": meta["reference"]}
        for i, spec in enumerate(slot_specs):
            url = urls[i] if i < len(urls) else None
            out[spec["key"]] = url
            print(f"  {'OK' if url else 'FAIL'} {spec['key']}: {url}", flush=True)
        return out
    finally:
        cleanup_temp_directory(temp_dir)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=sorted(CATEGORY_REFERENCES.keys()))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    required = ["GEMINI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    missing = [v for v in required if not os.getenv(v)]
    if missing and not args.dry_run:
        print("Missing env:", ", ".join(missing))
        return 1

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
        merged.update({k: v for k, v in result.items() if v and v != "(dry-run)"})
        manifest[cat] = merged
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Wrote {MANIFEST_PATH}", flush=True)

    print("\nDone.", flush=True)
    if not args.dry_run:
        print(
            f"Next: copy image URLs from {MANIFEST_PATH.name} into "
            "AMOUR_HOME_IMAGES_BY_CATEGORY in home-data.js",
            flush=True,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
