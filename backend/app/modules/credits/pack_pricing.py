"""
Postgres document-store-backed per-country credit pack prices.

**Partition key:** ``PK`` = ISO 3166-1 alpha-2 country code (uppercase), e.g. ``IN``.

**Attributes (all optional except PK):**

- ``country_name`` (string) — display label for the UI
- ``starter_price``, ``value_price``, ``agency_price`` — decimal strings for
  Shopify (e.g. ``20.00``). Omitted or empty fields fall back to the default
  catalog for that pack.

Table name: ``DYNAMO_TABLE_CREDIT_PACK_PRICING`` (default ``kluck_credit_pack_pricing``).
Rows live in the Postgres document store (table name via DYNAMO_TABLE_CREDIT_PACK_PRICING env, default kluck_credit_pack_pricing).
"""

import logging
import os
from typing import Any, Dict, Optional

from app.modules.database.pg_document_store import PgDynamoResource

logger = logging.getLogger(__name__)

TABLE_ENV = "DYNAMO_TABLE_CREDIT_PACK_PRICING"
DEFAULT_TABLE_NAME = "kluck_credit_pack_pricing"


class CreditPackPricingStore:
    def __init__(self) -> None:
        self.region = os.getenv("AWS_DEFAULT_REGION", "eu-west-3")
        self.table_name = os.getenv(TABLE_ENV, DEFAULT_TABLE_NAME)
        try:
            self.dynamodb = PgDynamoResource()
            self.table = self.dynamodb.Table(self.table_name)
        except Exception as e:
            logger.error("CreditPackPricingStore init failed: %s", e)
            raise

    def get_by_country_code(self, iso3166_alpha2: str) -> Optional[Dict[str, Any]]:
        """Return the pricing row for ``iso3166_alpha2``, or ``None`` if missing."""
        pk = (iso3166_alpha2 or "").strip().upper()
        if len(pk) != 2 or not pk.isalpha():
            return None
        try:
            resp = self.table.get_item(Key={"PK": pk})
            return resp.get("Item")
        except Exception as e:
            code = ""
            if hasattr(e, "response"):
                code = (e.response or {}).get("Error", {}).get("Code", "")
            if code == "ResourceNotFoundException":
                logger.warning(
                    "credit pack pricing table missing: %s", self.table_name
                )
            else:
                logger.warning(
                    "credit pack pricing get_item failed for %s: %s", pk, e
                )
            return None


credit_pack_pricing_store = CreditPackPricingStore()
