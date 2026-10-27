"""
Credit system constants.

Pack **amounts** (credits, names, descriptions) live here. Per-country **prices**
override defaults when a DynamoDB row exists for that ISO 3166-1 alpha-2 code
(see ``pack_pricing`` and ``get_credit_packs_catalog``).
"""

from decimal import Decimal
from typing import Any, Dict, Optional

# Initial balance granted to a brand-new user when their wallet row is first created.
# Generations charge the catalog cost only; unused onboarding credits stay in the wallet.
SIGNUP_BONUS_CREDITS = 300

# Daily free-credit top-up cap. Each day the user's balance is brought up to
# this value (but never above it via the daily grant alone).
DAILY_TOPUP_MAX = 30

# Lifetime promo codes (never expire). Each shop may redeem a given code once.
# Redeem arms a pending multiplier; the next paid pack grant consumes it.
CREDIT_PROMOS: Dict[str, Dict[str, Any]] = {
    "ROARR2X": {
        "code": "ROARR2X",
        "multiplier": 2,
        "applies_to": "grant_pack",
        "description": "Double credits on your next credit pack purchase.",
    },
}

# Default one-time credit packs (Shopify applicationCharge amounts are decimal strings).
CREDIT_PACKS: Dict[str, Dict] = {
    "starter": {
        "name": "Starter",
        "price": "20.00",
        "credits": 600,
        "description": "600 credits to get going.",
    },
    "value": {
        "name": "Value",
        "price": "39.00",
        "credits": 1200,
        "description": "1200 credits, best value for regular users.",
    },
    "agency": {
        "name": "Growth",
        "price": "69.00",
        "credits": 2500,
        "description": "2500 credits for agencies and power users.",
    },
}

_PACK_PRICE_KEYS = {
    "starter": "starter_price",
    "value": "value_price",
    "agency": "agency_price",
}

# Cost (in credits) for each gated feature.
FEATURE_COSTS: Dict[str, int] = {
    "store_creation": 300,
    "page_generation": 200,
    # Aura (template 3) product page — all categories.
    "page_generation_glow": 150,
    # Lumenook (template 4) product page — all categories.
    "page_generation_lumenook": 150,
    "image_regenerate": 5,
    "brand_ads_campaign": 30,
}

# Entire-store generation cost varies by store mode and market type.
# Multi with premium PDPs may require a credit-pack purchase (enforced in routes).
STORE_CREATION_COSTS: Dict[str, Dict[str, int]] = {
    "multi_product": {"cod": 900, "prepaid": 900},  # store + 3 premium PDPs
    "multi_product_basic": {"cod": 300, "prepaid": 300},  # store only, no premium PDPs
    "single_product": {"cod": 500, "prepaid": 500},  # store + premium Sleek/Vibe PDP
    "single_product_basic": {"cod": 500, "prepaid": 300},  # Classic prepaid (no premium PDP)
}

# Linen: classic homepage + Sleek product page. Same price on prepaid and COD.
LINEN_SINGLE_STORE_CREDITS = 300

# Amour: editorial homepage + simple product page. Same price on prepaid and COD.
AMOUR_SINGLE_STORE_CREDITS = 300

LEDGER_TYPE_GRANT_SIGNUP = "grant_signup"
LEDGER_TYPE_GRANT_PACK = "grant_pack"
LEDGER_TYPE_GRANT_PROMO = "grant_promo"
LEDGER_TYPE_GRANT_MIGRATION = "grant_migration"
LEDGER_TYPE_GRANT_SUPPORT = "grant_support"
LEDGER_TYPE_GRANT_DAILY = "grant_daily"
LEDGER_TYPE_SPEND = "spend"
LEDGER_TYPE_REFUND = "refund"
LEDGER_TYPE_ADJUST = "adjust"

ALL_LEDGER_TYPES = {
    LEDGER_TYPE_GRANT_SIGNUP,
    LEDGER_TYPE_GRANT_PACK,
    LEDGER_TYPE_GRANT_PROMO,
    LEDGER_TYPE_GRANT_MIGRATION,
    LEDGER_TYPE_GRANT_SUPPORT,
    LEDGER_TYPE_GRANT_DAILY,
    LEDGER_TYPE_SPEND,
    LEDGER_TYPE_REFUND,
    LEDGER_TYPE_ADJUST,
}

PURCHASE_STATUS_PENDING = "pending"
PURCHASE_STATUS_ACTIVE = "active"
PURCHASE_STATUS_DECLINED = "declined"


def _coerce_price_string(value: Any) -> Optional[str]:
    """Normalize a Dynamo / JSON cell to a Shopify-style ``20.00`` string."""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return f"{value:.2f}"
    s = str(value).strip()
    if not s:
        return None
    try:
        return f"{float(s):.2f}"
    except ValueError:
        return None


def apply_pricing_row_to_catalog(
    base: Optional[Dict[str, Dict]] = None,
    pricing_row: Optional[Dict[str, Any]] = None,
) -> Dict[str, Dict]:
    """
    Merge ``starter_price`` / ``value_price`` / ``agency_price`` from a Dynamo
    row onto the default catalog. Unknown or empty price fields keep defaults.
    """
    src = base if base is not None else CREDIT_PACKS
    if not pricing_row:
        return {k: dict(v) for k, v in src.items()}
    out: Dict[str, Dict] = {}
    for pack_key, base_pack in src.items():
        merged = dict(base_pack)
        attr = _PACK_PRICE_KEYS.get(pack_key)
        if attr:
            override = _coerce_price_string(pricing_row.get(attr))
            if override:
                merged["price"] = override
        out[pack_key] = merged
    return out


