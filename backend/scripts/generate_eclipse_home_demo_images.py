#!/usr/bin/env python3
"""
Homepage images for the prepaid Eclipse demo.

Each category uses the SAME product already on the Sleek product page, but every
slot is a new shot sized for the cinematic homepage. Product-page files are not reused.

Ratios match packs/cinematic/image_keys.json:
  banner_image 16:9, banner_image_mobile 9:16, story / why-shop / circle 1:1.

Usage (from kluck-ai/backend):
    ./venv/bin/python -u scripts/generate_eclipse_home_demo_images.py
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
    cleanup_temp_directory,
    convert_urls_to_paths,
    generate_images_concurrent,
)

CATEGORY_REFERENCES = {
    "kids_toys": {
        "title": "Wooden Abacus and Ramp Set",
        "description": "A colorful wooden abacus with a small vehicle ramp, made for kids.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cad40108_zambeel_ai_generated_image.jpg",
        "place": "a bright playroom with warm wood, soft daylight, and a calm floor",
    },
    "general": {
        "title": "Stanley Quencher tumbler",
        "description": "A tall stainless steel tumbler with a handle, straw lid, and soft pastel finish.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d1419d62_zambeel_ai_generated_image.jpg",
        "place": "a clean desk or kitchen counter in soft cinematic daylight",
    },
    "fashion": {
        "title": "Royal Blue Crystal Silver Plated Bracelet",
        "description": "A silver-plated bracelet set with royal blue crystals.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/591e37f7_zambeel_ai_generated_image.jpg",
        "place": "a dark marble vanity with warm evening light and a soft reflection",
    },
    "health_beauty": {
        "title": "Essence Matte Liquid Lipstick",
        "description": "A slim tube of matte liquid lipstick with a rich velvety color.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b009f66a_zambeel_ai_generated_image.jpg",
        "place": "a bright beauty vanity with marble, a mirror edge, and morning light",
    },
    "home_kitchen": {
        "title": "Marble Designed Chef Knife",
        "description": "A chef knife with a marble-patterned handle and a sharp steel blade.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/15774af8_zambeel_ai_generated_image.jpg",
        "place": "a calm kitchen counter with wood, stone, and warm afternoon light",
    },
    "car_accessories": {
        "title": "Premium Car Drying Towel",
        "description": "A thick microfiber car drying towel, plush and lint-free.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1b4f3cf3_zambeel_ai_generated_image.jpg",
        "place": "a clean car exterior in daylight, towel in hand or draped on the panel",
    },
}

FIDELITY = (
    "Use the uploaded product photo as the EXACT product reference. "
    "Keep the same product, shape, materials, and colors. "
    "This must be a NEW photograph, not a crop of a product-page gallery shot. "
    "Photorealistic cinematic ecommerce quality. No text, no letters, no logos, no watermarks, no UI. "
    "Do not use a pure white seamless studio backdrop."
)


def specs_for(meta: dict) -> list[tuple[str, str, str, str]]:
    title = meta["title"]
    place = meta["place"]
    desc = meta["description"]
    return [
        (
            "banner_image",
            (
                f"Create a 16:9 cinematic homepage hero of this {title}. {desc} "
                f"Product large and centered, fully visible, bold campaign lighting, "
                f"balanced margin so nothing is cropped. Setting: {place}. {FIDELITY}"
            ),
            "16:9",
            "banner_image",
        ),
        (
            "banner_image_mobile",
            (
                f"Create a native 9:16 portrait cinematic mobile homepage hero of this {title}. {desc} "
                f"Do not crop a wide banner. Product large and vertically centered in the tall frame, "
                f"calm space above and below. Setting: {place}. {FIDELITY}"
            ),
            "9:16",
            "banner_image",
        ),
        (
            "product_story_image",
            (
                f"Create a 1:1 cinematic product-story still of this {title}. {desc} "
                f"Product dominant, dramatic but controlled light, uncluttered campaign scene. "
                f"Setting: {place}. {FIDELITY}"
            ),
            "1:1",
            "product_image",
        ),
        (
            "why_shop_image",
            (
                f"Create a 1:1 cinematic lifestyle photo of a person using this {title}. {desc} "
                f"Fill the square frame, product unmistakable, human natural, not a circular crop. "
                f"Setting: {place}. {FIDELITY}"
            ),
            "1:1",
            "product_image",
        ),
        (
            "circle_feature_image",
            (
                f"Create a 1:1 photo of this {title} composed for a circular crop. {desc} "
                f"Product fully inside a centered circle with padding so a round mask never cuts it off. "
                f"Soft premium background. Setting: {place}. {FIDELITY}"
            ),
            "1:1",
            "product_image",
        ),
    ]


IMAGE_KEYS = [row[0] for row in specs_for(next(iter(CATEGORY_REFERENCES.values())))]
MANIFEST_PATH = backend_dir / "scripts" / "eclipse_home_demo_images_manifest.json"


def generate_category(category: str, dry_run: bool = False, only_keys: list[str] | None = None) -> dict:
    meta = CATEGORY_REFERENCES[category]
    specs = [s for s in specs_for(meta) if not only_keys or s[0] in only_keys]
    print(f"\n{'=' * 72}\n{category}: {meta['title']}\n{'=' * 72}", flush=True)
    if dry_run:
        return {k: f"(dry-run) {meta['reference']}" for k, _, _, _ in specs}

    temp_dir = tempfile.mkdtemp(prefix=f"eclipse_home_{category}_")
    try:
        paths = convert_urls_to_paths([meta["reference"]], temp_dir)
        if not paths:
            raise RuntimeError(f"Failed to download reference for {category}")
        urls = generate_images_concurrent(
            paths,
            [s[1] for s in specs],
            temp_dir,
            image_types=[s[3] for s in specs],
            aspect_ratios=[s[2] for s in specs],
            max_workers=min(3, len(specs)),
        )
        out = {}
        for i, (key, _, _, _) in enumerate(specs):
            url = urls[i] if i < len(urls) else None
            out[key] = url
            print(f"  {'OK' if url else 'FAIL'} {key}: {url}", flush=True)
        return out
    finally:
        cleanup_temp_directory(temp_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=sorted(CATEGORY_REFERENCES.keys()))
    parser.add_argument("--keys", nargs="+", choices=IMAGE_KEYS)
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
        result = generate_category(cat, dry_run=args.dry_run, only_keys=args.keys)
        if args.dry_run:
            print(json.dumps({k: "prompt-ok" for k in result}, indent=2))
            continue
        prev = manifest.get(cat) or {}
        merged = {**prev}
        for key, url in result.items():
            if url:
                merged[key] = url
        manifest[cat] = merged
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Wrote {MANIFEST_PATH}", flush=True)

    print("\nDone.", flush=True)


if __name__ == "__main__":
    main()
