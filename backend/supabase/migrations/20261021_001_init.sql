-- Roarr: Supabase Postgres schema
-- Document store mirrors former DynamoDB tables (jsonb items).
-- Relational views are optional; app uses dynamo_items via PgTable shim.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS dynamo_items (
  table_name TEXT NOT NULL,
  pk TEXT NOT NULL,
  sk TEXT NOT NULL DEFAULT '',
  item JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (table_name, pk, sk)
);

CREATE INDEX IF NOT EXISTS idx_dynamo_items_table ON dynamo_items (table_name);
CREATE INDEX IF NOT EXISTS idx_dynamo_items_item_gin ON dynamo_items USING GIN (item);

-- Convenience relational mirrors (optional for SQL tooling / future RLS)
CREATE TABLE IF NOT EXISTS shops (
  shopify_domain TEXT PRIMARY KEY,
  user_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_urls JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_pages (
  page_id TEXT PRIMARY KEY,
  shopify_domain TEXT,
  user_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_urls JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_wallets (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_granted INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  entry_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entry_type TEXT,
  delta INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger (user_id);

CREATE TABLE IF NOT EXISTS credit_purchases (
  purchase_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_pack_pricing (
  country_code TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  coupon_code TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundles (
  id TEXT PRIMARY KEY,
  shopify_domain TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_dna (
  user_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shopify session storage (Prisma Session model also uses this DB)
-- Prisma will manage Session table via migrate; keep this as reference:
-- CREATE TABLE "Session" (...);

COMMENT ON TABLE dynamo_items IS 'Primary app data store for v2 (Dynamo-compatible jsonb documents). Image binaries live on Bunny; only CDN URLs are stored in item jsonb.';
