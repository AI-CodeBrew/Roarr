#!/usr/bin/env python3
"""
Generate Classic prepaid single-product demo images for every store category,
upload them to the public Zambeel S3 bucket, and write a JSON manifest.

These products/scenes are intentionally distinct from:
  - COD classic SINGLE_HOME demos
  - Velvet cinematic demos
  - Sleek / Vibe PDP demos

Usage (from backend/backend):
    ./venv/bin/python scripts/generate_classic_prepaid_demo_images.py
    ./venv/bin/python scripts/generate_classic_prepaid_demo_images.py --category fashion
    ./venv/bin/python scripts/generate_classic_prepaid_demo_images.py --dry-run

Requires: GEMINI_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
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
from app.modules.generate.home_prompt_builder import build_home_image_prompt

# Classic prepaid heroes — must not collide with Velvet / Sleek / Vibe / COD classic.
CATEGORY_REFERENCES = {
    "kids_toys": {
        "title": "Soft Felt Activity Cube",
        "subcategory": "toys_games",
        "description": "A soft felt activity cube with six sides of quiet play for little hands.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6a8a7377_classic_prepaid_kids_toys_ref.png",
    },
    "general": {
        "title": "Minimal Bamboo Wireless Charger Pad",
        "subcategory": "electronics_tech",
        "description": "A minimal bamboo wireless charger pad for a clean desk.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/06cbeee6_classic_prepaid_general_ref.png",
    },
    "fashion": {
        "title": "Natural Canvas Weekend Tote",
        "subcategory": "fashion_apparel",
        "description": "A natural canvas weekend tote with easy leather handles.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/269d16d1_classic_prepaid_fashion_ref.png",
    },
    "health_beauty": {
        "title": "Amber Glass Face Oil Dropper",
        "subcategory": "skincare",
        "description": "An amber glass face oil dropper for a simple nightly ritual.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f63a3b6d_classic_prepaid_health_beauty_ref.png",
    },
    "home_kitchen": {
        "title": "Matte Black Gooseneck Pour-Over Kettle",
        "subcategory": "kitchen",
        "description": "A matte black gooseneck pour-over kettle for a precise home pour.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e37f0c20_classic_prepaid_home_kitchen_ref.png",
    },
    "car_accessories": {
        "title": "Leather Seat Gap Organizer",
        "subcategory": "car_accessories",
        "description": "A leather seat-gap organizer that catches phones, keys, and coins.",
        "reference": "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/618f6e11_classic_prepaid_car_accessories_ref.png",
    },
}

FIDELITY = (
    "Use the uploaded product image as the EXACT visual reference for the product only. "
    "Preserve exact shape, proportions, materials, colors, and branding. "
    "Do NOT redesign, recolor, or invent accessories. Photorealistic commercial quality. "
    "No text, no words, no letters, no fake logos, no watermarks, no UI chrome. "
    "Do NOT place the product on a pure white seamless backdrop."
)

def _scene_prompt(meta: dict, shot: str) -> str:
    """Classic store scene — the original home prompt, not the cinematic hero prompt."""
    slot = [{"title": meta["title"], "description": meta.get("description") or meta["title"]}]
    sub = meta["subcategory"]
    if shot == "banner":
        prompt = build_home_image_prompt("banner_image", sub, slot)
        return (
            prompt
            + " The left side must be the same continuous photograph as the rest of the frame: "
            "a smooth natural darkening of the real surface, not a separate flat gray panel, "
            "not a hard vertical edge, not a graphic overlay, and not a solid color block. "
            "One seamless 16:9 photo. Keep the full product visible on the right."
        )
    if shot == "creative":
        return build_home_image_prompt("creative_image", sub, slot)
    if shot == "highlight":
        return build_home_image_prompt("highlight_image", sub, slot)
    return ""


def image_specs_for(meta: dict) -> list[tuple[str, str, str, str]]:
    """key, prompt, aspect ratio, gemini image type."""
    banner = _scene_prompt(meta, "banner")
    creative = _scene_prompt(meta, "creative")
    highlight = _scene_prompt(meta, "highlight")
    impact = f"""
