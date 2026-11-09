#!/usr/bin/env python3
"""
Demo art for the Simmer store template card and preview, written to
frontend/public/simmer-assets/. Text prompts only, so every picture is new.

Usage (from backend/):
    venv/Scripts/python -u scripts/generate_simmer_demo_images.py [name ...]

Existing files are skipped; delete one or name it to redo it. The brand wordmarks are plain SVG
text and are written every run. Rebuild the card screenshots afterwards:
    npx vite-node scripts/build-simmer-previews.mjs
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
OUT_DIR = BACKEND.parent / "frontend" / "public" / "simmer-assets"
load_dotenv(BACKEND / ".env")

TILE = (243, 242, 248)
MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")
QUALITY = "medium"

BLENDER = "a sleek matte black countertop blender with a clear glass jar, a brushed steel base collar and a single round control dial"
FRYER = "a rounded matte black digital air fryer with a pull-out basket, a soft-touch handle and a small round display on the front"
ESPRESSO = "a compact brushed stainless steel espresso machine with a single group head, a portafilter, a steam wand and a small round pressure gauge"

CAMPAIGN = (
    "Photorealistic high-end kitchen appliance campaign photograph, warm soft window light, warm stone "
    "and cream kitchen, rich natural textures, shallow depth of field, sharp focus on the appliance. "
    "Any person is shown only as hands and forearms, never a face. No text, no logos, no brand names, no watermark."
)
EDITORIAL = (
    "Photorealistic editorial home kitchen photograph, calm warm natural light, modern warm stone and "
    "oak kitchen, the appliance is the subject. No text, no logos, no brand names, no watermark."
)
SOCIAL = (
    "Photorealistic social media style kitchen photograph, natural daylight, real home kitchen, warm and "
    "inviting, slightly candid framing. No faces. No text, no logos, no brand names, no watermark."
)
PORTRAIT = (
    "Photorealistic head and shoulders portrait of a smiling adult, soft natural light, plain softly "
    "colored backdrop, friendly and relaxed. No text, no logos, no watermark."
)
PACKSHOT = (
    "Photorealistic ecommerce product packshot, the appliance centered and fully in frame with generous "
    "margin on every side, on a plain flat very pale lavender grey background, color #f3f2f8, soft contact "
    "shadow, high detail. No text, no logos, no brand names, no labels, no extra props, no people."
)
DARK_LEFT = "The left half of the frame is a calm, softly shaded empty wall and counter with no objects, for overlaid white text."

# name: (width, height, prompt)
IMAGES = {
    "hero-1": (1920, 1155, f"{CAMPAIGN} Hands pouring a thick green smoothie from {BLENDER} into a tall glass, with fresh spinach, banana and berries on a warm stone counter, in rich mid-dark warm tones. Everything stays inside the right half of the frame. {DARK_LEFT}"),
    "hero-2": (1920, 1155, f"{CAMPAIGN} A hand pulling the basket out of {FRYER}, showing golden crispy fries inside, on a warm stone counter, in rich mid-dark warm tones. Everything stays inside the right half of the frame. {DARK_LEFT}"),
    "hero-3": (1920, 1155, f"{CAMPAIGN} Hands holding a small cup under {ESPRESSO} as a rich espresso pours with golden crema, on a warm stone counter, in rich mid-dark warm tones. Everything stays inside the right half of the frame. {DARK_LEFT}"),
    "hero-side": (654, 1204, f"{CAMPAIGN} Tall narrow photograph of a hand pressing the dial of {BLENDER} full of red berries, the appliance in the upper two thirds, a warm softly lit kitchen behind. The lower third is calm and slightly darker."),
    "pick-1a": (890, 1203, f"{EDITORIAL} Tall still life of {BLENDER} on a pale travertine counter with a bowl of fresh berries and a glass of smoothie, seen from the front. No people."),
    "pick-1b": (890, 1203, f"{EDITORIAL} Tall close photograph of hands lifting the glass jar of {BLENDER} full of a pink berry smoothie off its base, warm morning light."),
    "pick-2a": (890, 1203, f"{EDITORIAL} Tall still life of {FRYER} on a warm oak counter with a plate of crispy roast potatoes beside it, seen from the front. No people."),
    "pick-2b": (890, 1203, f"{EDITORIAL} Tall close photograph of hands shaking the open basket of {FRYER} full of golden chicken wings, soft evening light."),
    "pick-3a": (890, 1203, f"{EDITORIAL} Tall still life of {ESPRESSO} on a pale stone counter with two small cups and a bag of coffee beans, seen from the front. No people."),
    "pick-3b": (890, 1203, f"{EDITORIAL} Tall close photograph of a hand steaming milk in a small steel jug with the steam wand of {ESPRESSO}, morning light."),
    "gallery-1": (526, 718, f"{SOCIAL} {BLENDER} on a kitchen counter by a sunny window, a smoothie half made inside the jar."),
    "gallery-2": (526, 718, f"{SOCIAL} {FRYER} on a wooden counter with a bowl of crispy chickpeas beside it."),
    "gallery-3": (526, 718, f"{SOCIAL} A cappuccino with latte art on a saucer, {ESPRESSO} softly blurred behind it."),
    "gallery-4": (526, 718, f"{SOCIAL} Two glasses of berry smoothie with straws on a marble counter, {BLENDER} softly blurred behind them."),
    "gallery-5": (526, 718, f"{SOCIAL} A plate of golden air-fried halloumi and vegetables, {FRYER} softly blurred behind it."),
    "gallery-6": (526, 718, f"{SOCIAL} Overhead view of an espresso cup, coffee beans and a portafilter on a stone counter."),
    "look-1": (1996, 854, f"{EDITORIAL} Very wide view of a long warm stone kitchen counter with {BLENDER} and {FRYER} standing on the right half of the frame, in soft mid-dark warm tones. The left half is calm empty counter and wall with no objects."),
    "look-2": (716, 854, f"{EDITORIAL} Tall calm photograph of {ESPRESSO} beside a sunlit kitchen window, long soft shadows on the wall. No people."),
    "look-3": (716, 850, f"{EDITORIAL} Tall close photograph of a hand turning the control dial of {BLENDER}, soft daylight, shallow depth of field."),
    "look-4": (1996, 850, f"{EDITORIAL} Very wide moody photograph of a modern warm kitchen at golden hour with {ESPRESSO} on the counter at the far right and {FRYER} at the far left, the center of the frame calm and softly shaded. No people."),
    "faq": (1366, 1366, f"{CAMPAIGN} Square photograph of hands loading fresh fruit into the glass jar of {BLENDER} at a warm kitchen island, warm side light, shallow depth of field."),
    "product-1": (690, 888, f"{PACKSHOT} {BLENDER}, standing upright, seen from the front, with the jar empty."),
    "product-1b": (690, 888, f"{PACKSHOT} {BLENDER}, seen from a three-quarter angle, with the jar half full of a pale green smoothie."),
    "product-1c": (690, 888, f"{PACKSHOT} A close view of the glass jar and stainless blades of {BLENDER}, the jar lifted off its base beside it."),
    "product-2": (690, 888, f"{PACKSHOT} {FRYER}, seen from the front, with the basket closed."),
    "product-2b": (690, 888, f"{PACKSHOT} {FRYER}, seen from a three-quarter angle, with the basket pulled half out and golden fries inside."),
    "product-2c": (690, 888, f"{PACKSHOT} A close view of the non-stick basket of {FRYER} on its own, seen from above."),
    "product-3": (690, 888, f"{PACKSHOT} {ESPRESSO}, seen from the front, with a small white cup on the drip tray."),
    "product-3b": (690, 888, f"{PACKSHOT} {ESPRESSO}, seen from a three-quarter angle, with the portafilter locked in."),
    "product-3c": (690, 888, f"{PACKSHOT} A close view of the portafilter, tamper and a small cup of espresso that come with {ESPRESSO}."),
    "avatar-1": (300, 300, f"{PORTRAIT} A woman in her thirties with short curly auburn hair and a linen shirt, pale grey backdrop."),
    "avatar-2": (300, 300, f"{PORTRAIT} A woman in her twenties with long dark hair and a white tee, soft rose backdrop."),
    "avatar-3": (300, 300, f"{PORTRAIT} A man in his forties with short dark hair and an olive overshirt, warm sand backdrop."),
    "avatar-4": (300, 300, f"{PORTRAIT} A woman in her fifties with silver bobbed hair and a navy knit, pale blue backdrop."),
    "popup": (820, 1032, f"{CAMPAIGN} Hands holding a glass of fresh orange smoothie next to {BLENDER}, warm cream backdrop."),
    "banner": (2000, 536, "Photorealistic very wide, high-key close-up of a softly lit pale travertine kitchen counter, almost white, with a single sprig of herbs at the far right edge. Bright, airy and low contrast. No text, no logos, no watermark, no people."),
}

# Original wordmarks for the logo row; the theme shows them at 20% opacity.
WORDMARKS = {
    "brand-1": '<text x="128" y="34" text-anchor="middle" font-family="Georgia, serif" font-size="25" font-style="italic" fill="#111">Northfield</text><text x="128" y="56" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="5" fill="#111">APPLIANCE CO</text>',
    "brand-2": '<text x="128" y="47" text-anchor="middle" font-family="Didot, Georgia, serif" font-size="32" letter-spacing="3" fill="#111">VOLTARE</text>',
    "brand-3": '<text x="128" y="36" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#111">Brightwell</text><text x="128" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" letter-spacing="4" fill="#111">KITCHEN &amp; HOME</text>',
    "brand-4": '<text x="128" y="46" text-anchor="middle" font-family="Brush Script MT, Segoe Script, cursive" font-size="34" fill="#111">Kettle &amp; Crumb</text>',
    "brand-5": '<text x="128" y="38" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="2" fill="#111">OAKMERE</text><text x="128" y="58" text-anchor="middle" font-family="Brush Script MT, Segoe Script, cursive" font-size="18" fill="#111">home goods</text>',
    "brand-6": '<text x="128" y="46" text-anchor="middle" font-family="Georgia, serif" font-size="31" font-style="italic" fill="#111">Saltworks</text>',
    "brand-7": '<text x="128" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" letter-spacing="6" fill="#111">MERIDIAN</text><text x="128" y="57" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#111">living</text>',
    "brand-8": '<text x="128" y="47" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#111">Copperline</text>',
}


def write_wordmarks() -> None:
    for name, body in WORDMARKS.items():
        (OUT_DIR / f"{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 70">{body}</svg>\n', encoding="utf-8")


def size_for(width: int, height: int) -> str:
    ratio = width / height
    if ratio > 1.15:
        return "1536x1024"
    if ratio < 0.87:
        return "1024x1536"
    return "1024x1024"


def match_backdrop(image: Image.Image) -> Image.Image:
    """Scales the colours so the corners land on the card tile colour, so every packshot shares one backdrop."""
    width, height = image.size
    size = max(min(width, height) // 24, 4)
    boxes = [(0, 0), (width - size, 0), (0, height - size), (width - size, height - size)]
    corners = [image.crop((x, y, x + size, y + size)).resize((1, 1), Image.BOX).getpixel((0, 0)) for x, y in boxes]
    # The brightest corner is the plain backdrop; a shadow can darken the others.
    backdrop = max(corners, key=sum)
    bands = [band.point(lambda v, f=target / max(seen, 1): min(round(v * f), 255)) for band, target, seen in zip(image.split(), TILE, backdrop)]
    return Image.merge("RGB", bands)


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
    if name.startswith("product-"):
        image = match_backdrop(image)
    image.save(OUT_DIR / f"{name}.jpg", quality=84, optimize=True, progressive=True)
    return name


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_wordmarks()
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
                print(f"ok   {name}", flush=True)
            except Exception as err:
                failed.append(name)
                print(f"FAIL {name}: {err}", flush=True)
    print(f"Done. {len(names) - len(failed)} ok, {len(failed)} failed: {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
