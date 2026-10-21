#!/usr/bin/env python3
"""
One-time goodwill grant: every existing user who never had a paid recurring
subscription gets a free top-up to their credit wallet.

This is the counterpart to migrate_paid_users_to_credits.py and should be run
AFTER that one (so paid users have already been processed and won't be picked
up here as "free users").

USAGE
-----
1) Test run against a SINGLE known store first:

       cd kluck-server/backend
       ./VENV/bin/python scripts/grant_credits_to_existing_free_users.py \\
           --test-shop rafay-dev-store-for-kluck.myshopify.com \\
           --test-token shpat_xxx \\
           --dry-run

   Drop --dry-run to actually grant for that one store.

2) Full run across all eligible free users:

       ./VENV/bin/python scripts/grant_credits_to_existing_free_users.py --dry-run
       ./VENV/bin/python scripts/grant_credits_to_existing_free_users.py            # for real

IDEMPOTENCY
-----------
Each grant is keyed by reference_id = "free_migration_v1:<shop_url>". Re-runs
are no-ops for users who've already received it.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.modules.database.conditions import Attr
from dotenv import load_dotenv


# ---------------------------------------------------------------------------
# CONFIG — edit here
# ---------------------------------------------------------------------------

# How many credits to grant each existing free user. 300 = parity with the
# new-user signup bonus. Bump to 500 if you want to gift one full store gen.
FREE_USER_CREDITS = 300

LEDGER_GRANT_TYPE = "grant_migration"
REFERENCE_PREFIX = "free_migration_v1"

# Statuses that mean "this user was paid at some point" — anything that
# matches these in user_subscription_transaction makes us skip them.
EVER_PAID_STATUSES = {
    "active", "ACTIVE",
    "cancelled", "CANCELLED",
    "expired", "EXPIRED",
    "frozen", "FROZEN",
    "cancelled_migration",  # from script 1
}

REPORT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "_migration_reports"
)

# Env -> DynamoDB table names. user_subscription_transaction is shared
# between dev and prod (no dev_ variant in eu-west-3).
TABLE_MAP: Dict[str, Dict[str, str]] = {
    "dev": {
        "DYNAMO_TABLE_SHOPS": "dev_kluck_users_stores",
        "DYNAMO_TABLE_SUBSCRIPTION_HISTORY": "dev_kluck_subscription_history",
        "DYNAMO_TABLE_CREDIT_WALLET": "dev_kluck_user_credit_wallet",
        "DYNAMO_TABLE_CREDIT_LEDGER": "dev_kluck_credit_ledger",
        "DYNAMO_TABLE_CREDIT_PURCHASES": "dev_kluck_credit_purchases",
        "DYNAMO_TABLE_SUBSCRIPTION_TRANSACTIONS": "user_subscription_transaction",
    },
    "prod": {
        "DYNAMO_TABLE_SHOPS": "kluck_users_stores",
        "DYNAMO_TABLE_SUBSCRIPTION_HISTORY": "kluck_subscription_history",
        "DYNAMO_TABLE_CREDIT_WALLET": "kluck_user_credit_wallet",
        "DYNAMO_TABLE_CREDIT_LEDGER": "kluck_credit_ledger",
        "DYNAMO_TABLE_CREDIT_PURCHASES": "kluck_credit_purchases",
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
    if s and not s.endswith(".myshopify.com") and ".myshopify" not in s:
        s = s + ".myshopify.com"
    return s


def _has_existing_grant(ledger_table_ref, user_id: str, reference_id: str) -> bool:
    try:
        resp = ledger_table_ref.scan(
            FilterExpression=Attr("user_id").eq(user_id)
            & Attr("type").eq(LEDGER_GRANT_TYPE)
            & Attr("reference_id").eq(reference_id),
            ProjectionExpression="entry_id",
            Limit=1,
        )
        return bool(resp.get("Items"))
    except Exception as e:
        print(f"  ! ledger lookup failed for {user_id}: {e}")
        return True  # fail safe: skip rather than double-grant


def _user_ever_had_paid_sub(document_store, fk_user_id: str) -> bool:
    """True if the user has any non-addon subscription row at all.

    We treat "ever existed in user_subscription_transaction as a real plan"
    as proof they were paid at some point. This is broader than just status
    checks and protects against status-string drift.
    """
    if not fk_user_id:
        return False
    try:
        rows = document_store.get_user_subscription_transactions(fk_user_id)
    except Exception as e:
        print(f"  ! sub lookup failed for {fk_user_id}: {e}")
        return True  # fail safe: skip
    for r in rows:
        if r.get("is_addon"):
            continue
        # Any real recurring plan row counts.
        return True
    return False


def _scan_all_stores(document_store) -> List[Dict[str, Any]]:
    """Return all non-archived stores. Each item has PK, store_url, fk_user_id."""
    table = document_store.stores_table_ref
    items: List[Dict[str, Any]] = []
    scan_kwargs: Dict[str, Any] = {
        "FilterExpression": Attr("archived").ne(True),
        "ProjectionExpression": "PK, store_url, fk_user_id, access_token, archived",
    }
    while True:
        resp = table.scan(**scan_kwargs)
        items.extend(resp.get("Items", []))
        last = resp.get("LastEvaluatedKey")
        if not last:
            break
        scan_kwargs["ExclusiveStartKey"] = last
    return items


def _process_one(
    *,
    shop_url: str,
    fk_user_id: str,
    dry_run: bool,
    document_store,
    wallet_service,
    ledger_table_ref,
) -> Dict[str, Any]:
    reference_id = f"{REFERENCE_PREFIX}:{shop_url}"
    row: Dict[str, Any] = {
        "shop_url": shop_url,
        "fk_user_id": fk_user_id,
        "credits_to_grant": FREE_USER_CREDITS,
        "grant_status": "",
        "ledger_entry_id": "",
        "new_balance": "",
        "skip_reason": "",
        "dry_run": dry_run,
    }

    # 1) If the user ever had a paid subscription row, they're not a free user.
    if _user_ever_had_paid_sub(document_store, fk_user_id):
        row["grant_status"] = "skipped"
        row["skip_reason"] = "had paid subscription"
        return row

    # 2) Idempotency: did we already give them the free-migration grant?
    if _has_existing_grant(ledger_table_ref, shop_url, reference_id):
        row["grant_status"] = "already_granted"
        return row

    if dry_run:
        row["grant_status"] = "dry_run"
        return row

    try:
        # ensure_wallet first so first-time users still get their signup bonus
        # (300) and THEN the migration grant on top — they shouldn't be
        # disadvantaged for never having opened a wallet.
        wallet_service.ensure_wallet(shop_url)
        result = wallet_service.grant(
            user_id=shop_url,
            amount=int(FREE_USER_CREDITS),
            entry_type=LEDGER_GRANT_TYPE,
            reference_id=reference_id,
            metadata={
                "source": "grant_credits_to_existing_free_users",
                "fk_user_id": fk_user_id,
                "reason": "existing_free_user_goodwill",
            },
        )
        row["grant_status"] = "granted"
        row["ledger_entry_id"] = result["entry_id"]
        row["new_balance"] = result["balance"]
    except Exception as e:
        row["grant_status"] = "failed"
        row["skip_reason"] = str(e)[:300]

    return row


def _write_report(rows: List[Dict[str, Any]], tag: str) -> str:
    os.makedirs(REPORT_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(REPORT_DIR, f"free_migration_{tag}_{ts}.csv")
    if not rows:
        with open(path, "w", encoding="utf-8") as f:
            f.write("# no rows\n")
        return path
    fieldnames = list(rows[0].keys())
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    return path


def _summarize(rows: List[Dict[str, Any]]) -> None:
    total = len(rows)
    granted = sum(1 for r in rows if r["grant_status"] == "granted")
    already = sum(1 for r in rows if r["grant_status"] == "already_granted")
    skipped = sum(1 for r in rows if r["grant_status"] == "skipped")
    failed = sum(1 for r in rows if r["grant_status"] == "failed")
    dry = sum(1 for r in rows if r["grant_status"] == "dry_run")
    credits_total = sum(
        int(r["credits_to_grant"])
        for r in rows
        if r["grant_status"] in ("granted", "dry_run")
    )
    print("\n=== Summary ===")
    print(f"  stores scanned       : {total}")
    print(f"  newly granted        : {granted}")
    print(f"  already granted      : {already}")
    print(f"  skipped (paid users) : {skipped}")
    print(f"  failed               : {failed}")
    print(f"  dry-run (would grant): {dry}")
    print(f"  total credits        : {credits_total}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--env",
        required=True,
        choices=["dev", "prod"],
        help="Which DynamoDB table set to write to. dev = dev_* tables, prod = real tables.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Plan-only: don't grant. Writes the CSV report.",
    )
    parser.add_argument(
        "--test-shop",
        help="Run only against this single shop domain (skip the full scan).",
    )
    parser.add_argument(
        "--test-token",
        help="Optional Admin API token for --test-shop (used only to verify "
             "the shop is reachable before granting).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Process at most N stores (0 = no limit). Useful for staged rollouts.",
    )
    args = parser.parse_args()

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(backend_dir, ".env"))
    sys.path.insert(0, backend_dir)

    # IMPORTANT: apply the table mapping BEFORE importing app modules.
    mapping = _apply_env(args.env)
    print(f"\n=== Environment: {args.env.upper()} ===")
    for k, v in mapping.items():
        print(f"  {k} = {v}")
    if args.env == "prod" and not args.dry_run:
        if args.test_shop:
            print(
                f"\n!!! PROD MODE on a single test shop ({args.test_shop}). "
                "Will grant credits to THIS shop's prod wallet only."
            )
        else:
            print("\n!!! PROD MODE, NOT a dry-run. Will mutate prod credit tables for ALL eligible users.")
            confirm = input("Type 'PROD' to continue: ").strip()
            if confirm != "PROD":
                print("Aborted.")
                return 1
    print()

    from app.modules.credits import wallet_service
    from app.modules.database.utils import document_store

    ledger_table_ref = wallet_service.ledger_table

    # ----- TEST MODE: a single shop ----------------------------------------
    if args.test_shop:
        shop_url = _normalize_shop_domain(args.test_shop)

        # Optional token verification.
        if args.test_token:
            import requests
            try:
                r = requests.get(
                    f"https://{shop_url}/admin/api/2024-10/shop.json",
                    headers={"X-Shopify-Access-Token": args.test_token},
                    timeout=20,
                )
                if r.status_code != 200:
                    print(f"Token check failed (HTTP {r.status_code}); aborting.")
                    return 1
                print("Token OK.")
            except Exception as e:
                print(f"Token check error: {e}; aborting.")
                return 1

        store = document_store.get_store_by_shop_url(shop_url)
        fk_user_id = (store or {}).get("fk_user_id") or ""
        print(f"\nTest target: {shop_url}")
        print(f"  fk_user_id : {fk_user_id or '(not found)'}")
        print(f"  dry_run    : {args.dry_run}")
        print()

        row = _process_one(
            shop_url=shop_url,
            fk_user_id=fk_user_id,
            dry_run=args.dry_run,
            document_store=document_store,
            wallet_service=wallet_service,
            ledger_table_ref=ledger_table_ref,
        )
        for k, v in row.items():
            print(f"  {k:>20}: {v}")
        path = _write_report([row], tag="testrun")
        print(f"\nReport written to: {path}")
        _summarize([row])
        return 0

    # ----- FULL MODE: scan stores and grant to non-paid users --------------
    print("Scanning stores table...")
    stores = _scan_all_stores(document_store)
    print(f"Found {len(stores)} non-archived store rows.")

    # Dedup by shop_url (one wallet per shop).
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for s in stores:
        url = _normalize_shop_domain(s.get("store_url") or "")
        if not url or url in seen:
            continue
        seen.add(url)
        deduped.append(s)
    stores = deduped
    print(f"After dedup by shop_url: {len(stores)} unique shops.")

    if args.limit and args.limit > 0:
        stores = stores[: args.limit]
        print(f"Limited to first {len(stores)} per --limit.")

    rows: List[Dict[str, Any]] = []
    for i, s in enumerate(stores, start=1):
        shop_url = _normalize_shop_domain(s.get("store_url") or "")
        fk_user_id = s.get("fk_user_id") or ""
        print(f"[{i}/{len(stores)}] shop={shop_url} user={fk_user_id}")
        row = _process_one(
            shop_url=shop_url,
            fk_user_id=fk_user_id,
            dry_run=args.dry_run,
            document_store=document_store,
            wallet_service=wallet_service,
            ledger_table_ref=ledger_table_ref,
        )
        rows.append(row)
        print(
            f"   -> {row['grant_status']}"
            + (f" ({row['skip_reason']})" if row.get("skip_reason") else "")
        )

    path = _write_report(rows, tag="full" if not args.dry_run else "dryrun")
    print(f"\nReport written to: {path}")
    _summarize(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
