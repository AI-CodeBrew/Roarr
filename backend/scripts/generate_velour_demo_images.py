#!/usr/bin/env python3
"""
Demo art for the Velour store template card and preview, written to
frontend/public/velour-assets/. Text prompts only, so every picture is new.

Usage (from backend/):
    venv/Scripts/python -u scripts/generate_velour_demo_images.py [name ...]

Existing files are skipped; delete one or name it to redo it.
Rebuild the card screenshots afterwards: npx vite-node scripts/build-velour-previews.mjs
"""

from __future__ import annotations

import base64
import concurrent.futures
import io
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND.parent / "frontend" / "public" / "velour-assets"
load_dotenv(BACKEND / ".env")

MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")
QUALITY = "medium"

UMBER = "plain deep umber brown seamless studio backdrop, color #3a2c24"
CAMPAIGN = (
    "Photorealistic high fashion clothing campaign photograph of an adult woman, natural skin "
    "texture, soft directional studio light, realistic fabric drape, sharp focus on the clothes. "
    "No text, no logos, no watermark."
)
EDITORIAL = (
    "Photorealistic fashion editorial photograph of an adult model, warm natural light, realistic "
    "fabric texture, the clothes are the subject. No text, no logos, no watermark."
)
DETAIL = (
    "Photorealistic close-up clothing detail photograph, soft daylight, shallow depth of field, "
    "rich fabric texture, face out of frame. No text, no logos, no watermark."
)
PACKSHOT = (
    "Photorealistic ecommerce apparel packshot on an invisible mannequin, the garment centered "
    "with generous margin, on a plain flat very pale lavender grey background, color #f2f2f9, soft "
    "contact shadow, high detail. No text, no logos, no labels, no props, no people."
)

