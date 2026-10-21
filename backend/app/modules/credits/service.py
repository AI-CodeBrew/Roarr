"""
WalletService: business logic for the credit wallet.

Three DynamoDB tables back this:
  - roarr_user_credit_wallet      (PK = user_id == shop_url)         live balance per user
  - roarr_credit_ledger           (PK = entry_id; GSI user_id-...)   append-only audit log
  - roarr_credit_purchases        (PK = charge_id; GSI user_id-...)  Shopify pack-purchase records

All tables share the same hash-key attribute name `PK`. For the wallet, the
value of `PK` is the `user_id` (which equals the shop's myshopify URL); for
the ledger / purchases tables the value of `PK` is the natural id of the
event (entry_id / charge_id) and `user_id` is stored as a regular attribute
so the GSI `user_id-created_at-index` can serve "all events for user" queries.

All balance-mutating ops use TransactWriteItems so the wallet row and the
ledger row land atomically. Spend uses a conditional UpdateItem so we can
never go negative (no need for read-then-write).
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from app.modules.database.conditions import Attr
from app.modules.database.pg_document_store import PgDynamoResource, ClientErrorCompat
from app.modules.database.pg_transact import PgTransactClient

# Alias so existing except ClientError blocks keep working
ClientError = ClientErrorCompat
from dotenv import load_dotenv

from ...constants.credits import (
    ALL_LEDGER_TYPES,
    DAILY_TOPUP_MAX,
    FEATURE_COSTS,
    LEDGER_TYPE_GRANT_DAILY,
    LEDGER_TYPE_GRANT_PACK,
    LEDGER_TYPE_GRANT_PROMO,
    LEDGER_TYPE_GRANT_SIGNUP,
    LEDGER_TYPE_REFUND,
    LEDGER_TYPE_SPEND,
    PURCHASE_STATUS_ACTIVE,
    PURCHASE_STATUS_DECLINED,
    PURCHASE_STATUS_PENDING,
    SIGNUP_BONUS_CREDITS,
    get_feature_cost,
    get_pack,
    get_promo,
    normalize_promo_code,
)

load_dotenv()
logger = logging.getLogger(__name__)


class InsufficientCreditsError(Exception):
    """Raised when a spend would take the wallet below zero."""

    def __init__(self, balance: int, required: int, feature: str):
        self.balance = balance
        self.required = required
        self.feature = feature
        super().__init__(
            f"Insufficient credits for '{feature}': need {required}, have {balance}"
        )


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_int(value: Any) -> int:
    """DynamoDB returns Numbers as Decimal; coerce to int."""
    if value is None:
        return 0
    if isinstance(value, Decimal):
        return int(value)
    return int(value)


class WalletService:
    """
    Service for managing user credit wallets.

    The wallet row is created lazily by ensure_wallet() with the signup bonus.
    All other ops assume the row exists; they will create it on demand if not.
    """

    def __init__(self):
        self.region = os.getenv("AWS_DEFAULT_REGION", "eu-west-3")

        self.wallet_table_name = os.getenv(
            "DYNAMO_TABLE_CREDIT_WALLET", "roarr_user_credit_wallet"
        )
        self.ledger_table_name = os.getenv(
            "DYNAMO_TABLE_CREDIT_LEDGER", "roarr_credit_ledger"
        )
        self.purchases_table_name = os.getenv(
            "DYNAMO_TABLE_CREDIT_PURCHASES", "roarr_credit_purchases"
        )

        try:
            # v2: Postgres document store (no AWS)
            self.dynamodb = PgDynamoResource()
            self.client = PgTransactClient(self.dynamodb)
            self.wallet_table = self.dynamodb.Table(self.wallet_table_name)
            self.ledger_table = self.dynamodb.Table(self.ledger_table_name)
            self.purchases_table = self.dynamodb.Table(self.purchases_table_name)
        except Exception as e:
            logger.error("Failed to init WalletService Postgres store: %s", e)
            raise

    # ---------- internal helpers ---------- #

    def _build_ledger_item(
        self,
        user_id: str,
        entry_type: str,
        delta: int,
        balance_after: int,
        feature: Optional[str] = None,
        reference_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if entry_type not in ALL_LEDGER_TYPES:
            raise ValueError(f"Invalid ledger entry type: {entry_type}")

        entry_id = str(uuid.uuid4())
        # Note: PK is the table's hash key (== entry_id). entry_id is also
        # written as a plain attribute so callers/normalizers can read it
        # by its natural name without knowing the schema convention.
        item: Dict[str, Any] = {
            "PK": {"S": entry_id},
            "entry_id": {"S": entry_id},
            "user_id": {"S": user_id},
            "type": {"S": entry_type},
            "delta": {"N": str(delta)},
            "balance_after": {"N": str(balance_after)},
            "created_at": {"S": _now_iso()},
        }
        if feature:
            item["feature"] = {"S": feature}
        if reference_id:
            item["reference_id"] = {"S": str(reference_id)}
        if metadata:
            item["metadata"] = {"S": _serialize_metadata(metadata)}
        return item

    def _get_balance_after_grant(self, user_id: str, delta: int) -> int:
        """
        Read the wallet's current balance and add `delta`. Used to compute
        balance_after for ledger entries when we're about to grant credits.

        Note: we read-then-write here, but the actual mutation is done atomically
        inside TransactWriteItems with a balance update. The balance_after we
        write to the ledger is best-effort — if two grants race, both will
        commit successfully, but their balance_after values may be off by the
        other's delta. The wallet's `balance` field remains correct (ADD is
        atomic). For audit purposes we accept this small inaccuracy in the
        ledger's balance_after column; the source of truth is sum(delta).
        """
        try:
            resp = self.wallet_table.get_item(Key={"PK": user_id})
            current = _to_int(resp.get("Item", {}).get("balance", 0))
        except ClientError:
            current = 0
        return current + delta

    # ---------- public API ---------- #

    def ensure_wallet(self, user_id: str) -> Dict[str, Any]:
        """
        Idempotently create a wallet row for the user with the signup bonus.

        - If the row does not exist: creates it with balance=SIGNUP_BONUS_CREDITS
          and writes a `grant_signup` ledger entry, atomically.
        - If the row already exists: returns the existing row, no-op.

        Returns the wallet dict (always includes balance, lifetime_granted, etc.).
        """
        if not user_id:
            raise ValueError("user_id is required")

        existing = self.get_wallet(user_id)
        if existing is not None:
            return existing

        ledger_item = self._build_ledger_item(
            user_id=user_id,
            entry_type=LEDGER_TYPE_GRANT_SIGNUP,
            delta=SIGNUP_BONUS_CREDITS,
            balance_after=SIGNUP_BONUS_CREDITS,
        )

        now = _now_iso()
        try:
            self.client.transact_write_items(
                TransactItems=[
                    {
                        "Put": {
                            "TableName": self.wallet_table_name,
                            "Item": {
                                "PK": {"S": user_id},
                                "user_id": {"S": user_id},
                                "balance": {"N": str(SIGNUP_BONUS_CREDITS)},
                                "lifetime_granted": {"N": str(SIGNUP_BONUS_CREDITS)},
                                "lifetime_spent": {"N": "0"},
                                "updated_at": {"S": now},
                            },
                            "ConditionExpression": "attribute_not_exists(PK)",
                        }
                    },
                    {
                        "Put": {
                            "TableName": self.ledger_table_name,
                            "Item": ledger_item,
                        }
                    },
                ]
            )
            logger.info(
                f"Created wallet for user {user_id} with {SIGNUP_BONUS_CREDITS} signup credits"
            )
        except ClientError as e:
            # Race: another request created the wallet between our get_wallet and put.
            if "ConditionalCheckFailed" in str(e):
                logger.info(
                    f"Wallet for user {user_id} was created concurrently; using existing"
                )
                return self.get_wallet(user_id) or {}
            logger.error(f"Failed to create wallet for {user_id}: {e}")
            raise

        return self.get_wallet(user_id) or {}

    def get_wallet(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return the raw wallet row, or None if it does not exist."""
        try:
            resp = self.wallet_table.get_item(Key={"PK": user_id})
            item = resp.get("Item")
            if not item:
                return None
            return {
                "user_id": item.get("user_id") or item.get("PK"),
                "balance": _to_int(item.get("balance")),
                "lifetime_granted": _to_int(item.get("lifetime_granted")),
                "lifetime_spent": _to_int(item.get("lifetime_spent")),
                "updated_at": item.get("updated_at"),
                "promo_roarr2x_redeemed_at": item.get("promo_roarr2x_redeemed_at"),
                "promo_roarr2x_pending": bool(item.get("promo_roarr2x_pending")),
                "promo_roarr2x_consumed_at": item.get("promo_roarr2x_consumed_at"),
            }
        except ClientError as e:
            logger.error(f"Failed to read wallet for {user_id}: {e}")
            return None

    def get_balance(self, user_id: str) -> int:
        """Return the user's current balance, applying the daily top-up first."""
        self.ensure_wallet(user_id)
        self.apply_daily_topup(user_id)
        wallet = self.get_wallet(user_id)
        return _to_int((wallet or {}).get("balance", 0))

    def has_active_purchase(self, user_id: str) -> bool:
        """True if the merchant has completed at least one credit-pack purchase."""
        return bool(
            self.list_purchases_for_user(
                user_id, limit=1, status=PURCHASE_STATUS_ACTIVE
            )
        )

    def resolve_gated_spend_cost(self, _user_id: str, catalog_cost: int) -> int:
        """
        Cost to charge for a gated generate.

        Always the catalog price. Unused onboarding credits stay in the wallet
        whether or not the merchant has bought a pack.
        """
        return max(0, int(catalog_cost))

    # ---------- daily top-up ---------- #

    def _has_daily_topup_today(self, user_id: str) -> bool:
        """
        Return True if a grant_daily ledger entry already exists for today (UTC).

        Scans the ledger table (with strongly-consistent reads) filtering on
        user_id + type + created_at prefix. Paginates so we never miss a
        match hiding past a 1MB scan boundary. We deliberately do NOT pass
        ``Limit`` here: in DynamoDB ``Limit`` caps the items examined BEFORE
        the FilterExpression is applied, so it can return zero matches even
        when matching items exist later in the table.
        """
        today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        try:
            filter_expr = (
                Attr("user_id").eq(user_id)
                & Attr("type").eq(LEDGER_TYPE_GRANT_DAILY)
                & Attr("created_at").begins_with(today_prefix)
            )
            scan_kwargs = {
                "FilterExpression": filter_expr,
                "ConsistentRead": True,
            }
            while True:
                resp = self.ledger_table.scan(**scan_kwargs)
                if resp.get("Items"):
                    return True
                last_key = resp.get("LastEvaluatedKey")
                if not last_key:
                    return False
                scan_kwargs["ExclusiveStartKey"] = last_key
        except ClientError as e:
            logger.error(f"Error checking daily top-up for {user_id}: {e}")
            # Fail closed: assume already topped up to avoid double-granting.
            return True

    def apply_daily_topup(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Top the wallet up to DAILY_TOPUP_MAX once per UTC day.

        Rules:
          - Fires at most once per UTC day (guarded by a grant_daily ledger
            entry). On the first balance check after midnight UTC, we top up.
          - Grant amount = max(0, DAILY_TOPUP_MAX - current_balance).
            So if the user spent 20 of yesterday's 30, we grant 10 today.
            If the user still has >= 30 credits (e.g. unused daily + pack),
            we grant 0 — no ledger entry, the day stays "open" so a future
            spend that drops them below 30 triggers a top-up later that day.

        Returns the grant result dict if credits were added, None otherwise.

        Trial wallets (no pack purchase yet) never receive a daily top-up.
        Unused onboarding credits stay until the merchant spends them.
        """
        if not self.has_active_purchase(user_id):
            return None

        if self._has_daily_topup_today(user_id):
            return None

        wallet = self.get_wallet(user_id)
        current_balance = _to_int((wallet or {}).get("balance", 0))
        topup_amount = max(0, DAILY_TOPUP_MAX - current_balance)

        if topup_amount <= 0:
            # Already at or above the cap — skip without writing a ledger
            # entry so a later spend (same day) that drops balance below 30
            # still triggers the top-up.
            return None

        logger.info(
            f"Daily top-up for {user_id}: balance={current_balance}, "
            f"granting {topup_amount} to reach {DAILY_TOPUP_MAX}"
        )
        return self.grant(
            user_id=user_id,
            amount=topup_amount,
            entry_type=LEDGER_TYPE_GRANT_DAILY,
            metadata={
                "topup_to": DAILY_TOPUP_MAX,
                "balance_before": current_balance,
            },
        )

    def grant(
        self,
        user_id: str,
        amount: int,
        entry_type: str,
        reference_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Add credits to the wallet and write a ledger entry, atomically.

        Args:
            user_id: User identifier (== shop_url for Shopify-backed wallets).
            amount: Positive integer of credits to add.
            entry_type: One of the LEDGER_TYPE_GRANT_* constants.
            reference_id: External id (e.g. Shopify charge_id) for traceability.
            metadata: Free-form dict stored as JSON string in the ledger.

        Returns:
            { "balance": int, "entry_id": str }
        """
        if amount <= 0:
            raise ValueError("Grant amount must be positive")
        if not entry_type.startswith("grant_"):
            raise ValueError(f"grant() called with non-grant type: {entry_type}")

        # Make sure the wallet exists. (This may grant the signup bonus first,
        # which is intentional — we never want a grant to fail because the row
        # is missing.)
        self.ensure_wallet(user_id)

        new_balance = self._get_balance_after_grant(user_id, amount)
        ledger_item = self._build_ledger_item(
            user_id=user_id,
            entry_type=entry_type,
            delta=amount,
            balance_after=new_balance,
            reference_id=reference_id,
            metadata=metadata,
        )

        try:
            self.client.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": self.wallet_table_name,
                            "Key": {"PK": {"S": user_id}},
                            "UpdateExpression": (
                                "ADD balance :amt, lifetime_granted :amt "
                                "SET updated_at = :now"
                            ),
                            "ExpressionAttributeValues": {
                                ":amt": {"N": str(amount)},
                                ":now": {"S": _now_iso()},
                            },
                        }
                    },
                    {
                        "Put": {
                            "TableName": self.ledger_table_name,
                            "Item": ledger_item,
                        }
                    },
                ]
            )
            logger.info(
                f"Granted {amount} credits to {user_id} (type={entry_type}, ref={reference_id})"
            )
        except ClientError as e:
            logger.error(f"Failed to grant {amount} credits to {user_id}: {e}")
            raise

        return {
            "balance": new_balance,
            "entry_id": ledger_item["entry_id"]["S"],
        }

    def spend(
        self,
        user_id: str,
        feature: str,
        reference_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        cost: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Deduct the cost for a feature from the wallet, atomically.

        Raises InsufficientCreditsError if the wallet does not have enough.
        Nothing is deducted in that case. No ledger entry is written.

        Returns:
            { "balance": int, "cost": int, "entry_id": str, "spend_ledger_id": str }
            (entry_id and spend_ledger_id are aliases — kept both for callers'
             convenience when correlating with a refund.)
        """
        resolved_cost = int(cost) if cost is not None else get_feature_cost(feature)
        if resolved_cost < 0:
            raise ValueError("spend cost must be non-negative")

        # Wallet must exist before we can spend. ensure_wallet handles the
        # signup-bonus case for first-time users.
        wallet = self.ensure_wallet(user_id)
        current_balance = _to_int(wallet.get("balance", 0))

        if current_balance < resolved_cost:
            raise InsufficientCreditsError(
                balance=current_balance, required=resolved_cost, feature=feature
            )

        new_balance = current_balance - resolved_cost
        ledger_item = self._build_ledger_item(
            user_id=user_id,
            entry_type=LEDGER_TYPE_SPEND,
            delta=-resolved_cost,
            balance_after=new_balance,
            feature=feature,
            reference_id=reference_id,
            metadata=metadata,
        )

        try:
            self.client.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": self.wallet_table_name,
                            "Key": {"PK": {"S": user_id}},
                            # Conditional: balance must still be >= cost at commit time.
                            # If a concurrent spend got there first, this whole
                            # transaction (including the ledger put) is rolled back.
                            "UpdateExpression": (
                                "ADD balance :neg_cost, lifetime_spent :cost "
                                "SET updated_at = :now"
                            ),
                            "ConditionExpression": "balance >= :cost",
                            "ExpressionAttributeValues": {
                                ":cost": {"N": str(resolved_cost)},
                                ":neg_cost": {"N": str(-resolved_cost)},
                                ":now": {"S": _now_iso()},
                            },
                        }
                    },
                    {
                        "Put": {
                            "TableName": self.ledger_table_name,
                            "Item": ledger_item,
                        }
                    },
                ]
            )
        except ClientError as e:
            if "ConditionalCheckFailed" in str(e) or "TransactionCanceled" in str(e):
                # Re-read to give caller an accurate balance in the error.
                latest = self.get_wallet(user_id) or {}
                raise InsufficientCreditsError(
                    balance=_to_int(latest.get("balance", 0)),
                    required=resolved_cost,
                    feature=feature,
                )
            logger.error(
                f"Failed to spend {resolved_cost} for feature={feature} user={user_id}: {e}"
            )
            raise

        entry_id = ledger_item["entry_id"]["S"]
        logger.info(
            f"Spent {resolved_cost} credits for {user_id} (feature={feature}, ref={reference_id}, entry={entry_id})"
        )
        return {
            "balance": new_balance,
            "cost": resolved_cost,
            "entry_id": entry_id,
            "spend_ledger_id": entry_id,
        }

    def refund(
        self,
        user_id: str,
        feature: str,
        reference_id: str,
        spend_ledger_id: Optional[str] = None,
        reason: str = "backend_failure",
        cost: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Refund the cost of a previously-spent feature back to the wallet.

        Use this when a paid action failed on the backend after credits were
        already deducted. We never refund the user-visible "insufficient credits"
        case (no spend happened in the first place).

        The refund:
          - Adds `cost` credits back to balance.
          - Decrements lifetime_spent by `cost` (so analytics stays clean).
          - Writes a `refund` ledger entry linked to the original spend via
            metadata.refund_of and the same reference_id.
        """
        resolved_cost = int(cost) if cost is not None else None
        if resolved_cost is None and spend_ledger_id:
            spend_entry = self.get_ledger_entry(spend_ledger_id)
            if spend_entry and spend_entry.get("type") == LEDGER_TYPE_SPEND:
                resolved_cost = abs(_to_int(spend_entry.get("delta")))
        if resolved_cost is None:
            resolved_cost = get_feature_cost(feature)

        wallet = self.get_wallet(user_id)
        if wallet is None:
            raise RuntimeError(
                f"Cannot refund: wallet missing for user {user_id}"
            )

        new_balance = _to_int(wallet.get("balance", 0)) + resolved_cost
        metadata = {
            "refund_of": spend_ledger_id,
            "reason": reason,
        }
        ledger_item = self._build_ledger_item(
            user_id=user_id,
            entry_type=LEDGER_TYPE_REFUND,
            delta=resolved_cost,
            balance_after=new_balance,
            feature=feature,
            reference_id=reference_id,
            metadata=metadata,
        )

        try:
            self.client.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": self.wallet_table_name,
                            "Key": {"PK": {"S": user_id}},
                            "UpdateExpression": (
                                "ADD balance :amt, lifetime_spent :neg "
                                "SET updated_at = :now"
                            ),
                            "ExpressionAttributeValues": {
                                ":amt": {"N": str(resolved_cost)},
                                ":neg": {"N": str(-resolved_cost)},
                                ":now": {"S": _now_iso()},
                            },
                        }
                    },
                    {
                        "Put": {
                            "TableName": self.ledger_table_name,
                            "Item": ledger_item,
                        }
                    },
                ]
            )
            logger.info(
                f"Refunded {resolved_cost} credits to {user_id} (feature={feature}, ref={reference_id}, reason={reason})"
            )
        except ClientError as e:
            logger.error(f"Failed to refund {resolved_cost} credits to {user_id}: {e}")
            raise

        return {
            "balance": new_balance,
            "cost": resolved_cost,
            "entry_id": ledger_item["entry_id"]["S"],
        }

    def get_ledger_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """Load a single ledger row by entry id (PK)."""
        if not entry_id:
            return None
        try:
            resp = self.ledger_table.get_item(Key={"PK": str(entry_id)})
            item = resp.get("Item")
            if not item:
                return None
            return _normalize_ledger_item(item)
        except ClientError as e:
            logger.error(f"Failed to read ledger entry {entry_id}: {e}")
            return None

    def get_ledger(
        self,
        user_id: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Return recent ledger entries for the user, newest first.

        No GSI on the ledger table for now: we scan with a user_id filter
        (paginating across all pages so the most-recent entries aren't
        accidentally hidden behind the 1MB scan boundary) and sort
        client-side by ``created_at`` descending. Cheap enough at current
        volumes; revisit by adding a ``user_id-created_at-index`` GSI when
        scans become hot.
        """
        try:
            items: List[Dict[str, Any]] = []
            scan_kwargs = {"FilterExpression": Attr("user_id").eq(user_id)}
            while True:
                resp = self.ledger_table.scan(**scan_kwargs)
                items.extend(resp.get("Items", []))
                last_key = resp.get("LastEvaluatedKey")
                if not last_key:
                    break
                scan_kwargs["ExclusiveStartKey"] = last_key
            items.sort(key=lambda i: i.get("created_at") or "", reverse=True)
            return [_normalize_ledger_item(it) for it in items[:limit]]
        except ClientError as e:
            logger.error(f"Failed to read ledger for {user_id}: {e}")
            return []

    # ---------- pack purchases ---------- #

    def record_pending_purchase(
        self,
        charge_id: str,
        user_id: str,
        pack_name: str,
        shopify_payload: Optional[Dict[str, Any]] = None,
        pricing_row: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Persist a `pending` row in roarr_credit_purchases when we initiate a
        Shopify applicationCharge. Status is flipped to 'active' on the
        confirmation webhook (which also calls grant()).
        """
        pack = get_pack(pack_name, pricing_row)
        now = _now_iso()
        cid = str(charge_id)
        # PK == charge_id; we also store charge_id as a plain attribute so
        # callers can read it by its natural name without caring about PK.
        item = {
            "PK": cid,
            "charge_id": cid,
            "user_id": user_id,
            "pack_name": pack_name.lower(),
            "price": pack["price"],
            "credits": pack["credits"],
            "status": PURCHASE_STATUS_PENDING,
            "shopify_payload": shopify_payload or {},
            "created_at": now,
            "updated_at": now,
        }
        try:
            self.purchases_table.put_item(Item=item)
            logger.info(
                f"Recorded pending pack purchase {cid} for {user_id} ({pack_name})"
            )
        except ClientError as e:
            logger.error(f"Failed to record pending purchase {cid}: {e}")
            raise
        return item

    def get_purchase(self, charge_id: str) -> Optional[Dict[str, Any]]:
        try:
            resp = self.purchases_table.get_item(Key={"PK": str(charge_id)})
            return resp.get("Item")
        except ClientError as e:
            logger.error(f"Failed to read purchase {charge_id}: {e}")
            return None

    def list_purchases_for_user(
        self,
        user_id: str,
        limit: int = 50,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Return a user's purchases (newest first). Optionally filter to a
        single status (e.g. PURCHASE_STATUS_PENDING) to surface in-flight
        purchases for reconciliation.

        Scans the table with a user_id (and optional status) filter, then
        sorts client-side by ``created_at`` desc. No GSI for now; revisit
        if purchases volume grows.
        """
        try:
            filter_expr = Attr("user_id").eq(user_id)
            if status:
                filter_expr = filter_expr & Attr("status").eq(status)

            items: List[Dict[str, Any]] = []
            scan_kwargs = {"FilterExpression": filter_expr}
            while True:
                resp = self.purchases_table.scan(**scan_kwargs)
                items.extend(resp.get("Items", []))
                last_key = resp.get("LastEvaluatedKey")
                if not last_key:
                    break
                scan_kwargs["ExclusiveStartKey"] = last_key
            items.sort(key=lambda i: i.get("created_at") or "", reverse=True)
            return items[: max(1, min(limit, 200))]
        except ClientError as e:
            logger.error(f"Failed to list purchases for {user_id}: {e}")
            return []

    def redeem_promo(self, user_id: str, code: str) -> Dict[str, Any]:
        """
        Redeem a lifetime promo once per shop.

        ROARR2X arms a pending 2x multiplier for the next paid pack grant.
        Credits are not granted on redeem.
        """
        if not user_id:
            raise ValueError("user_id is required")
        promo = get_promo(code)
        if not promo:
            raise ValueError("Invalid promo code")

        normalized = normalize_promo_code(code)
        if normalized != "ROARR2X":
            raise ValueError("Invalid promo code")

        self.ensure_wallet(user_id)
        now = _now_iso()
        try:
            self.wallet_table.update_item(
                Key={"PK": user_id},
                UpdateExpression=(
                    "SET promo_roarr2x_redeemed_at = :now, "
                    "promo_roarr2x_pending = :true, updated_at = :now"
                ),
                ConditionExpression="attribute_not_exists(promo_roarr2x_redeemed_at)",
                ExpressionAttributeValues={
                    ":now": now,
                    ":true": True,
                },
            )
        except ClientError as e:
            if "ConditionalCheckFailed" in str(e):
                raise RuntimeError("This promo code has already been used on this store")
            logger.error(f"Failed to redeem promo {normalized} for {user_id}: {e}")
            raise

        logger.info(f"Redeemed promo {normalized} for {user_id}")
        return {
            "code": normalized,
            "multiplier": int(promo.get("multiplier") or 2),
            "pending": True,
            "message": promo.get("description")
            or "Promo applied. Your next credit pack purchase will be doubled.",
        }

    def _consume_roarr2x_pending(self, user_id: str) -> Optional[int]:
        """
        Atomically clear a pending ROARR2X arm and return its multiplier.

        Returns None when nothing was pending.
        """
        now = _now_iso()
        try:
            self.wallet_table.update_item(
                Key={"PK": user_id},
                UpdateExpression=(
                    "SET promo_roarr2x_pending = :false, "
                    "promo_roarr2x_consumed_at = :now, updated_at = :now"
                ),
                ConditionExpression="promo_roarr2x_pending = :true",
                ExpressionAttributeValues={
                    ":false": False,
                    ":true": True,
                    ":now": now,
                },
            )
            return 2
        except ClientError as e:
            if "ConditionalCheckFailed" in str(e):
                return None
            logger.error(f"Failed to consume ROARR2X for {user_id}: {e}")
            raise

    def confirm_pack_purchase(
        self,
        charge_id: str,
        shopify_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Idempotently mark a pending pack purchase as `active` and grant credits.

        Safe to call multiple times: the wallet grant only runs if the purchase
        row was not already in `active` status.

        If ROARR2X is pending on the wallet, the catalog credit amount is
        doubled once and the pending flag is cleared.
        """
        purchase = self.get_purchase(charge_id)
        if not purchase:
            raise RuntimeError(f"Unknown charge_id for pack confirmation: {charge_id}")

        if purchase.get("status") == PURCHASE_STATUS_ACTIVE:
            logger.info(
                f"Pack purchase {charge_id} already active; skipping grant"
            )
            return {"already_active": True, "purchase": purchase}

        user_id = purchase["user_id"]
        base_credits = _to_int(purchase["credits"])
        credits = base_credits
        pack_name = purchase.get("pack_name", "")

        # Flip status first via a conditional update so concurrent webhook
        # deliveries can't both grant credits.
        try:
            self.purchases_table.update_item(
                Key={"PK": str(charge_id)},
                UpdateExpression=(
                    "SET #s = :active, updated_at = :now"
                    + (", shopify_payload = :payload" if shopify_payload else "")
                ),
                ConditionExpression="#s <> :active",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":active": PURCHASE_STATUS_ACTIVE,
                    ":now": _now_iso(),
                    **({":payload": shopify_payload} if shopify_payload else {}),
                },
            )
        except ClientError as e:
            if "ConditionalCheckFailed" in str(e):
                logger.info(
                    f"Pack purchase {charge_id} was concurrently activated; skipping grant"
                )
                return {"already_active": True, "purchase": self.get_purchase(charge_id)}
            logger.error(f"Failed to flip purchase {charge_id} to active: {e}")
            raise

        promo_multiplier = self._consume_roarr2x_pending(user_id)
        metadata: Dict[str, Any] = {
            "pack": pack_name,
            "price": purchase.get("price"),
            "base_credits": base_credits,
        }
        if promo_multiplier and promo_multiplier > 1:
            credits = base_credits * promo_multiplier
            metadata["promo"] = "ROARR2X"
            metadata["multiplier"] = promo_multiplier
            logger.info(
                f"Applied ROARR2X to pack {charge_id}: {base_credits} -> {credits}"
            )

        grant_result = self.grant(
            user_id=user_id,
            amount=credits,
            entry_type=LEDGER_TYPE_GRANT_PACK,
            reference_id=str(charge_id),
            metadata=metadata,
        )

        return {
            "already_active": False,
            "balance": grant_result["balance"],
            "credits_granted": credits,
            "base_credits": base_credits,
            "promo": "ROARR2X" if promo_multiplier else None,
            "purchase": self.get_purchase(charge_id),
        }

    def mark_purchase_declined(
        self,
        charge_id: str,
        shopify_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Mark a pending purchase as declined (no credits granted)."""
        try:
            update_expr = "SET #s = :declined, updated_at = :now"
            values = {
                ":declined": PURCHASE_STATUS_DECLINED,
                ":now": _now_iso(),
            }
            if shopify_payload:
                update_expr += ", shopify_payload = :payload"
                values[":payload"] = shopify_payload
            self.purchases_table.update_item(
                Key={"PK": str(charge_id)},
                UpdateExpression=update_expr,
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues=values,
            )
            logger.info(f"Marked pack purchase {charge_id} as declined")
        except ClientError as e:
            logger.error(f"Failed to mark purchase {charge_id} declined: {e}")
            raise


def _serialize_metadata(metadata: Dict[str, Any]) -> str:
    """Stable JSON for the ledger metadata column."""
    import json

    try:
        return json.dumps(metadata, default=str, sort_keys=True)
    except Exception:
        return str(metadata)


def _normalize_ledger_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Coerce DynamoDB resource-API items into plain Python types."""
    import json

    out = {
        "entry_id": item.get("entry_id") or item.get("PK"),
        "user_id": item.get("user_id"),
        "type": item.get("type"),
        "delta": _to_int(item.get("delta")),
        "balance_after": _to_int(item.get("balance_after")),
        "feature": item.get("feature"),
        "reference_id": item.get("reference_id"),
        "created_at": item.get("created_at"),
    }
    raw_meta = item.get("metadata")
    if isinstance(raw_meta, str):
        try:
            out["metadata"] = json.loads(raw_meta)
        except Exception:
            out["metadata"] = raw_meta
    else:
        out["metadata"] = raw_meta
    return out


# Singleton, mirroring the pattern used by document_store.
wallet_service = WalletService()
