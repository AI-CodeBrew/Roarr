#!/usr/bin/env python3
"""
Demo art for the Hearth store template card and preview, written to
frontend/public/hearth-assets/. Text prompts only, so every picture is new.

Usage (from backend/):
    venv/Scripts/python -u scripts/generate_hearth_demo_images.py [name ...]

Existing files are skipped; delete one or name it to redo it.
Rebuild the card screenshots afterwards: npx vite-node scripts/build-hearth-previews.mjs
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
OUT_DIR = BACKEND.parent / "frontend" / "public" / "hearth-assets"
load_dotenv(BACKEND / ".env")

TILE = (242, 242, 249)
MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")
QUALITY = "medium"

UMBER = "plain dark umber brown seamless studio backdrop, color #2b211b"
CAMPAIGN = (
    "Photorealistic high-end kitchenware campaign photograph, moody directional window light, rich "
    "natural textures, shallow depth of field, sharp focus on the kitchen piece. Any person is shown "
    "only as hands and forearms, never a face. No text, no logos, no watermark."
)
EDITORIAL = (
    "Photorealistic editorial home kitchen photograph, warm natural light, honest materials, the "
    "kitchen piece is the subject. No text, no logos, no watermark."
)
DETAIL = (
    "Photorealistic close-up kitchen detail photograph, soft daylight, shallow depth of field, rich "
    "material texture, faces out of frame. No text, no logos, no watermark."
)
PORTRAIT = (
    "Photorealistic tall portrait photograph of an adult home cook, warm natural light, relaxed and "
    "friendly, soft plain backdrop. No text, no logos, no watermark."
)
PACKSHOT = (
    "Photorealistic ecommerce kitchenware packshot, the product centered with generous margin, on a "
    "plain flat very pale lavender grey background, color #f2f2f9, soft contact shadow, high detail. "
    "No text, no logos, no labels, no extra props, no people."
)

# name: (width, height, prompt)
IMAGES = {
    "hero-1": (1920, 1011, f"{CAMPAIGN} Hands slicing a crusty sourdough loaf on a thick rectangular acacia wood cutting board with warm varied grain, rounded corners and a shallow juice groove, with a few herb sprigs nearby. Everything stays entirely inside the right half of the frame. The left half is completely empty {UMBER}."),
    "hero-2": (1920, 1011, f"{CAMPAIGN} A hand lifting a brushed stainless steel slotted spoon from a steaming dark cast iron pot, with a matching set of four brushed stainless steel kitchen tools: a ladle, a slotted spoon, a turner and tongs resting beside it. Everything stays entirely inside the right half of the frame. The left half is completely empty {UMBER}."),
    "hero-3": (1920, 1011, f"{CAMPAIGN} A hand lifting a pinch of red paprika from an open jar, among a set of three speckled cream glazed stoneware spice jars with round acacia wood lids, on a dark stone counter. Everything stays entirely inside the right half of the frame. The left half is completely empty {UMBER}."),
    "tile-1": (706, 970, f"{DETAIL} Overhead view of a thick rectangular acacia wood cutting board with warm varied grain, rounded corners and a shallow juice groove with sliced tomatoes, basil and a chef's knife, on a dark wood table, in rich mid-dark tones."),
    "tile-2": (706, 970, f"{DETAIL} a matching set of four brushed stainless steel kitchen tools: a ladle, a slotted spoon, a turner and tongs standing in a dark ceramic crock on a kitchen counter, moody side light, in rich mid-dark tones."),
    "tile-3": (706, 970, f"{DETAIL} a set of three speckled cream glazed stoneware spice jars with round acacia wood lids on a dark oak open shelf, warm side light, in rich mid-dark tones."),
    "tile-4": (706, 970, f"{DETAIL} A styled still life of an acacia cutting board leaning on a wall, brushed steel kitchen tools and speckled stoneware jars on a dark stone counter, in rich mid-dark tones."),
    "show-1": (1400, 752, f"{DETAIL} Hands chopping fresh parsley with a chef's knife on a thick rectangular acacia wood cutting board with warm varied grain, rounded corners and a shallow juice groove, a soft blur of kitchen behind."),
    "show-2": (1400, 752, f"{DETAIL} A brushed stainless steel turner flipping a golden pancake in a cast iron skillet on a gas hob."),
    "show-3": (1400, 752, f"{DETAIL} a thick rectangular acacia wood cutting board with warm varied grain, rounded corners and a shallow juice groove carried to a set table, laden with cheese, figs and bread, seen in a warm evening light."),
    "show-4": (1400, 752, f"{DETAIL} a set of three speckled cream glazed stoneware spice jars with round acacia wood lids lined up beside a stove, one lid lifted to show bright ground turmeric inside."),
    "product-1": (690, 888, f"{PACKSHOT} a thick rectangular acacia wood cutting board with warm varied grain, rounded corners and a shallow juice groove, photographed from the front standing slightly angled."),
    "product-1b": (690, 888, f"{PACKSHOT} The same acacia wood cutting board lying flat, seen from above."),
    "product-1c": (690, 888, f"{PACKSHOT} A close view of the corner and juice groove of the same acacia wood cutting board."),
    "product-2": (690, 888, f"{PACKSHOT} a matching set of four brushed stainless steel kitchen tools: a ladle, a slotted spoon, a turner and tongs, arranged side by side in a neat vertical row, seen from above."),
    "product-2b": (690, 888, f"{PACKSHOT} The same four brushed stainless steel kitchen tools fanned out from the handles, seen from above."),
    "product-2c": (690, 888, f"{PACKSHOT} A close view of the brushed steel handles and hanging loops of the same kitchen tools."),
    "product-3": (690, 888, f"{PACKSHOT} a set of three speckled cream glazed stoneware spice jars with round acacia wood lids, standing together in a small group, seen from the front."),
    "product-3b": (690, 888, f"{PACKSHOT} The same three speckled stoneware jars with their wooden lids off, resting beside them, showing paprika, turmeric and pepper inside."),
    "product-3c": (690, 888, f"{PACKSHOT} A close view of one speckled stoneware jar with its round acacia wood lid."),
    "statement": (2000, 636, f"Photorealistic very wide low-key photograph of a thick rectangular acacia wood cutting board with warm varied grain, rounded corners and a shallow juice groove with a loaf of bread and a knife, on the right side of the frame, on a dark slate surface with soft side light. The left half of the frame is an empty near-black slate surface. No people, no text, no logos, no watermark."),
    "lookbook": (1380, 1250, f"{EDITORIAL} A warm kitchen counter still life seen from the front. On the far left, a large acacia wood cutting board leans upright against a warm plaster wall, taking up the left third of the frame. In the center and right, at mid height, brushed stainless steel kitchen tools (a ladle, a turner and tongs) hang from a slim steel wall rail directly above the counter. Speckled stoneware spice jars stand on the counter at the lower right. Soft window light."),
    "avatar-1": (360, 765, f"{PORTRAIT} A smiling woman with short curly auburn hair in a linen apron, pale grey backdrop."),
    "avatar-2": (360, 765, f"{PORTRAIT} A laughing woman with long dark hair in a white cotton shirt, soft rose backdrop."),
    "avatar-3": (360, 765, f"{PORTRAIT} A smiling man with short dark hair in an olive overshirt, warm sand backdrop."),
    "story-1": (1472, 968, f"{EDITORIAL} A person seen from the chest down chopping vegetables on a wooden board at a sunlit kitchen island, no face in frame."),
    "story-2": (1472, 968, f"{EDITORIAL} Two pairs of hands sharing food from a wooden board on a rustic table in warm evening light, no faces in frame."),
    "story-3": (1472, 968, f"{EDITORIAL} A calm, beautifully ordered kitchen counter with brushed steel tools hanging from a rail and stoneware jars on a shelf, soft morning light, no people."),
    "blog-1": (900, 618, f"{DETAIL} Hands drying brushed steel kitchen tools with a linen towel at a window, soft daylight."),
    "blog-2": (900, 618, f"{DETAIL} A small stack of different wooden cutting boards on a kitchen counter, showing their end grain, soft daylight. No people."),
    "blog-3": (900, 618, f"{DETAIL} Colorful ground spices in small stoneware jars on a wooden tray, seen from above, soft daylight. No people."),
    "popup": (820, 1032, f"{CAMPAIGN} Hands dusted with flour holding a round loaf of bread over a wooden board, warm umber backdrop."),
    "banner": (2000, 536, "Photorealistic very wide, high-key close-up of softly rippling very pale off-white linen cloth, almost white, with gentle soft highlights, with a single acacia wood spoon lying at the far right edge. Bright, airy and low contrast. No text, no logos, no watermark, no people."),
}


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
