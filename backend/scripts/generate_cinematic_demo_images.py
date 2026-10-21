#!/usr/bin/env python3
"""
Generate cinematic COD single-product demo images for every store category,
upload them to the public Zambeel S3 bucket, and write a JSON manifest.

Usage (from kluck-ai/backend):
    python scripts/generate_cinematic_demo_images.py
    python scripts/generate_cinematic_demo_images.py --category fashion
    python scripts/generate_cinematic_demo_images.py --dry-run

Requires: GEMINI_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
Requires: BUNNY_STORAGE_ZONE, BUNNY_ACCESS_KEY, BUNNY_CDN_HOSTNAME
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import uuid
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

try:
    from dotenv import load_dotenv

    load_dotenv(backend_dir / ".env")
except ImportError:
    pass

from app.modules.storage.utils import StorageUtils
from app.modules.generate.generate_images import (
    cleanup_temp_directory,
    convert_urls_to_paths,
    generate_images_concurrent,
)
from app.modules.generate.store.templates.packs.cinematic.hero_prompt import (
    CINEMATIC_HERO_BANNER_PROMPT,
    CINEMATIC_HERO_MOBILE_PROMPT,
    CINEMATIC_PRODUCT_STORY_PROMPT,
    CINEMATIC_WHY_SHOP_PROMPT,
    CIRCLE_FEATURE_PROMPT_SUFFIX,
)

# Velvet cinematic homepage heroes (distinct from Vibe/Sleek PDP demos).
CATEGORY_REFERENCES = {
    "kids_toys": {
        "title": "Wooden Rainbow Stacking Arch",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9bf447db_velvet_kids_toys_ref.png",
    },
    "general": {
        "title": "Matte Ceramic Desk Lamp",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/24ce94f5_velvet_general_ref.png",
    },
    "fashion": {
        "title": "Structured Leather Crossbody Bag",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c86d6d09_velvet_fashion_ref.png",
    },
    "health_beauty": {
        "title": "Ceramic Facial Roller + Serum Duo",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8babcd92_velvet_health_beauty_ref.png",
    },
    "home_kitchen": {
        "title": "Cast-Iron Enamel Dutch Oven",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c77efcdc_velvet_home_kitchen_ref.png",
    },
    "car_accessories": {
        "title": "LED Dashboard Ambient Light Strip",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b88b89f5_velvet_car_accessories_ref.png",
    },
}

CIRCLE_PROMPT = (
    "Create a SUPER-PREMIUM cinematic product feature shot using the uploaded product "
    "image as the EXACT visual reference. Photorealistic commercial quality. "
    "Preserve the product exactly. Clean premium background. No text, no logos, no slogans."
    + CIRCLE_FEATURE_PROMPT_SUFFIX
)

# key → (prompt, aspect_ratio, image_type for Gemini routing)
IMAGE_SPECS = [
    ("banner_image", CINEMATIC_HERO_BANNER_PROMPT, "16:9", "banner_image"),
    ("banner_image_mobile", CINEMATIC_HERO_MOBILE_PROMPT, "9:16", "banner_image_mobile"),
    ("product_story_image", CINEMATIC_PRODUCT_STORY_PROMPT, "1:1", "product_story_image"),
    ("why_shop_image", CINEMATIC_WHY_SHOP_PROMPT, "1:1", "why_shop_image"),
    ("circle_feature_image", CIRCLE_PROMPT, "1:1", "circle_feature_image"),
]

MANIFEST_PATH = backend_dir / "scripts" / "cinematic_demo_images_manifest.json"


def upload_public(path: str, category: str, key: str) -> str | None:
    bucket = os.getenv("BUNNY_STORAGE_ZONE", "kluck-v2")
    ext = os.path.splitext(path)[1] or ".png"
    filename = f"cinematic_demo_{category}_{key}_{uuid.uuid4().hex[:8]}{ext}"
    return StorageUtils.upload_public(path, filename)


def generate_category(
    category: str,
    dry_run: bool = False,
    only_keys: list[str] | None = None,
    existing: dict | None = None,
) -> dict:
    meta = CATEGORY_REFERENCES[category]
    specs = [
        s
        for s in IMAGE_SPECS
        if not only_keys or s[0] in only_keys
    ]
    if not specs:
        raise RuntimeError(f"No IMAGE_SPECS match only_keys={only_keys}")

    print(f"\n{'=' * 72}\nCategory: {category}  ({meta['title']})\n{'=' * 72}")
    print(f"Generating keys: {[s[0] for s in specs]}")

    if dry_run:
        return {k: f"(dry-run) {meta['reference']}" for k, _, _, _ in specs}

    temp_dir = tempfile.mkdtemp(prefix=f"cinematic_demo_{category}_")
    try:
        # Product reference first; for mobile, also pass desktop banner so colors match.
        ref_urls = [meta["reference"]]
        desktop = (existing or {}).get("banner_image")
        if any(s[0] == "banner_image_mobile" for s in specs) and desktop:
            ref_urls.append(desktop)
            print(f"  + desktop banner ref for mobile color match: {desktop}")

        paths = convert_urls_to_paths(ref_urls, temp_dir)
        if not paths:
            raise RuntimeError(f"Failed to download reference for {category}")

        keys = [s[0] for s in specs]
        prompts = [s[1] for s in specs]
        ratios = [s[2] for s in specs]
        types = [s[3] for s in specs]

        urls = generate_images_concurrent(
            paths,
            prompts,
            temp_dir,
            image_types=types,
            aspect_ratios=ratios,
            max_workers=min(3, len(specs)),
        )

        out = {}
        for i, key in enumerate(keys):
            url = urls[i] if i < len(urls) else None
            if url:
                out[key] = url
                print(f"  ✓ {key}: {url}")
            else:
                print(f"  ✗ {key}: failed")
                out[key] = None
        return out
    finally:
        cleanup_temp_directory(temp_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=sorted(CATEGORY_REFERENCES.keys()))
    parser.add_argument(
        "--keys",
        nargs="+",
        choices=[s[0] for s in IMAGE_SPECS],
        help="Only regenerate these image keys (default: all)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    required = ["GEMINI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    missing = [v for v in required if not os.getenv(v)]
    if missing and not args.dry_run:
        print("Missing env:", ", ".join(missing))
        sys.exit(1)

    categories = [args.category] if args.category else list(CATEGORY_REFERENCES.keys())
    manifest = {}
    if MANIFEST_PATH.exists():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text())
        except Exception:
            manifest = {}

    for cat in categories:
        result = generate_category(
            cat,
            dry_run=args.dry_run,
            only_keys=args.keys,
            existing=manifest.get(cat) or {},
        )
        # Keep previous keys if a generation failed this run
        prev = manifest.get(cat) or {}
        merged = {**prev}
        for k, v in result.items():
            if v:
                merged[k] = v
        manifest[cat] = merged
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Wrote manifest → {MANIFEST_PATH}")

    print("\nDone. Manifest:")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
