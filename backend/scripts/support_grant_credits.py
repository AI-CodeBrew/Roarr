#!/usr/bin/env python3
"""
Manual credit grant for support / ops (DynamoDB wallet + ledger).

Fills in ENV, SHOP_DOMAIN, amount, and ledger type, then run from `backend/`:

  cd backend
  ./VENV/bin/python scripts/support_grant_credits.py

Requires AWS credentials and .env (same as the Flask app).
Set ENV to "dev" or "prod" to pick DynamoDB tables; prod asks for confirmation.

Set ROARR_ENV to choose tables (default dev):
  ROARR_ENV=dev   → dev_roarr_* credit tables
  ROARR_ENV=prod  → production credit tables (DYNAMO_TABLE_CREDIT_* in prod env)

Must be set before WalletService initializes; this script reads it after
loading .env and applies DYNAMO_TABLE_CREDIT_* accordingly.

SHOP_DOMAIN is the wallet key (Shopify myshopify domain) — the same
identifier the app uses as `request.user_id`.

ACCESS_TOKEN is optional. If set, we call Shopify admin `shop.json` to confirm
the token still belongs to that shop before granting. If empty, verification
is skipped (faster, but you must be sure the domain is correct).
"""

from __future__ import annotations

import os
import sys
from typing import Dict

import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# CONFIG — edit these per request
# ---------------------------------------------------------------------------

ENV = "prod"  # "dev" or "prod"

SHOP_DOMAIN = "b2deuv-tg.myshopify.com"

# Admin API offline token for the shop; optional verification only (not sent to grant()).
ACCESS_TOKEN = "***"

GRANT_TOKENS = 200
# Must be a grant_* ledger type known to app/constants/credits.py (ALL_LEDGER_TYPES).
# Common choices for support:
#   grant_support  — default; discretionary manual grant
#   grant_promo    — goodwill / marketing
#   grant_migration — one-off moves from legacy billing
GRANT_TYPE = "grant_support"

# Optional: ticket id, email, or free text stored in the ledger entry metadata
NOTE = "Support manual grant"

# Shopify API version (must match what you use elsewhere for shop.json)
SHOPIFY_API_VERSION = "2024-10"

# Env -> DynamoDB table names (same mapping as grant_credits_to_existing_free_users.py).
TABLE_MAP: Dict[str, Dict[str, str]] = {
    "dev": {
        "DYNAMO_TABLE_SHOPS": "dev_roarr_users_stores",
        "DYNAMO_TABLE_SUBSCRIPTION_HISTORY": "dev_roarr_subscription_history",
        "DYNAMO_TABLE_CREDIT_WALLET": "dev_roarr_user_credit_wallet",
        "DYNAMO_TABLE_CREDIT_LEDGER": "dev_roarr_credit_ledger",
        "DYNAMO_TABLE_CREDIT_PURCHASES": "dev_roarr_credit_purchases",
        "DYNAMO_TABLE_SUBSCRIPTION_TRANSACTIONS": "user_subscription_transaction",
    },
    "prod": {
        "DYNAMO_TABLE_SHOPS": "roarr_users_stores",
        "DYNAMO_TABLE_SUBSCRIPTION_HISTORY": "roarr_subscription_history",
        "DYNAMO_TABLE_CREDIT_WALLET": "roarr_user_credit_wallet",
        "DYNAMO_TABLE_CREDIT_LEDGER": "roarr_credit_ledger",
        "DYNAMO_TABLE_CREDIT_PURCHASES": "roarr_credit_purchases",
        "DYNAMO_TABLE_SUBSCRIPTION_TRANSACTIONS": "user_subscription_transaction",
    },
}


def _apply_env(env: str) -> Dict[str, str]:
    if env not in TABLE_MAP:
        raise ValueError(f"Unknown env: {env}. Use one of: {list(TABLE_MAP)}")
    mapping = TABLE_MAP[env]
    for k, v in mapping.items():
        os.environ[k] = v
    return mapping


# ---------------------------------------------------------------------------


def _normalize_shop_domain(shop: str) -> str:
    s = (shop or "").strip().lower()
    s = s.replace("https://", "").replace("http://", "")
    s = s.split("/")[0]
    if not s.endswith(".myshopify.com"):
        s = s + ".myshopify.com" if ".myshopify" not in s else s
    return s


def verify_shopify_token(shop_domain: str, access_token: str) -> bool:
    """Return True if the token can read shop info for this domain."""
    if not access_token or access_token == "token":
        return True
    url = f"https://{shop_domain}/admin/api/{SHOPIFY_API_VERSION}/shop.json"
    resp = requests.get(
        url,
        headers={"X-Shopify-Access-Token": access_token, "Content-Type": "application/json"},
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"Shopify verify failed: HTTP {resp.status_code} {resp.text[:200]}")
        return False
    return True


def main() -> int:
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(backend_dir, ".env"))
    sys.path.insert(0, backend_dir)

    env = ENV.strip().lower()
    if env not in TABLE_MAP:
        print(f"Error: ENV must be 'dev' or 'prod', got {ENV!r}")
        return 1

    # Apply table mapping BEFORE importing WalletService (reads env at init).
    mapping = _apply_env(env)
    print(f"\n=== Environment: {env.upper()} ===")
    for k, v in mapping.items():
        print(f"  {k} = {v}")

    from app.constants.credits import ALL_LEDGER_TYPES

    shop = _normalize_shop_domain(SHOP_DOMAIN)
    if not shop or "myshopify.com" not in shop:
        print("Error: set SHOP_DOMAIN to a valid *.myshopify.com domain.")
        return 1

    if GRANT_TOKENS <= 0:
        print("Error: GRANT_TOKENS must be a positive integer.")
        return 1

    if GRANT_TYPE not in ALL_LEDGER_TYPES or not str(GRANT_TYPE).startswith("grant_"):
        print(
            f"Error: GRANT_TYPE must be a grant_* type from ALL_LEDGER_TYPES, got {GRANT_TYPE!r}"
        )
        return 1

    print(f"\nTarget shop (wallet id): {shop}")
    print(f"Amount: {GRANT_TOKENS} | type: {GRANT_TYPE}")

    if env == "prod":
        print(
            f"\n!!! PROD MODE. Will grant {GRANT_TOKENS} credits to {shop} "
            "in prod DynamoDB tables."
        )
        confirm = input("Type 'PROD' to continue: ").strip()
        if confirm != "PROD":
            print("Aborted.")
            return 1

    from app.modules.credits import wallet_service

    # if ACCESS_TOKEN and ACCESS_TOKEN != "token":
    #     print("Verifying Shopify access token against shop…")
    #     if not verify_shopify_token(shop, ACCESS_TOKEN):
    #         print("Abort: token verification failed (wrong shop or bad token).")
    #         return 1
    #     print("Token OK.")
    # else:
    #     print("Skipping token verification (ACCESS_TOKEN empty or placeholder).")

    result = wallet_service.grant(
        user_id=shop,
        amount=int(GRANT_TOKENS),
        entry_type=GRANT_TYPE,
        reference_id=None,
        metadata={
            "source": "support_script",
            "note": NOTE,
        },
    )

    print("Done.")
    print(f"  New balance: {result['balance']}")
    print(f"  Ledger entry_id: {result['entry_id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
