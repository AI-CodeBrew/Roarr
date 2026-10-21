#!/usr/bin/env python3
"""
Homepage + product-page images for the prepaid Luminous multi-store demo.

Each category gets three NEW products (not the old Luminous catalog). Every
homepage slot is sized for that section. The product page uses product 1,
with its own gallery — homepage files are not reused there.

Usage (from kluck-ai/backend):
    ./venv/bin/python -u scripts/generate_luminous_demo_images.py
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

# Three products per category. Product 1 is also the product-page product.
CATEGORIES = {
    "fashion": [
        ("Olive Linen Overshirt", "a relaxed olive linen overshirt with a soft collar", "a bright bedroom with a wooden chair"),
        ("Black Leather Belt", "a slim black leather belt with a simple metal buckle", "a dressing table in warm daylight"),
        ("Cream Wool Scarf", "a thick cream wool scarf with a soft weave", "a coat hook by a window"),
    ],
    "kids_toys": [
        ("Wooden Animal Puzzle", "a chunky wooden animal puzzle with pastel pieces", "a sunny playroom rug"),
        ("Soft Stacking Rings", "a set of soft pastel stacking rings on a wooden post", "a child's low table"),
        ("Mini Hand Drum", "a small wooden hand drum with a natural skin head", "a play corner with warm wood"),
    ],
    "general": [
        ("Bamboo Desk Clock", "a round bamboo desk clock with a quiet face", "a tidy desk by a window"),
        ("Brass Bookends", "a pair of solid brass bookends holding a few plain books", "a bookshelf in afternoon light"),
        ("Linen Notebook Set", "a stack of linen-covered notebooks with a pencil", "a calm desk with paper and wood"),
    ],
    "health_beauty": [
        ("Amber Dropper Serum", "a small amber glass dropper bottle of face serum", "a marble vanity in morning light"),
        ("Jade Gua Sha", "a smooth jade gua sha stone", "a spa tray with linen"),
        ("Cotton Spa Headband", "a soft cotton spa headband in warm white", "a bathroom shelf with soft light"),
    ],
    "home_kitchen": [
        ("Walnut Cutting Board", "a thick walnut cutting board with a juice groove", "a kitchen counter in daylight"),
        ("Glass Pantry Jars", "three clear glass pantry jars with wooden lids", "an open kitchen shelf"),
        ("Stone Mortar and Pestle", "a heavy stone mortar and pestle", "a kitchen counter with herbs"),
    ],
    "car_accessories": [
        ("Leather Steering Cover", "a stitched leather steering wheel cover in black", "a car cabin in daylight"),
        ("Trunk Cargo Net", "a black elastic trunk cargo net", "an open car trunk"),
        ("Console Organizer", "a compact black console organizer tray", "a car center console"),
    ],
}

FIDELITY = (
    "Photorealistic ecommerce quality. No text, no letters, no logos, no watermarks, no UI. "
    "Do not use a pure white seamless studio backdrop."
)
LOCK = (
    "Use the uploaded product photo as the EXACT product. "
    "Keep the same product, shape, materials, and colors. This must be a NEW photograph."
)


def one(paths, prompt, ratio, image_type, temp_dir):
    urls = generate_images_concurrent(
        paths,
        [prompt],
        temp_dir,
        image_types=[image_type],
        aspect_ratios=[ratio],
        max_workers=1,
    )
    return urls[0] if urls else None


def many(paths, specs, temp_dir):
    if not specs:
        return {}
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


def generate_category(category: str) -> dict:
    products = CATEGORIES[category]
    print(f"\n{'=' * 72}\n{category}\n{'=' * 72}", flush=True)
    temp_dir = tempfile.mkdtemp(prefix=f"luminous_{category}_")
    home = {}
    pdp = {}
    try:
        for index, (title, desc, place) in enumerate(products, start=1):
            identity_prompt = (
                f"Create a 1:1 product photo of {title}. {desc}. "
                f"Full product visible, sharp, on a real surface. Setting: {place}. {FIDELITY}"
            )
            identity = one([], identity_prompt, "1:1", "product_image", temp_dir)
            print(f"  {'OK' if identity else 'FAIL'} product_image_{index}: {identity}", flush=True)
            if not identity:
                continue
            home[f"product_image_{index}"] = identity
            refs = convert_urls_to_paths([identity], temp_dir)
            if not refs:
                continue
            specs = [
                (
                    f"banner_image_{index}",
                    f"Create a 16:9 homepage hero of this {title}. {desc}. Product large, fully visible, calm space for a headline. Setting: {place}. {LOCK} {FIDELITY}",
                    "16:9",
                    "banner_image",
                ),
                (
                    f"feature_image_{index}",
                    f"Create a 4:5 tall homepage feature card of this {title}. {desc}. Product fills the portrait frame. Setting: {place}. {LOCK} {FIDELITY}",
                    "4:5",
                    "feature_image",
                ),
                (
                    f"product_impact_image_{index}",
                    f"Create a 1:1 collections-card photo of this {title}. {desc}. Lifestyle scene, product unmistakable, square frame. Setting: {place}. {LOCK} {FIDELITY}",
                    "1:1",
                    "product_image",
                ),
            ]
            if index == 1:
                specs.extend(
                    [
                        (
                            "highlight_image",
                            f"Create a 1:1 homepage highlight photo of this {title}. {desc}. Product large in a real scene. Setting: {place}. {LOCK} {FIDELITY}",
                            "1:1",
                            "highlight_image",
                        ),
                        (
                            "star_image",
                            f"Create a 1:1 homepage star photo of this {title}. {desc}. Different angle from the square product card, product centered. Setting: {place}. {LOCK} {FIDELITY}",
                            "1:1",
                            "product_image",
                        ),
                    ]
                )
                gallery = [
                    ("pdp_product_image_1", "square front view for a product page gallery, different crop than the homepage card"),
                    ("pdp_product_image_2", "square three-quarter view"),
                    ("pdp_product_image_3", "square material close-up, product still recognizable"),
                    ("pdp_product_image_4", "square in-use moment"),
                    ("pdp_product_image_5", "square alternate side angle"),
                ]
                for key, shot in gallery:
                    specs.append(
                        (
                            key,
                            f"Create a 1:1 product-page gallery photo of this {title}. {desc}. Shot: {shot}. Setting: {place}. {LOCK} {FIDELITY}",
                            "1:1",
                            "product_image",
                        )
                    )
                specs.append(
                    (
                        "pdp_feature_image",
                        f"Create a 3:4 product-page feature photo of this {title}. {desc}. Tall frame, product is the hero. Setting: {place}. {LOCK} {FIDELITY}",
                        "3:4",
                        "feature_image",
                    )
                )
            batch = many(refs, specs, temp_dir)
            for key, url in batch.items():
                if key.startswith("pdp_"):
                    pdp[key.replace("pdp_", "")] = url
                else:
                    home[key] = url
        return {"home": home, "pdp": pdp, "products": [p[0] for p in products]}
    finally:
        cleanup_temp_directory(temp_dir)


def generate_grid_shots(category: str, existing: dict) -> dict:
    """1:1 product-grid cards. New photos of the same three products."""
    products = CATEGORIES[category]
    home = (existing or {}).get("home") or {}
    print(f"\n{'=' * 72}\n{category} grid\n{'=' * 72}", flush=True)
    temp_dir = tempfile.mkdtemp(prefix=f"luminous_grid_{category}_")
    grid = {}
    try:
        for index, (title, desc, place) in enumerate(products, start=1):
            identity = home.get(f"product_image_{index}")
            if not identity:
                print(f"  FAIL grid_image_{index}: missing product reference", flush=True)
                continue
            refs = convert_urls_to_paths([identity], temp_dir)
            if not refs:
                print(f"  FAIL grid_image_{index}: could not download reference", flush=True)
                continue
            url = one(
                refs,
                (
                    f"Create a 1:1 product-grid card photo of this {title}. {desc}. "
                    "Straight-on catalog crop, product fills the square, different photo from the homepage card. "
                    f"Setting: {place}. {LOCK} {FIDELITY}"
                ),
                "1:1",
                "product_image",
                temp_dir,
            )
            grid[f"grid_image_{index}"] = url
            print(f"  {'OK' if url else 'FAIL'} grid_image_{index}: {url}", flush=True)
        return grid
    finally:
        cleanup_temp_directory(temp_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=sorted(CATEGORIES.keys()))
    parser.add_argument(
        "--grids-only",
        action="store_true",
        help="Add product-grid card images without regenerating the rest",
    )
    args = parser.parse_args()

    required = ["GEMINI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        print("Missing env:", ", ".join(missing))
        sys.exit(1)

    manifest_path = backend_dir / "scripts" / "luminous_demo_images_manifest.json"
    manifest = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
        except Exception:
            manifest = {}

    categories = [args.category] if args.category else list(CATEGORIES.keys())
    for cat in categories:
        if args.grids_only:
            entry = manifest.get(cat) if isinstance(manifest.get(cat), dict) else {}
            entry["grid"] = generate_grid_shots(cat, entry)
            manifest[cat] = entry
        else:
            manifest[cat] = generate_category(cat)
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Wrote {manifest_path}", flush=True)
    print("\nDone.", flush=True)


if __name__ == "__main__":
    main()
