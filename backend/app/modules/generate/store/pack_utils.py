"""Store template pack helpers (classic, cinematic, amour)."""

from __future__ import annotations

import os
from typing import Optional

VALID_STORE_TEMPLATE_PACKS = frozenset({"classic", "cinematic", "amour"})

# Homepage-only packs: never generate or bind a premium Sleek/Vibe PDP.
HOME_ONLY_STORE_TEMPLATE_PACKS = frozenset({"amour"})

# Packs that exist for single-product stores only.
SINGLE_PRODUCT_ONLY_STORE_TEMPLATE_PACKS = frozenset({"cinematic", "amour"})


def normalize_store_template_pack(raw) -> str:
    value = str(raw or "classic").strip().lower()
    if value in VALID_STORE_TEMPLATE_PACKS:
        return value
    return "classic"


def cinematic_pack_dir() -> str:
    return os.path.join(
        os.path.dirname(__file__),
        "templates",
        "packs",
        "cinematic",
    )


def resolve_store_templates_dir(
    shopify_files_dir,
    mode: str,
    store_template_pack: Optional[str] = None,
):
    """
    Return Path to the JSON templates folder for this mode + pack.

    classic → store_templates/single_product|multi_product
    cinematic / amour (single only) → store_templates/packs/<pack>/single_product
    """
    from pathlib import Path

    root = Path(shopify_files_dir) / "store_templates"
    pack = normalize_store_template_pack(store_template_pack)
    mode_key = "single_product" if mode == "single_product" else "multi_product"

    if pack in SINGLE_PRODUCT_ONLY_STORE_TEMPLATE_PACKS and mode_key == "single_product":
        pack_dir = root / "packs" / pack / "single_product"
        if pack_dir.exists():
            return pack_dir

    return root / mode_key


def store_theme_name(
    mode: str,
    store_template_pack: Optional[str] = None,
    template=None,
    include_premium: bool = True,
) -> str:
    """
    Store theme display name for analytics.
    Keep in sync with getStoreThemeName in kluck-embeded/app/lib/themeNames.js.
    """
    pack = normalize_store_template_pack(store_template_pack)
    try:
        vibe = int(template) == 2
    except (TypeError, ValueError):
        vibe = False

    if mode in ("multi", "multi_product"):
        return "Swift"

    if pack == "amour":
        return "Amour"
    if not include_premium:
        return "Swift"
    if pack == "cinematic":
        return "Velvet" if vibe else "Eclipse"
    return "Pulse" if vibe else "Linen"
