#!/usr/bin/env python3
"""
Homepage images for The Collective (Sleek) and Meridian (Vibe).

Product 1 is the product already on that theme's product page. Two more
products in the same category fill the rest of the homepage. Homepage files
are new photographs — product-page gallery files are references only.

Usage (from backend/backend):
    ./venv/bin/python -u scripts/generate_premium_multi_home_demo_images.py
    ./venv/bin/python -u scripts/generate_premium_multi_home_demo_images.py --theme collective
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

# (title, short line, visual description, setting, product-page reference or None)
THEMES = {
    "collective": {
        "fashion": [
            ("Royal Blue Crystal Silver Plated Bracelet", "Brilliant royal blue stones on silver plating.", "a silver bracelet set with royal blue crystals", "a jewelry tray in soft daylight", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/591e37f7_zambeel_ai_generated_image.jpg"),
            ("Pearl Drop Earrings", "A pair of pearl drops on silver hooks.", "a pair of white pearl drop earrings on silver hooks", "a linen jewelry cloth", None),
            ("Gold Chain Necklace", "A fine gold chain for everyday wear.", "a fine gold chain necklace laid in a gentle curve", "a marble dressing table", None),
        ],
        "kids_toys": [
            ("Wooden Abacus & Ramp Set", "Colorful math and vehicle play in child-safe wood.", "a wooden abacus beside a small wooden car ramp", "a sunny playroom floor", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cad40108_zambeel_ai_generated_image.jpg"),
            ("Wooden Shape Sorter", "Colorful wooden shapes for a first puzzle.", "a wooden shape-sorter box with bright geometric pieces", "a low play table", None),
            ("Pull-Along Wooden Dog", "A small wooden dog on wheels.", "a small natural-wood pull-along dog toy with wheels", "a playroom rug", None),
        ],
        "general": [
            ("Stanley Quencher H2.0", "Double-wall insulation that keeps a drink cold.", "a large stainless tumbler with a handle and straw lid", "a kitchen counter in daylight", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d1419d62_zambeel_ai_generated_image.jpg"),
            ("Insulated Travel Mug", "A lidded mug that keeps coffee hot.", "a stainless travel mug with a sip lid", "a desk beside a notebook", None),
            ("Stainless Water Bottle", "A slim bottle for the day.", "a slim stainless steel water bottle", "a gym bag on a bench", None),
        ],
        "health_beauty": [
            ("Essence Matte Liquid Lipstick", "A long-wearing matte lipstick with rich color.", "a liquid lipstick tube with a matte berry applicator", "a vanity in warm light", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b009f66a_zambeel_ai_generated_image.jpg"),
            ("Soft Matte Blush Stick", "A cream blush in a slim stick.", "a slim cream blush stick in a soft rose shade", "a makeup tray", None),
            ("Clear Brow Gel", "A clear gel that holds brows in place.", "a small clear brow gel tube with a spoolie", "a bathroom shelf", None),
        ],
        "home_kitchen": [
            ("Marble Designed Chef Knife", "A chef knife with a marble-patterned handle.", "a chef knife with a marble-patterned handle and a steel blade", "a wooden cutting board", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/15774af8_zambeel_ai_generated_image.jpg"),
            ("Walnut Serving Board", "A long board for bread and cheese.", "a long walnut serving board", "a kitchen table with linen", None),
            ("Olivewood Spoon Set", "Three spoons for stirring and serving.", "three olivewood cooking spoons", "a ceramic crock on a counter", None),
        ],
        "car_accessories": [
            ("Premium Car Drying Towel", "An absorbent microfiber towel for a spotless dry.", "a folded premium microfiber car drying towel in gray", "a clean car hood in daylight", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1b4f3cf3_zambeel_ai_generated_image.jpg"),
            ("Microfiber Wash Mitt", "A soft mitt for a gentle wash.", "a plush microfiber car wash mitt", "a bucket beside a car", None),
            ("Interior Detail Brush", "A small brush for vents and seams.", "a small soft detailing brush for a car interior", "a car dashboard", None),
        ],
    },
    "meridian": {
        "fashion": [
            ("Bohemian Elegance Sapphire Gold Hoops", "Sapphire drops on gold hoops.", "gold hoop earrings with deep sapphire drops", "a jewelry dish in evening light", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/58a6fd99_fashion-vibe-product-1.png"),
            ("Gold Cuff Bracelet", "An open gold cuff with a smooth finish.", "an open polished gold cuff bracelet", "a wrist on a linen sleeve, product clearly visible", None),
            ("Layered Coin Necklace", "A short gold necklace with small coins.", "a short gold necklace with small flat coin charms", "a neckline of a simple top, jewelry is the focus", None),
        ],
        "kids_toys": [
            ("Cuddle Dino Plush Friend", "A soft dinosaur buddy for naps and play.", "a soft plush dinosaur toy in gentle colors", "a child's bed with a knit blanket", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7e7b00c2_kids-toys-vibe-1.png"),
            ("Cloud Bunny Plush", "A soft bunny for bedtime.", "a fluffy white bunny plush with long ears", "a nursery chair", None),
            ("Knit Bear Rattle", "A small knitted bear with a gentle rattle.", "a small hand-knit bear baby rattle", "a wooden crib rail", None),
        ],
        "general": [
            ("Pulse Portable Bluetooth Speaker", "Compact sound that travels from desk to park.", "a compact charcoal portable bluetooth speaker", "a picnic blanket outdoors", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3849e8e6_general-vibe-1.png"),
            ("Compact Wireless Earbuds", "Small earbuds with a pocket case.", "a pair of compact wireless earbuds beside an open charging case", "a desk in daylight", None),
            ("Desk Cable Organizer", "A short tray that hides charging cables.", "a small desktop cable organizer tray in matte black", "a tidy desk with a laptop edge", None),
        ],
        "health_beauty": [
            ("Velvet Berry Matte Lipstick", "A deep berry matte lipstick.", "a matte lipstick bullet in a deep berry shade", "a vanity mirror in soft light", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0405de30_health-beauty-vibe-1.png"),
            ("Rosewater Face Mist", "A light mist for a fresh face.", "a frosted glass bottle of rosewater face mist with a spray top", "a bathroom ledge", None),
            ("Silk Sleep Mask", "A soft mask for darker mornings.", "a silk sleep mask in warm champagne", "a bedside table", None),
        ],
        "home_kitchen": [
            ("Stoneware Pour-Over Mug Set", "A ceramic mug set for brewing and sipping.", "a stoneware pour-over dripper stacked with a matching mug", "a morning kitchen counter", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/42147457_home-kitchen-vibe-1.png"),
            ("Speckled Cereal Bowls", "A pair of stoneware bowls.", "two speckled stoneware cereal bowls", "a breakfast table", None),
            ("Linen Tea Towels", "Two linen towels for the kitchen.", "two folded natural linen tea towels", "a kitchen hook", None),
        ],
        "car_accessories": [
            ("Magnetic Car Phone Mount", "A matte black mount that holds a phone steady.", "a matte black magnetic car phone mount", "a car dashboard in daylight", "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b3662a04_car-accessories-vibe-1.png"),
            ("Seat Gap Organizer", "A slim pocket for the seat gap.", "a slim black seat-gap organizer for a car", "a front car seat", None),
            ("Sun Visor Tissue Holder", "A small holder that clips to the visor.", "a compact tissue holder clipped conceptually as a product photo, visor clip visible", "a car interior", None),
        ],
    },
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


def generate_category(theme: str, category: str) -> dict:
    products = THEMES[theme][category]
    print(f"\n{'=' * 72}\n{theme} / {category}\n{'=' * 72}", flush=True)
    temp_dir = tempfile.mkdtemp(prefix=f"premium_{theme}_{category}_")
    home = {}
    grid = {}
    try:
        for index, (title, _line, desc, place, reference) in enumerate(products, start=1):
            if reference:
                refs = convert_urls_to_paths([reference], temp_dir)
                if not refs:
                    print(f"  FAIL product {index}: could not download reference", flush=True)
                    continue
                identity_prompt = (
                    f"Create a 1:1 homepage product photo of this {title}. {desc}. "
                    f"Full product visible. Setting: {place}. {LOCK} {FIDELITY}"
                )
            else:
                refs = []
                identity_prompt = (
                    f"Create a 1:1 product photo of {title}. {desc}. "
                    f"Full product visible, sharp, on a real surface. Setting: {place}. {FIDELITY}"
                )
            identity = one(refs, identity_prompt, "1:1", "product_image", temp_dir)
            print(f"  {'OK' if identity else 'FAIL'} product_image_{index}: {identity}", flush=True)
            if not identity:
                continue
            home[f"product_image_{index}"] = identity
            follow_refs = convert_urls_to_paths([identity], temp_dir) or refs
            if not follow_refs:
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
                (
                    f"grid_image_{index}",
                    f"Create a 1:1 product-grid card photo of this {title}. {desc}. Straight-on catalog crop, product fills the square, different photo from the other homepage shots. Setting: {place}. {LOCK} {FIDELITY}",
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
                            f"Create a 1:1 homepage star photo of this {title}. {desc}. Different angle, product centered. Setting: {place}. {LOCK} {FIDELITY}",
                            "1:1",
                            "product_image",
                        ),
                    ]
                )
            batch = many(follow_refs, specs, temp_dir)
            for key, url in batch.items():
                if key.startswith("grid_"):
                    grid[key] = url
                else:
                    home[key] = url
        return {
            "home": home,
            "grid": grid,
            "products": [p[0] for p in products],
        }
    finally:
        cleanup_temp_directory(temp_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--theme", choices=sorted(THEMES.keys()))
    parser.add_argument("--category")
    args = parser.parse_args()

    required = ["GEMINI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        print("Missing env:", ", ".join(missing))
        sys.exit(1)

    manifest_path = backend_dir / "scripts" / "premium_multi_home_demo_images_manifest.json"
    manifest = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
        except Exception:
            manifest = {}

    themes = [args.theme] if args.theme else list(THEMES.keys())
    for theme in themes:
        categories = list(THEMES[theme].keys())
        if args.category:
            key = args.category.strip().lower().replace("-", "_").replace(" ", "_")
            if key not in THEMES[theme]:
                print(f"Unknown category {args.category} for {theme}")
                sys.exit(1)
            categories = [key]
        theme_manifest = manifest.get(theme) if isinstance(manifest.get(theme), dict) else {}
        for cat in categories:
            theme_manifest[cat] = generate_category(theme, cat)
            manifest[theme] = theme_manifest
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
            print(f"Wrote {manifest_path}", flush=True)
    print("\nDone.", flush=True)


if __name__ == "__main__":
    main()
