-- =============================================
-- Burner Point - Billing Architecture Alignment
-- =============================================
-- Adds Paddle event persistence, payment transaction records,
-- wallet-backed rental records, and multi-provider entitlement support.

DO $$
BEGIN
  ALTER TYPE public.subscription_provider ADD VALUE IF NOT EXISTS 'paddle';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'grace_period';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'subscription_entitlements'
      AND constraint_name = 'subscription_entitlements_user_identifier_unique'
  ) THEN
    ALTER TABLE public.subscription_entitlements
      DROP CONSTRAINT subscription_entitlements_user_identifier_unique;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_entitlements_user_provider_identifier
  ON public.subscription_entitlements(user_id, provider, identifier);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT NOT NULL UNIQUE,
  gateway_reference TEXT,
  amount_usd_cents INTEGER,
  charge_amount_minor INTEGER NOT NULL,
  charge_currency TEXT NOT NULL DEFAULT 'USD',
  checkout_url TEXT,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_response JSONB,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
  ON public.payment_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference
  ON public.payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
  ON public.payment_transactions(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.paddle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  transaction_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  provider_customer_id TEXT,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  occurred_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paddle_events_user_id
  ON public.paddle_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paddle_events_processed
  ON public.paddle_events(processed, created_at DESC);

CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  provider TEXT,
  country_code TEXT,
  rental_type TEXT NOT NULL DEFAULT 'rental',
  duration_days INTEGER NOT NULL DEFAULT 30,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  price_usd_cents INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rentals_user_id
  ON public.rentals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rentals_status
  ON public.rentals(status, ends_at);

CREATE OR REPLACE VIEW public.numbers AS
SELECT
  pn.id,
  pn.user_id,
  pn.assigned_to_user_id,
  pn.phone_number,
  pn.country_code,
  pn.provider,
  pn.status,
  pn.capabilities,
  pn.monthly_price_usd_cents AS price_usd_cents,
  pn.purchased_at,
  pn.expires_at,
  pn.metadata,
  pn.created_at,
  pn.updated_at
FROM public.phone_numbers pn;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wallets_balance_usd_non_negative'
  ) THEN
    ALTER TABLE public.wallets
      ADD CONSTRAINT wallets_balance_usd_non_negative CHECK (balance_usd_cents >= 0);
  END IF;
END $$;

CREATE TRIGGER set_updated_at_payment_transactions
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_paddle_events
  BEFORE UPDATE ON public.paddle_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_rentals
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paddle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to payment transactions"
  ON public.payment_transactions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Users can view own rentals"
  ON public.rentals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rentals"
  ON public.rentals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rentals"
  ON public.rentals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to rentals"
  ON public.rentals
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Service role has full access to paddle events"
  ON public.paddle_events
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());