Create a 1:1 classic ecommerce photo of this product in a real setting.
{FIDELITY}
Use a lived-in surface that fits the product (wood, stone, linen, a real counter).
Soft daylight, a few honest props, product large and sharp. Not a white catalog cutout.
Not a dark cinematic campaign.
""".strip()
    feature = f"""
Create a 1:1 classic ecommerce feature photo.
{FIDELITY}
Product in its real-use place, slightly off-center, natural light, textured background.
Not pure white. Not dark cinematic.
""".strip()
    angles = {
        "product_image_1": f"""
Create a 1:1 front view of the product in a real classic store scene, not on white.
{FIDELITY}
Full product visible, natural contact with a real surface, soft window light.
""".strip(),
        "product_image_2": f"""
Create a 1:1 three-quarter view of the product in a real setting, not on white.
{FIDELITY}
About 30–45 degrees, natural perspective, textured surface, daylight.
""".strip(),
        "product_image_3": f"""
Create a 1:1 close detail of the product's material in context, not on white.
{FIDELITY}
Texture and craftsmanship clear, product still recognizable, real surface nearby.
""".strip(),
    }
    return [
        ("banner_image", banner, "16:9", "banner_image"),
        ("product_image_1", angles["product_image_1"], "1:1", "product_image"),
        ("product_image_2", angles["product_image_2"], "1:1", "product_image"),
        ("product_image_3", angles["product_image_3"], "1:1", "product_image"),
        ("product_impact_image", impact, "1:1", "product_impact_image"),
        ("feature_image", feature, "1:1", "feature_image"),
        ("highlight_image", highlight, "3:4", "highlight_image"),
        ("creative_image", creative, "1:1", "creative_image"),
    ]


IMAGE_KEYS = [row[0] for row in image_specs_for(next(iter(CATEGORY_REFERENCES.values())))]

MANIFEST_PATH = backend_dir / "scripts" / "classic_prepaid_demo_images_manifest.json"


def upload_public(path: str, category: str, key: str) -> str | None:
    bucket = os.getenv("BUNNY_STORAGE_ZONE", "kluck-v2")
    ext = os.path.splitext(path)[1] or ".png"
    filename = f"classic_prepaid_demo_{category}_{key}_{uuid.uuid4().hex[:8]}{ext}"
    return StorageUtils.upload_public(path, filename)


def generate_category(
    category: str,
    dry_run: bool = False,
    only_keys: list[str] | None = None,
) -> dict:
    meta = CATEGORY_REFERENCES[category]
    specs = [s for s in image_specs_for(meta) if not only_keys or s[0] in only_keys]
    if not specs:
        raise RuntimeError(f"No IMAGE_SPECS match only_keys={only_keys}")

    print(f"\n{'=' * 72}\nCategory: {category}  ({meta['title']})\n{'=' * 72}")
    print(f"Generating keys: {[s[0] for s in specs]}")

    if dry_run:
        return {k: f"(dry-run) {meta['reference']}" for k, _, _, _ in specs}

    temp_dir = tempfile.mkdtemp(prefix=f"classic_prepaid_demo_{category}_")
    try:
        paths = convert_urls_to_paths([meta["reference"]], temp_dir)
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
                # Re-upload with classic_prepaid filename prefix for clarity.
                # generate_images_concurrent already uploads; keep returned URL.
                out[key] = url
                print(f"  ✓ {key}: {url}")
            else:
                print(f"  ✗ {key}: failed")
                out[key] = None

        # Demo convenience alias used by prepaid checkout circle.
        if out.get("feature_image") or out.get("product_image_1"):
            out["product_base_image"] = (
                out.get("feature_image") or out.get("product_image_1")
            )
        return out
    finally:
        cleanup_temp_directory(temp_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=sorted(CATEGORY_REFERENCES.keys()))
    parser.add_argument(
        "--keys",
        nargs="+",
        choices=IMAGE_KEYS,
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
        result = generate_category(cat, dry_run=args.dry_run, only_keys=args.keys)
        if args.dry_run:
            print(json.dumps(result, indent=2))
            continue
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