def get_credit_packs_catalog(pricing_row: Optional[Dict[str, Any]] = None) -> Dict[str, Dict]:
    """Full pack definitions for balance/UI (defaults + optional Dynamo overrides)."""
    return apply_pricing_row_to_catalog(CREDIT_PACKS, pricing_row)


def get_pack(pack_name: str, pricing_row: Optional[Dict[str, Any]] = None) -> Dict:
    """Return pack details. ``pricing_row`` is an optional Dynamo pricing item."""
    catalog = get_credit_packs_catalog(pricing_row)
    pack = catalog.get((pack_name or "").lower())
    if not pack:
        raise ValueError(f"Invalid credit pack: {pack_name}")
    return pack


def is_valid_pack(pack_name: str) -> bool:
    return (pack_name or "").lower() in CREDIT_PACKS


def normalize_promo_code(code: Optional[str]) -> str:
    return str(code or "").strip().upper()


def get_promo(code: Optional[str]) -> Optional[Dict[str, Any]]:
    """Return a promo definition, or None if the code is unknown."""
    key = normalize_promo_code(code)
    promo = CREDIT_PROMOS.get(key)
    return dict(promo) if promo else None


def get_feature_cost(feature: str) -> int:
    cost = FEATURE_COSTS.get(feature)
    if cost is None:
        raise ValueError(f"Unknown feature for credit cost: {feature}")
    return cost


def get_page_generation_cost(category: Optional[str], template: Any) -> int:
    """Aura (template 3) and Lumenook (template 4) cost less than other product pages."""
    template_key = str(template or "").strip().lower().replace("template_", "")
    if template_key == "3":
        return get_feature_cost("page_generation_glow")
    if template_key == "4":
        return get_feature_cost("page_generation_lumenook")
    return get_feature_cost("page_generation")


def get_store_creation_cost(
    mode: str,
    market_type: str,
    store_template_pack: str = "classic",
    include_premium_pdps: bool = True,
    selected_template: Optional[int] = None,
) -> int:
    """Credits to generate an entire store for the given mode and market.

    Single-product:
    - Linen (classic + Sleek): 300 on prepaid and COD
    - Amour (homepage only): 300 on prepaid and COD
    - other premium PDPs: ``single_product`` tier (500)
    - Classic prepaid / no premium PDP: ``single_product_basic`` tier (300 prepaid)

    Multi-product:
    - with premium PDPs (default): ``multi_product`` tier (900)
    - store-only / no premium PDPs: ``multi_product_basic`` tier (300)
    """
    mode_key = str(mode or "single_product").strip().lower()
    pack_key = str(store_template_pack or "classic").strip().lower()
    # Amour: homepage-only single store, same price on prepaid and COD.
    if mode_key == "single_product" and pack_key == "amour":
        return AMOUR_SINGLE_STORE_CREDITS
    try:
        template_number = int(selected_template) if selected_template is not None else None
    except (TypeError, ValueError):
        template_number = None
    if (
        mode_key == "single_product"
        and include_premium_pdps
        and pack_key == "classic"
        and template_number == 1
    ):
        return LINEN_SINGLE_STORE_CREDITS
    if mode_key not in STORE_CREATION_COSTS and mode_key not in {
        "multi_product_basic",
        "single_product_basic",
    }:
        mode_key = "single_product"
    market_key = str(market_type or "prepaid").strip().lower()
    if market_key not in {"cod", "prepaid"}:
        market_key = "prepaid"
    if not include_premium_pdps:
        if mode_key == "multi_product":
            mode_key = "multi_product_basic"
        elif mode_key == "single_product":
            mode_key = "single_product_basic"
    tier = STORE_CREATION_COSTS.get(mode_key, {})
    return int(tier.get(market_key, FEATURE_COSTS["store_creation"]))


def shop_flag_enabled(value) -> bool:
    """Treat Dynamo BOOL, 1, and common string truths as enabled."""
    if value is True:
        return True
    if value is False or value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    s = str(value).strip().lower()
    return s in {"true", "1", "yes", "y"}


def shop_skips_credit_gates(shop) -> bool:
    """
    Internal and allow_bypass shops skip purchase-required and credit-spend
    gates (generate, regenerate, publish).
    """
    if not shop or not isinstance(shop, dict):
        return False
    return shop_flag_enabled(shop.get("is_internal")) or shop_flag_enabled(
        shop.get("allow_bypass")
    )


def is_valid_feature(feature: str) -> bool:
    return feature in FEATURE_COSTS


def get_pack_for_price(price: str) -> Optional[Dict]:
    """
    Reverse-lookup against the **default** catalog only (Dynamo-specific prices
    are resolved via charge / pending purchase rows).
    """
    for key, pack in CREDIT_PACKS.items():
        if pack["price"] == price:
            return {"key": key, **pack}
    return None
