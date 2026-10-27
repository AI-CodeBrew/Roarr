"""
Writes public/demo-previews/lumenook/{product,store}.eye-sm.jpg: the full-page screenshots at 720px
wide, resampled with Lanczos. The dashboard cards show them ~220px wide, and letting the browser
squeeze the 1280px originals that far leaves the small text jagged and cluttered.

Run after `npx vite-node scripts/build-lumenook-previews.mjs`:  python scripts/downscale-lumenook-previews.py
"""
from pathlib import Path

from PIL import Image

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "demo-previews" / "lumenook"
WIDTH = 720

for name in ("product", "store"):
    src = OUT_DIR / f"{name}.eye.jpg"
    dst = OUT_DIR / f"{name}.eye-sm.jpg"
    with Image.open(src) as im:
        height = round(im.height * WIDTH / im.width)
        im.convert("RGB").resize((WIDTH, height), Image.LANCZOS).save(
            dst, "JPEG", quality=90, optimize=True, progressive=True
        )
    print(f"{dst.name}: {WIDTH}x{height}, {dst.stat().st_size // 1024} KB")
