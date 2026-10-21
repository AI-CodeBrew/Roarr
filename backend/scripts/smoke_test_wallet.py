"""
Smoke test for WalletService against the real (dev) DynamoDB tables.

Walks through the lifecycle:
  1. ensure_wallet for a fresh user  -> balance=300 (signup bonus)
  2. ensure_wallet again              -> idempotent, still 300
  3. spend page_generation (200)      -> balance=100
  4. spend store_creation (300)       -> InsufficientCreditsError
  5. simulate pack purchase confirm   -> balance=700 (100 + 600 starter)
  6. spend page_generation (200)      -> balance=500
  7. spend page_generation (200)      -> balance=300
  8. refund the last spend            -> balance=500
  9. ledger has 6 entries (signup, spend, grant_pack, spend, spend, refund)
 11. cleanup test data

Run:  python -m scripts.smoke_test_wallet
"""

import logging
import os
import sys
import time
import uuid

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("smoke")

from app.modules.credits import wallet_service, InsufficientCreditsError  # noqa: E402
from app.modules.credits.service import _to_int  # noqa: E402


def cleanup(user_id: str, charge_ids):
    """Best-effort cleanup so re-runs are clean."""
    try:
        wallet_service.wallet_table.delete_item(Key={"PK": user_id})
    except Exception as e:
        logger.warning(f"cleanup wallet: {e}")
    for cid in charge_ids:
        if not cid:
            continue
        try:
            wallet_service.purchases_table.delete_item(Key={"PK": cid})
        except Exception as e:
            logger.warning(f"cleanup purchase {cid}: {e}")
    # Ledger entries: query by GSI and delete each
    try:
        resp = wallet_service.ledger_table.scan(
            FilterExpression="user_id = :u",
            ExpressionAttributeValues={":u": user_id},
        )
        for item in resp.get("Items", []):
            wallet_service.ledger_table.delete_item(
                Key={"PK": item.get("PK") or item.get("entry_id")}
            )
    except Exception as e:
        logger.warning(f"cleanup ledger: {e}")


def main() -> int:
    user_id = f"smoketest_{uuid.uuid4().hex[:10]}"
    charge_id = f"chg_smoke_{uuid.uuid4().hex[:8]}"
    logger.info(f"Test user: {user_id}, charge: {charge_id}")

    failures = []

    def assert_eq(label, actual, expected):
        if actual != expected:
            logger.error(f"  FAIL {label}: expected {expected}, got {actual}")
            failures.append(label)
        else:
            logger.info(f"  ok   {label}: {actual}")

    try:
        # 1. fresh wallet
        w = wallet_service.ensure_wallet(user_id)
        assert_eq("signup balance", w.get("balance"), 300)
        assert_eq("lifetime_granted", w.get("lifetime_granted"), 300)

        # 2. idempotent
        w2 = wallet_service.ensure_wallet(user_id)
        assert_eq("idempotent balance", w2.get("balance"), 300)

        # 3. spend page_generation (200). Leftover 100 stays.
        r = wallet_service.spend(user_id, "page_generation", reference_id="page_smoke_1")
        assert_eq("balance after page spend", r["balance"], 100)
        # 4. insufficient credits (need store_creation 300, have 100)
        try:
            wallet_service.spend(user_id, "store_creation")
            failures.append("expected InsufficientCreditsError")
            logger.error("  FAIL: expected InsufficientCreditsError, got success")
        except InsufficientCreditsError as e:
            logger.info(f"  ok   raised InsufficientCreditsError: balance={e.balance}, need={e.required}")
            assert_eq("error.balance", e.balance, 100)

        # 6. simulate Starter pack purchase
        wallet_service.record_pending_purchase(
            charge_id=charge_id,
            user_id=user_id,
            pack_name="starter",
            shopify_payload={"smoke": True},
        )
        confirm = wallet_service.confirm_pack_purchase(charge_id=charge_id)
        assert_eq("balance after pack", confirm["balance"], 700)

        # 6b. confirming again is a no-op
        confirm_again = wallet_service.confirm_pack_purchase(charge_id=charge_id)
        assert_eq("idempotent confirm", confirm_again.get("already_active"), True)
        bal = wallet_service.get_balance(user_id)
        assert_eq("balance unchanged after re-confirm", bal, 700)

        # 6 & 7. two more spends
        r2 = wallet_service.spend(user_id, "page_generation", reference_id="page_smoke_2")
        assert_eq("balance after 2nd page spend", r2["balance"], 500)
        r3 = wallet_service.spend(user_id, "page_generation", reference_id="page_smoke_3")
        assert_eq("balance after 3rd page spend", r3["balance"], 300)
        last_spend_id = r3["spend_ledger_id"]

        # 9. refund
        ref = wallet_service.refund(
            user_id=user_id,
            feature="page_generation",
            reference_id="page_smoke_3",
            spend_ledger_id=last_spend_id,
            reason="smoke_test",
        )
        assert_eq("balance after refund", ref["balance"], 500)

        # 9. ledger
        ledger = wallet_service.get_ledger(user_id, limit=20)
        assert_eq("ledger length", len(ledger), 6)
        types = [e["type"] for e in ledger]
        # newest first
        expected_types = [
            "refund", "spend", "spend", "grant_pack", "spend", "grant_signup",
        ]
        assert_eq("ledger types order", types, expected_types)

        # Reconciliation: sum of deltas == current balance
        total = sum(e["delta"] for e in ledger)
        bal_now = wallet_service.get_balance(user_id)
        assert_eq("sum(deltas) == balance", total, bal_now)

        # 10. list_purchases_for_user — should return 1 active purchase, 0 pending
        all_purchases = wallet_service.list_purchases_for_user(user_id)
        assert_eq("list all purchases count", len(all_purchases), 1)
        assert_eq("first purchase status", all_purchases[0]["status"], "active")

        active_only = wallet_service.list_purchases_for_user(user_id, status="active")
        assert_eq("filter active count", len(active_only), 1)

        pending_only = wallet_service.list_purchases_for_user(user_id, status="pending")
        assert_eq("filter pending count (none left)", len(pending_only), 0)

        # 11. record a 2nd pending pack to verify list filtering and ordering
        charge_id_2 = f"smoke_charge_{int(time.time())}_2"
        wallet_service.record_pending_purchase(
            charge_id=charge_id_2,
            user_id=user_id,
            pack_name="value",
            shopify_payload={"smoke_2": True},
        )
        pending_again = wallet_service.list_purchases_for_user(user_id, status="pending")
        assert_eq("pending count after 2nd record", len(pending_again), 1)
        assert_eq("pending pack_name", pending_again[0]["pack_name"], "value")

        all_after = wallet_service.list_purchases_for_user(user_id)
        assert_eq("total purchases after 2nd record", len(all_after), 2)
        # newest first (the pending value pack we just inserted)
        assert_eq("newest first ordering", all_after[0]["charge_id"], charge_id_2)

    finally:
        cleanup(user_id, [charge_id, charge_id_2 if 'charge_id_2' in locals() else None])

    if failures:
        logger.error(f"\n{len(failures)} FAILURES: {failures}")
        return 1
    logger.info("\nALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    # Make `app.*` imports work when run from backend/
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.exit(main())
