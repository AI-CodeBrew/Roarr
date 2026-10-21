#!/usr/bin/env python3
"""
Product-page images for the prepaid Linen demo.

Each category uses the SAME product already on the classic homepage, but every
slot is a new shot sized for the Sleek product page (gallery, feature panel,
impact photo, customer photos). Homepage banners are not reused.

Usage (from kluck-ai/backend):
    ./venv/bin/python scripts/generate_linen_pdp_demo_images.py
    ./venv/bin/python scripts/generate_linen_pdp_demo_images.py --category fashion
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

# Homepage product photo is the identity reference only.
CATEGORY_REFERENCES = {
    "kids_toys": {
        "title": "Snuggly Bunny plush",
        "description": "A soft fluffy cream plush bunny toy for children.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ae324494_zambeel_ai_generated_image.jpg",
        "place": "a sunny child's bedroom with a soft rug and wooden toys",
    },
    "general": {
        "title": "smart fingerprint padlock",
        "description": "A compact black smart padlock with a fingerprint reader.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1a60ba8b_zambeel_ai_generated_image.png",
        "place": "a gym locker and outdoor gate setting with natural daylight",
    },
    "fashion": {
        "title": "classic plaid flannel shirt",
        "description": "A soft cotton plaid flannel shirt in classic earth tones.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/93d23377_zambeel_ai_generated_image.jpg",
        "place": "a lived-in bedroom with a wooden chair and warm window light",
    },
    "health_beauty": {
        "title": "glossy lip balm",
        "description": "A small buttery lip balm tube with a soft glossy finish.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fde2d960_zambeel_ai_generated_image.jpg",
        "place": "a bright vanity with marble, a mirror, and soft morning light",
    },
    "home_kitchen": {
        "title": "display bookshelf",
        "description": "A sturdy open display bookshelf for books and decor.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/93739898_zambeel_ai_generated_image.jpg",
        "place": "a real living room with books, a plant, and afternoon light",
    },
    "car_accessories": {
        "title": "emergency window breaker and seatbelt cutter",
        "description": "A compact car safety tool with a window breaker and seatbelt cutter.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5f3b8df1_zambeel_ai_generated_image.jpg",
        "place": "a modern car cabin and center console in daylight",
    },
}

FIDELITY = (
    "Use the uploaded product photo as the EXACT product reference. "
    "Keep the same product, shape, materials, and colors. "
    "Photorealistic ecommerce quality. No text, no letters, no logos, no watermarks, no UI. "
    "Do not use a pure white seamless studio backdrop."
)


def specs_for(meta: dict) -> list[tuple[str, str, str, str]]:
    title = meta["title"]
    place = meta["place"]
    desc = meta["description"]
    rows = []

    gallery = [
        ("product_image_1", "square front view, full product visible, sharp, natural contact with a real surface"),
        ("product_image_2", "square three-quarter view, about 40 degrees, product large in frame"),
        ("product_image_3", "square close detail of material and craftsmanship, product still recognizable"),
        ("product_image_4", "square in-use moment, product being used naturally, hands allowed if they help the story"),
        ("product_image_5", "square alternate angle from the other side, different crop than the front view"),
    ]
    for key, shot in gallery:
        rows.append(
            (
                key,
                f"Create a 1:1 product-page gallery photo of this {title}. {desc} Shot: {shot}. Setting: {place}. {FIDELITY}",
                "1:1",
                "product_image",
            )
        )

    rows.append(
        (
            "feature_image",
            f"Create a 3:4 lifestyle photo for a product-page feature panel. This {title} ({desc}) sits in {place}, filling the frame, product clearly the hero, room for the eye to rest on one side. {FIDELITY}",
            "3:4",
            "feature_image",
        )
    )
    rows.append(
        (
            "problem_solving_image",
            f"Create a 1:1 lifestyle photo for a product-page stats section. This {title} ({desc}) in {place}, product large and sharp, a real scene not a catalog cutout. {FIDELITY}",
            "1:1",
            "product_impact_image",
        )
    )
    customers = [
        ("happy_customer_image_1", "one adult customer holding or using the product, candid, natural smile, product unmistakable"),
        ("happy_customer_image_2", "a different person in a different room using the product, waist-up, product visible"),
        ("happy_customer_image_3", "a third scene, hands and product in the foreground, face optional, warm daylight"),
    ]
    for key, shot in customers:
        rows.append(
            (
                key,
                f"Create a 1:1 customer photo for a product page. Product: {title}. {desc}. {shot}. Setting: {place}. {FIDELITY}",
                "1:1",
                "happy_customer_images",
            )
        )
    return rows


IMAGE_KEYS = [row[0] for row in specs_for(next(iter(CATEGORY_REFERENCES.values())))]
MANIFEST_PATH = backend_dir / "scripts" / "linen_pdp_demo_images_manifest.json"


def generate_category(category: str, dry_run: bool = False, only_keys: list[str] | None = None) -> dict:
    meta = CATEGORY_REFERENCES[category]
    specs = [s for s in specs_for(meta) if not only_keys or s[0] in only_keys]
    print(f"\n{'=' * 72}\n{category}: {meta['title']}\n{'=' * 72}")
    if dry_run:
        return {k: f"(dry-run) {meta['reference']}" for k, _, _, _ in specs}

    temp_dir = tempfile.mkdtemp(prefix=f"linen_pdp_{category}_")
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
            print(f"  {'✓' if url else '✗'} {key}: {url}")
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
        print(f"Wrote {MANIFEST_PATH}")

    print("\nDone.")


if __name__ == "__main__":
    main()
