-- ============================================================
-- Burner Point - Wallet Direct Charging + Messenger Call Credits
-- ============================================================
-- Final billing model:
--   Subscriptions = access
--   Wallet = direct product purchases
--   Call Credits = BP Messenger international calling only

-- ------------------------------------------------------------
-- Wallet transaction enum expansion
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'deposit';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'product_purchase';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'product_refund';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'wallet_lock';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'wallet_release';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'call_credit_purchase';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'esim_purchase';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'proxy_purchase';
    ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'vpn_purchase';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transactions_type_enum') THEN
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'deposit';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'product_purchase';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'product_refund';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'wallet_lock';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'wallet_release';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'call_credit_purchase';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'esim_purchase';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'proxy_purchase';
    ALTER TYPE public.wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'vpn_purchase';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Wallet source of truth
-- ------------------------------------------------------------
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS locked_balance_usd_cents BIGINT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wallets_locked_balance_usd_non_negative'
  ) THEN
    ALTER TABLE public.wallets
      ADD CONSTRAINT wallets_locked_balance_usd_non_negative CHECK (locked_balance_usd_cents >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_lock_status') THEN
    CREATE TYPE public.wallet_lock_status AS ENUM ('active', 'spent', 'released', 'expired', 'canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.wallet_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_usd_cents BIGINT NOT NULL,
  reason TEXT NOT NULL,
  related_product TEXT,
  related_entity_id TEXT,
  expires_at TIMESTAMPTZ,
  status public.wallet_lock_status NOT NULL DEFAULT 'active',
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_locks_user_id
  ON public.wallet_locks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_locks_status
  ON public.wallet_locks(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_wallet_locks_related_product
  ON public.wallet_locks(related_product, related_entity_id);

-- ------------------------------------------------------------
-- Call credit compatibility ledger
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
    CREATE TYPE public.credit_transaction_type AS ENUM ('purchase', 'spend', 'refund', 'lock', 'release', 'adjustment', 'bonus', 'expiration');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_status') THEN
    CREATE TYPE public.credit_transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_lock_status') THEN
    CREATE TYPE public.credit_lock_status AS ENUM ('active', 'spent', 'released', 'expired', 'canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.credit_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  credit_balance BIGINT NOT NULL DEFAULT 0,
  locked_credit_balance BIGINT NOT NULL DEFAULT 0,
  lifetime_credits_purchased BIGINT NOT NULL DEFAULT 0,
  lifetime_credits_spent BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.credit_transaction_type NOT NULL,
  credits_amount BIGINT NOT NULL,
  usd_value_cents BIGINT NOT NULL DEFAULT 0,
  related_product TEXT,
  related_entity_id TEXT,
  description TEXT,
  status public.credit_transaction_status NOT NULL DEFAULT 'completed',
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
  ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_related_product
  ON public.credit_transactions(related_product, created_at DESC);

CREATE TABLE IF NOT EXISTS public.credit_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credits_amount BIGINT NOT NULL,
  reason TEXT NOT NULL,
  related_product TEXT,
  related_entity_id TEXT,
  expires_at TIMESTAMPTZ,
  status public.credit_lock_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credit_locks_user_id
  ON public.credit_locks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_locks_status
  ON public.credit_locks(status, expires_at);

CREATE TABLE IF NOT EXISTS public.credit_pricing_rules (
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
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_pricing_rules_lookup
  ON public.credit_pricing_rules(product, country_code, provider, service_code);

CREATE TABLE IF NOT EXISTS public.credit_pricing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  product TEXT NOT NULL,
  country_code TEXT,
  provider TEXT,
  service_code TEXT,
  related_entity_id TEXT,
  quote_request JSONB NOT NULL DEFAULT '{}'::jsonb,
  quote_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_pricing_logs_product
  ON public.credit_pricing_logs(product, created_at DESC);

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  usd_price_cents BIGINT NOT NULL DEFAULT 0,
  base_credits BIGINT NOT NULL DEFAULT 0,
  bonus_credits BIGINT NOT NULL DEFAULT 0,
  total_credits BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_packages ADD COLUMN IF NOT EXISTS usd_price_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.credit_packages ADD COLUMN IF NOT EXISTS base_credits BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.credit_packages ADD COLUMN IF NOT EXISTS bonus_credits BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.credit_packages ADD COLUMN IF NOT EXISTS total_credits BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.credit_packages ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.credit_packages
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Reconcile legacy credit_packages columns from 0001.
-- The table already exists from 0001, so its NOT NULL legacy
-- columns must be populated before inserting new package rows.
UPDATE public.credit_packages
SET
  usd_price_cents = COALESCE(usd_price_cents, price_usd_cents, 0),
  base_credits = COALESCE(base_credits, credits, 0),
  total_credits = COALESCE(total_credits, base_credits, credits, 0),
  bonus_credits = COALESCE(bonus_credits, 0),
  is_active = COALESCE(is_active, TRUE),
  sort_order = COALESCE(sort_order, 0)
WHERE usd_price_cents IS NULL
   OR base_credits IS NULL
   OR total_credits IS NULL
   OR is_active IS NULL
   OR sort_order IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_packages' AND column_name = 'price_kobo'
  ) THEN
    UPDATE public.credit_packages
    SET usd_price_cents = CASE WHEN usd_price_cents = 0 THEN COALESCE(price_kobo, 0) ELSE usd_price_cents END
    WHERE usd_price_cents = 0;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_packages' AND column_name = 'amount_kobo'
  ) THEN
    UPDATE public.credit_packages
    SET base_credits = CASE WHEN base_credits = 0 THEN COALESCE(amount_kobo, 0) ELSE base_credits END
    WHERE base_credits = 0;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_packages' AND column_name = 'bonus_kobo'
  ) THEN
    UPDATE public.credit_packages
    SET bonus_credits = CASE WHEN bonus_credits = 0 THEN COALESCE(bonus_kobo, 0) ELSE bonus_credits END
    WHERE bonus_credits = 0;
  END IF;
END $$;

UPDATE public.credit_packages
SET total_credits = COALESCE(base_credits, 0) + COALESCE(bonus_credits, 0)
WHERE total_credits = 0;

INSERT INTO public.credit_packages (
  name,
  description,
  credits,
  price_usd_cents,
  price_ngn_cents,
  bonus_percentage,
  metadata,
  usd_price_cents,
  base_credits,
  bonus_credits,
  total_credits,
  is_active,
  sort_order
)
SELECT
  seed.name,
  seed.name,
  seed.total_credits,
  seed.usd_price_cents,
  NULL,
  0,
  '{}'::jsonb,
  seed.usd_price_cents,
  seed.base_credits,
  seed.bonus_credits,
  seed.total_credits,
  seed.is_active,
  seed.sort_order
FROM (
  VALUES
    ('Starter Call Credits', 500, 500, 0, 500, TRUE, 1),
    ('Standard Call Credits', 1000, 1000, 0, 1000, TRUE, 2),
    ('Power Call Credits', 2500, 2500, 0, 2500, TRUE, 3),
    ('Business Call Credits', 5000, 5000, 0, 5000, TRUE, 4),
    ('Enterprise Call Credits', 10000, 10000, 0, 10000, TRUE, 5)
) AS seed(
  name,
  usd_price_cents,
  base_credits,
  bonus_credits,
  total_credits,
  is_active,
  sort_order
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.credit_packages existing
  WHERE existing.name = seed.name
);

-- Transitional compatibility views with call-credit naming.
CREATE OR REPLACE VIEW public.call_credit_accounts AS
SELECT
  id,
  user_id,
  credit_balance AS balance,
  locked_credit_balance AS locked_balance,
  lifetime_credits_purchased AS lifetime_purchased,
  lifetime_credits_spent AS lifetime_spent,
  created_at,
  updated_at
FROM public.credit_accounts;

CREATE OR REPLACE VIEW public.call_credit_transactions AS
SELECT
  id,
  user_id,
  type,
  credits_amount AS amount,
  usd_value_cents,
  COALESCE(metadata->>'callId', related_entity_id) AS call_id,
  metadata->>'destinationCountry' AS destination_country,
  provider,
  description,
  status,
  idempotency_key,
  metadata,
  created_at
FROM (
  SELECT
    ct.*,
    COALESCE(ct.metadata->>'provider', ct.metadata->>'carrier') AS provider
  FROM public.credit_transactions ct
) call_tx;

CREATE OR REPLACE VIEW public.call_credit_locks AS
SELECT
  id,
  user_id,
  credits_amount AS amount,
  COALESCE(metadata->>'callId', related_entity_id) AS call_id,
  expires_at,
  status,
  metadata,
  created_at,
  released_at
FROM public.credit_locks;

CREATE OR REPLACE VIEW public.call_credit_rates AS
SELECT
  id,
  country_code AS destination_country,
  metadata->>'destinationPrefix' AS destination_prefix,
  provider,
  GREATEST(
    1,
    CEIL(provider_cost_usd_cents + platform_margin_usd_cents + risk_margin_usd_cents)
  )::BIGINT AS credits_per_minute,
  provider_cost_usd_cents AS usd_cost_per_minute_cents,
  COALESCE(NULLIF(metadata->>'marginPercent', ''), '0')::NUMERIC AS margin_percent,
  is_active,
  created_at,
  updated_at
FROM public.credit_pricing_rules
WHERE product = 'messenger_calls';

-- ------------------------------------------------------------
-- RLS hardening
-- ------------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
  ON public.wallets
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to wallets" ON public.wallets;
CREATE POLICY "Service role has full access to wallets"
  ON public.wallets
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Users can view own wallet locks"
  ON public.wallet_locks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to wallet locks"
  ON public.wallet_locks
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Service role has full access to wallet transactions"
  ON public.wallet_transactions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Users can view own credit account" ON public.credit_accounts;
CREATE POLICY "Users can view own credit account"
  ON public.credit_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to credit accounts" ON public.credit_accounts;
CREATE POLICY "Service role has full access to credit accounts"
  ON public.credit_accounts
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to credit transactions" ON public.credit_transactions;
CREATE POLICY "Service role has full access to credit transactions"
  ON public.credit_transactions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Users can view own credit locks" ON public.credit_locks;
CREATE POLICY "Users can view own credit locks"
  ON public.credit_locks
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to credit locks" ON public.credit_locks;
CREATE POLICY "Service role has full access to credit locks"
  ON public.credit_locks
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());
