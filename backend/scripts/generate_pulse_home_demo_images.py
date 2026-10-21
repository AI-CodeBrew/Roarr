#!/usr/bin/env python3
"""
Homepage images for the prepaid Pulse demo.

Each category uses the SAME product already on the Vibe product page, but every
slot is a new shot sized for the classic homepage. Product-page files are not reused.

Ratios match store/templates/single_store/image_keys.json:
  banner_image 16:9, every other homepage slot 1:1.

Usage (from kluck-ai/backend):
    ./venv/bin/python -u scripts/generate_pulse_home_demo_images.py
    ./venv/bin/python -u scripts/generate_pulse_home_demo_images.py --category fashion
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

# Product-page hero is the identity reference only. Do not copy those files onto the homepage.
CATEGORY_REFERENCES = {
    "kids_toys": {
        "title": "Cuddle Dino Plush Friend",
        "description": "A soft friendly dinosaur plush toy in muted sage and cream, made for naps and play.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7e7b00c2_kids-toys-vibe-1.png",
        "place": "a sunny child's bedroom with a soft rug, wooden floor, and warm window light",
    },
    "general": {
        "title": "Pulse Portable Bluetooth Speaker",
        "description": "A compact charcoal portable Bluetooth speaker with a fabric grille and rounded body.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3849e8e6_general-vibe-1.png",
        "place": "a modern desk by a window, with a park picnic table as a second mood",
    },
    "fashion": {
        "title": "Bohemian Elegance Sapphire Gold Hoops",
        "description": "Gold hoop earrings with deep sapphire drops and a diamond-pavé finish.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/58a6fd99_fashion-vibe-product-1.png",
        "place": "a softly lit vanity with warm evening light, marble, and a mirror edge",
    },
    "health_beauty": {
        "title": "Velvet Berry Matte Lipstick",
        "description": "A deep berry matte lipstick bullet in a slim elegant tube.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0405de30_health-beauty-vibe-1.png",
        "place": "a bright beauty vanity with soft marble, a mirror, and morning light",
    },
    "home_kitchen": {
        "title": "Stoneware Pour-Over Mug Set",
        "description": "A warm-glaze stoneware pour-over dripper stacked with a matching mug.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/42147457_home-kitchen-vibe-1.png",
        "place": "a calm kitchen counter in morning light, with wood, linen, and a small plant",
    },
    "car_accessories": {
        "title": "Magnetic Car Phone Mount",
        "description": "A matte black magnetic phone mount that clips in a car for hands-free navigation.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b3662a04_car-accessories-vibe-1.png",
        "place": "a modern car dashboard and windshield in daylight, phone attached to the mount",
    },
}

FIDELITY = (
    "Use the uploaded product photo as the EXACT product reference. "
    "Keep the same product, shape, materials, and colors. "
    "This must be a NEW photograph, not a crop of a square product-page gallery shot. "
    "Photorealistic ecommerce quality. No text, no letters, no logos, no watermarks, no UI. "
    "Do not use a pure white seamless studio backdrop."
)


def specs_for(meta: dict) -> list[tuple[str, str, str, str]]:
    title = meta["title"]
    place = meta["place"]
    desc = meta["description"]
    rows: list[tuple[str, str, str, str]] = []

    rows.append(
        (
            "banner_image",
            (
                f"Create a 16:9 widescreen homepage hero photograph of this {title}. {desc} "
                f"Composition: landscape frame, product placed on the right third, left half is calm "
                f"negative space a headline can sit on, product fully visible and sharp, not cropped. "
                f"Setting: {place}. {FIDELITY}"
            ),
            "16:9",
            "banner_image",
        )
    )

    squares = [
        (
            "product_impact_image",
            "square homepage side-panel photo, product large beside empty space, lifestyle scene, not a catalog cutout",
        ),
        (
            "feature_image",
            "square homepage feature photo, product centered and fully visible, different angle than a front packshot",
        ),
        (
            "creative_image",
            "square homepage still life, product smaller in a styled scene with real surfaces and depth",
        ),
        (
            "highlight_image",
            "square homepage highlight photo, product large and bold, a real scene with room around the product",
        ),
        (
            "product_base_image",
            "square homepage showcase photo for a text section, product on a real surface with even space around it",
        ),
        (
            "product_image_1",
            "square homepage product card, three-quarter view in the real setting, more environment than a tight packshot",
        ),
        (
            "product_image_2",
            "square homepage product card, product in use, hands allowed only if they help the story",
        ),
        (
            "product_image_3",
            "square homepage product card, material close-up that still shows the whole product identity",
        ),
    ]
    for key, shot in squares:
        rows.append(
            (
                key,
                f"Create a 1:1 homepage photo of this {title}. {desc} Shot: {shot}. Setting: {place}. {FIDELITY}",
                "1:1",
                key if key in {"banner_image", "creative_image", "highlight_image"} else "product_image",
            )
        )
    return rows


IMAGE_KEYS = [row[0] for row in specs_for(next(iter(CATEGORY_REFERENCES.values())))]
MANIFEST_PATH = backend_dir / "scripts" / "pulse_home_demo_images_manifest.json"


def generate_category(category: str, dry_run: bool = False, only_keys: list[str] | None = None) -> dict:
    meta = CATEGORY_REFERENCES[category]
    specs = [s for s in specs_for(meta) if not only_keys or s[0] in only_keys]
    print(f"\n{'=' * 72}\n{category}: {meta['title']}\n{'=' * 72}", flush=True)
    if dry_run:
        return {k: f"(dry-run) {meta['reference']}" for k, _, _, _ in specs}

    temp_dir = tempfile.mkdtemp(prefix=f"pulse_home_{category}_")
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
