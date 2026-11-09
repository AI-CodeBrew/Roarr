#!/usr/bin/env python3
"""
Demo art for the Lustre store template card and preview, written to
frontend/public/lustre-assets/. Text prompts only, so every picture is new.

Usage (from backend/):
    venv/Scripts/python -u scripts/generate_lustre_demo_images.py [name ...]

Existing files are skipped; delete one or name it to redo it.
Rebuild the card screenshots afterwards: npx vite-node scripts/build-lustre-previews.mjs
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
OUT_DIR = BACKEND.parent / "frontend" / "public" / "lustre-assets"
load_dotenv(BACKEND / ".env")

MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")
QUALITY = "medium"

TAN = "plain warm tan seamless studio backdrop, color #bd9c83"
PORTRAIT = (
    "Photorealistic beauty editorial photograph of an adult woman, natural skin texture, "
    "soft studio light, sharp focus on the jewelry. No text, no logos, no watermark."
)
LIFESTYLE = (
    "Photorealistic close-up fashion jewelry photograph of an adult woman, warm natural skin "
    "tones, soft daylight, shallow depth of field. No text, no logos, no watermark."
)
PACKSHOT = (
    "Photorealistic ecommerce packshot on a pure white background, soft contact shadow, "
    "centered with generous margin, high detail, gold and diamond materials. "
    "No text, no logos, no props, no people."
)

# name: (width, height, prompt)
IMAGES = {
    "hero-1": (1920, 960, f"{PORTRAIT} She has a sleek dark bun, closed eyes and a soft smile, bare shoulders, a sparkling diamond floral necklace and drop earrings. Small in a very wide frame: she stays entirely inside the right 40%, shown from the chest up. The left 60% of the frame is completely empty {TAN}."),
    "hero-2": (1920, 960, f"{PORTRAIT} She has long auburn waves and wears layered fine gold chains with a pearl pendant and gold hoops. Small in a very wide frame: she stays entirely inside the right 40%, shown from the chest up. The left 60% of the frame is completely empty {TAN}."),
    "hero-3": (1920, 960, f"{PORTRAIT} She has short black curls and wears a statement emerald and gold collar necklace with matching studs. Small in a very wide frame: she stays entirely inside the right 40%, shown from the chest up. The left 60% of the frame is completely empty {TAN}."),
    "about-1": (800, 1000, f"{PORTRAIT} Portrait of a woman with hair pulled back, black blazer, geometric gold drop earrings and a gold signet ring, hand near her chin, warm neutral backdrop."),
    "about-2": (800, 800, "Photorealistic flat lay of three interlocked thin gold hoop earrings on crumpled ivory paper over a travertine stone, soft daylight. No text, no logos, no people."),
    "cat-1": (600, 600, f"{LIFESTYLE} Side view of an ear with a sculptural silver hoop earring holding a small green stone, curly auburn hair, beige top."),
    "cat-2": (600, 600, f"{LIFESTYLE} Neck and collarbone wearing two delicate layered gold chains, ivory silk blouse."),
    "cat-3": (600, 600, f"{LIFESTYLE} Profile of a woman with a low dark bun, fingers touching her neck, wearing tiny gold studs and thin rings, warm peach backdrop."),
    "cat-4": (600, 600, f"{LIFESTYLE} Collarbone with a tiny solitaire gold pendant on a thin chain, tanned skin, white shirt edge."),
    "cat-5": (600, 600, f"{LIFESTYLE} Hand resting on a bare shoulder wearing stacked textured gold rings, warm light."),
    "cat-6": (600, 600, f"{LIFESTYLE} Wrist with three layered rose gold chain bracelets, soft cream linen behind."),
    "card-1": (800, 1100, f"{LIFESTYLE} Extreme close-up of an ear and neck wearing a large chunky knotted gold hoop earring, dark hair tied back, knit sweater at the bottom edge."),
    "card-2": (800, 1100, f"{LIFESTYLE} Front view of a neck wearing a mixed gold chain necklace with a single round pearl at the center, dark hair behind shoulders, ribbed cream top."),
    "card-3": (800, 1100, f"{LIFESTYLE} Close-up of lower face and manicured fingers touching the chin, wearing a slim silver band with small diamonds, soft peach backdrop."),
    "split": (1400, 1000, f"{PORTRAIT} Joyful laughing woman with long dark hair, hand across her forehead wearing a chunky diamond ring, long crystal tassel earrings, bare shoulders, {TAN}."),
    "promo-1": (800, 640, f"{LIFESTYLE} Woman with an updo and layered gold coin necklaces, hand with gold rings at her collarbone, in front of a very light, almost white grey studio wall, color #f5f5f5."),
    "promo-2": (800, 640, f"{PORTRAIT} Woman with loose brown waves and long gold chandelier earrings, blush blouse, in front of a very light, almost white grey studio wall, color #f5f5f5."),
    "product-1": (800, 800, f"{PACKSHOT} A halo diamond solitaire ring with a split pave shank in yellow gold, three-quarter view."),
    "product-2": (800, 800, f"{PACKSHOT} A pair of yellow gold drop earrings, small diamond stud top, thin chain, little enamel turquoise flower charm at the bottom."),
    "product-3": (800, 800, f"{PACKSHOT} A yellow gold pendant on a fine chain, interlocked open hearts set with diamonds."),
    "product-4": (800, 800, f"{PACKSHOT} A pair of gold and diamond earrings, triangle stud top with a rhombus drop holding a violet baguette stone."),
    "product-5": (800, 800, f"{PACKSHOT} A pair of long rose gold earrings with leaf motifs and pear shaped diamonds."),
    "product-6": (800, 800, f"{PACKSHOT} A yellow gold ring with a swirling diamond crossover head, three-quarter view."),
    "product-7": (800, 800, f"{PACKSHOT} A slim yellow gold bangle with a small ruby and diamond teardrop motif, seen at an angle."),
    "product-8": (800, 800, f"{PACKSHOT} A yellow gold ring with a bezel set violet stone and fine chain detail across the band."),
    "avatar-1": (300, 300, f"{PORTRAIT} Friendly woman with honey brown hair in a white blouse and gold earrings, pale grey backdrop, head and shoulders."),
    "avatar-2": (300, 300, f"{PORTRAIT} Woman with long black hair in a black top, small gold hoops, blurred garden behind, head and shoulders."),
    "blog-1": (900, 620, f"{LIFESTYLE} Woman in a cream blazer and lace top, gold pendant and an opal ring, hand at her waist, face out of frame, city daylight."),
    "blog-2": (900, 620, f"{LIFESTYLE} Smiling woman in profile adjusting an ornate long diamond filigree earring, dark hair, blue shirt."),
    "blog-3": (900, 620, f"{LIFESTYLE} Two hands in a white linen shirt, one wearing a large oval diamond ring, blurred sunny garden."),
}


def size_for(width: int, height: int) -> str:
    ratio = width / height
    if ratio > 1.15:
        return "1536x1024"
    if ratio < 0.87:
        return "1024x1536"
    return "1024x1024"


def whiten(image: Image.Image) -> Image.Image:
    """Lift a packshot's near-white backdrop to pure white so it melts into the white card."""
    corners = [image.getpixel(p) for p in ((4, 4), (image.width - 5, 4))]
    backdrop = [min(c[i] for c in corners) for i in range(3)]
    bands = [
        band.point(lambda v, b=max(backdrop[i], 1): min(255, round(v * 255 / b)))
        for i, band in enumerate(image.split())
    ]
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
        image = whiten(image)
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
