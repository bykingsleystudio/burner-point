-- ============================================================
-- Migration 011: Wallet Direct Charging + Messenger Call Credits
-- ============================================================
-- Keeps subscriptions separate, uses wallet balance for product purchases,
-- and reserves credits for BP Messenger calling only.

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS locked_balance_usd_cents BIGINT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'deposit';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'product_purchase';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'product_refund';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'wallet_lock';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'wallet_release';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'call_credit_purchase';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'esim_purchase';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'proxy_purchase';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'vpn_purchase';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_lock_status') THEN
    CREATE TYPE wallet_lock_status AS ENUM ('active', 'spent', 'released', 'expired', 'canceled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
    CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'spend', 'refund', 'lock', 'release', 'adjustment', 'bonus', 'expiration');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_status') THEN
    CREATE TYPE credit_transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_lock_status') THEN
    CREATE TYPE credit_lock_status AS ENUM ('active', 'spent', 'released', 'expired', 'canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS wallet_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd_cents BIGINT NOT NULL,
  reason TEXT NOT NULL,
  related_product TEXT,
  related_entity_id TEXT,
  expires_at TIMESTAMP,
  status wallet_lock_status NOT NULL DEFAULT 'active',
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  released_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_locks_user_id ON wallet_locks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_locks_status ON wallet_locks(status, expires_at);

CREATE TABLE IF NOT EXISTS credit_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  credit_balance BIGINT NOT NULL DEFAULT 0,
  locked_credit_balance BIGINT NOT NULL DEFAULT 0,
  lifetime_credits_purchased BIGINT NOT NULL DEFAULT 0,
  lifetime_credits_spent BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type credit_transaction_type NOT NULL,
  credits_amount BIGINT NOT NULL,
  usd_value_cents BIGINT NOT NULL DEFAULT 0,
  related_product TEXT,
  related_entity_id TEXT,
  description TEXT,
  status credit_transaction_status NOT NULL DEFAULT 'completed',
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_amount BIGINT NOT NULL,
  reason TEXT NOT NULL,
  related_product TEXT,
  related_entity_id TEXT,
  expires_at TIMESTAMP,
  status credit_lock_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  released_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product TEXT NOT NULL,
  country_code TEXT,
  provider TEXT,
  service_code TEXT,
  route_quality TEXT,
  provider_cost_usd_cents BIGINT NOT NULL DEFAULT 0,
  platform_margin_usd_cents BIGINT NOT NULL DEFAULT 0,
  risk_margin_usd_cents BIGINT NOT NULL DEFAULT 0,
  country_multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1,
  route_quality_multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_pricing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product TEXT NOT NULL,
  country_code TEXT,
  provider TEXT,
  service_code TEXT,
  related_entity_id TEXT,
  quote_request JSONB NOT NULL DEFAULT '{}',
  quote_result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  usd_price_cents BIGINT NOT NULL DEFAULT 0,
  base_credits BIGINT NOT NULL DEFAULT 0,
  bonus_credits BIGINT NOT NULL DEFAULT 0,
  total_credits BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO credit_packages (name, usd_price_cents, base_credits, bonus_credits, total_credits, is_active, sort_order)
SELECT *
FROM (
  VALUES
    ('Starter Call Credits', 500, 500, 0, 500, TRUE, 1),
    ('Standard Call Credits', 1000, 1000, 0, 1000, TRUE, 2),
    ('Power Call Credits', 2500, 2500, 0, 2500, TRUE, 3),
    ('Business Call Credits', 5000, 5000, 0, 5000, TRUE, 4),
    ('Enterprise Call Credits', 10000, 10000, 0, 10000, TRUE, 5)
) AS seed(name, usd_price_cents, base_credits, bonus_credits, total_credits, is_active, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM credit_packages existing
  WHERE existing.name = seed.name
);