# name: (width, height, prompt)
IMAGES = {
    "hero-1": (1920, 1011, f"{CAMPAIGN} She wears a belted camel wool wrap coat over a cream knit, hand at her collar, cropped from the chin down. She stays entirely inside the right half of the frame. The left half is completely empty {UMBER}."),
    "hero-2": (1920, 1011, f"{CAMPAIGN} She wears a relaxed oatmeal linen shirt and pleated ivory trousers, one hand in a pocket, cropped from the chin down. She stays entirely inside the right half of the frame. The left half is completely empty {UMBER}."),
    "hero-3": (1920, 1011, f"{CAMPAIGN} She wears a chunky rust ribbed turtleneck sweater and dark tailored trousers, arms loosely crossed, cropped from the chin down. She stays entirely inside the right half of the frame. The left half is completely empty {UMBER}."),
    "tile-1": (706, 970, f"{EDITORIAL} A woman in a flowing sage green satin midi dress, cropped from the shoulders to the knees, pale plaster wall."),
    "tile-2": (706, 970, f"{DETAIL} A black wool overcoat with a wide lapel and horn buttons, hanging open over a white shirt, on a person, warm grey backdrop."),
    "tile-3": (706, 970, f"{DETAIL} A stack of folded chunky knit sweaters in cream, oatmeal and rust on a pale wooden bench."),
    "tile-4": (706, 970, f"{DETAIL} Mid-wash high rise straight leg jeans with a tucked white tee and a leather belt, hand in the pocket, soft neutral backdrop."),
    "show-1": (1400, 752, f"{DETAIL} The waist and skirt of a champagne satin slip dress catching soft side light, with gentle folds."),
    "show-2": (1400, 752, f"{DETAIL} The shoulder and lapel of a camel wool coat with visible twill weave and neat stitching."),
    "show-3": (1400, 752, f"{DETAIL} The cable and rib pattern of a heavy cream knit sweater worn on the arm, warm light."),
    "show-4": (1400, 752, f"{DETAIL} A sharp pleat running down charcoal wool tailored trousers with a slim belt."),
    "product-1": (690, 888, f"{PACKSHOT} A belted camel wool wrap coat, front view, belt tied at the waist."),
    "product-1b": (690, 888, f"{PACKSHOT} The same belted camel wool wrap coat, back view with a center vent."),
    "product-2": (690, 888, f"{PACKSHOT} A slim ribbed merino turtleneck sweater in soft cream, front view."),
    "product-2b": (690, 888, f"{PACKSHOT} The same ribbed cream merino turtleneck sweater, back view."),
    "product-3": (690, 888, f"{PACKSHOT} A sage green satin slip midi dress with thin straps, front view."),
    "product-3b": (690, 888, f"{PACKSHOT} The same sage green satin slip midi dress, back view with a low scoop."),
    "product-4": (690, 888, f"{PACKSHOT} Mid-wash blue high rise straight leg jeans, front view."),
    "product-4b": (690, 888, f"{PACKSHOT} The same mid-wash blue straight leg jeans, back view with plain pockets."),
    "product-5": (690, 888, f"{PACKSHOT} A relaxed long sleeve oatmeal linen button-up shirt, front view."),
    "product-5b": (690, 888, f"{PACKSHOT} The same oatmeal linen shirt, back view with a soft yoke."),
    "product-6": (690, 888, f"{PACKSHOT} Pleated wide leg charcoal wool trousers, front view."),
    "product-6b": (690, 888, f"{PACKSHOT} The same pleated wide leg charcoal trousers, back view."),
    "product-7": (690, 888, f"{PACKSHOT} A cropped cream and black boucle jacket with four covered buttons, front view."),
    "product-7b": (690, 888, f"{PACKSHOT} The same cropped cream and black boucle jacket, back view."),
    "product-8": (690, 888, f"{PACKSHOT} A tiered white cotton maxi dress with short sleeves, front view."),
    "product-8b": (690, 888, f"{PACKSHOT} The same tiered white cotton maxi dress, back view."),
    "statement": (2000, 636, "Photorealistic very wide low-key photograph of a slim black metal clothing rail holding four dark tailored coats, on the right side of the frame, in a dim charcoal room with soft side light. The left half of the frame is an empty dark wall. No people, no text, no logos, no watermark."),
    "lookbook": (1380, 1250, f"{EDITORIAL} A woman in a cream boucle cropped jacket and charcoal wide leg trousers, three-quarter length, cropped at the chin, warm taupe plaster wall."),
    "avatar-1": (360, 765, f"{EDITORIAL} Tall portrait of a smiling woman with short curly auburn hair in a camel crew neck sweater, pale grey backdrop."),
    "avatar-2": (360, 765, f"{EDITORIAL} Tall portrait of a laughing woman with long dark hair in a white linen shirt, soft rose backdrop."),
    "avatar-3": (360, 765, f"{EDITORIAL} Tall portrait of a smiling man with short dark hair in an olive overshirt, warm sand backdrop."),
    "story-1": (1472, 968, f"{EDITORIAL} A woman in a tiered white cotton maxi dress walking through a sunlit plaster hallway, full length, seen from a distance."),
    "story-2": (1472, 968, f"{EDITORIAL} A man and a woman in relaxed linen separates seated on a stone bench, warm evening light."),
    "story-3": (1472, 968, f"{EDITORIAL} A woman in a black wool overcoat and straight jeans crossing a quiet city street in soft morning light."),
    "blog-1": (900, 618, f"{DETAIL} Hands buttoning a crisp white linen shirt at a window, soft daylight."),
    "blog-2": (900, 618, f"{DETAIL} Neatly hung capsule wardrobe in neutral tones on a wooden rail, with a folded knit on a shelf. No people."),
    "blog-3": (900, 618, f"{DETAIL} A folded wool coat being brushed with a natural bristle clothes brush on a wooden table. No faces."),
    "popup": (820, 1032, f"{EDITORIAL} A woman in a rust ribbed knit sweater and a long wool skirt, cropped at the chin, warm umber backdrop."),
    "banner": (2000, 536, "Photorealistic very wide close-up of softly rippling pale ivory silk fabric with gentle highlights. No text, no logos, no watermark, no people."),
}


def size_for(width: int, height: int) -> str:
    ratio = width / height
    if ratio > 1.15:
        return "1536x1024"
    if ratio < 0.87:
        return "1024x1536"
    return "1024x1024"


def make(client: OpenAI, name: str) -> str:
    width, height, prompt = IMAGES[name]
    result = client.images.generate(
        model=MODEL,
        prompt=prompt,
        size=size_for(width, height),
        quality=QUALITY,
        n=1,
    )
    image = Image.open(io.BytesIO(base64.b64decode(result.data[0].b64_json))).convert("RGB")
    # Cover-crop to the slot's exact shape, keeping the centre.
    scale = max(width / image.width, height / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    left = (image.width - width) // 2
    top = (image.height - height) // 2
    image = image.crop((left, top, left + width, top + height))
    image.save(OUT_DIR / f"{name}.jpg", quality=84, optimize=True, progressive=True)
    return name


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    asked = sys.argv[1:]
    unknown = [n for n in asked if n not in IMAGES]
    if unknown:
        print(f"Unknown image names: {unknown}")
        return 2
    names = asked or [n for n in IMAGES if not (OUT_DIR / f"{n}.jpg").exists()]
    print(f"Generating {len(names)} images with {MODEL} ({QUALITY})")
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(make, client, n): n for n in names}
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                future.result()
                print(f"ok   {name}")
            except Exception as err:
                failed.append(name)
                print(f"FAIL {name}: {err}")
    print(f"Done. {len(names) - len(failed)} ok, {len(failed)} failed: {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
