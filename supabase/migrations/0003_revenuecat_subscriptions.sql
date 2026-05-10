-- =============================================
-- Burner Point - RevenueCat Subscription Schema
-- =============================================
-- Store-managed mobile subscriptions and synced entitlements.
-- All user-owned rows link to auth.users through public.users.id.
-- =============================================

DO $$
BEGIN
  CREATE TYPE public.subscription_provider AS ENUM ('revenuecat');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'trialing',
    'canceled',
    'expired',
    'billing_issue',
    'paused',
    'transferred',
    'unknown'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider public.subscription_provider NOT NULL DEFAULT 'revenuecat',
  provider_customer_id TEXT NOT NULL,
  provider_reference TEXT,
  provider_event_id TEXT,
  original_app_user_id TEXT,
  product_id TEXT,
  offering_id TEXT,
  store TEXT,
  environment TEXT,
  status public.subscription_status NOT NULL DEFAULT 'unknown',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  will_renew BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  renews_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer
  ON public.subscriptions(provider_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_reference
  ON public.subscriptions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_provider_product
  ON public.subscriptions(user_id, provider, product_id);

CREATE TABLE IF NOT EXISTS public.subscription_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  provider public.subscription_provider NOT NULL DEFAULT 'revenuecat',
  identifier TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  product_id TEXT,
  offering_id TEXT,
  store TEXT,
  environment TEXT,
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_event_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_entitlements_user_identifier_unique UNIQUE (user_id, identifier)
);

CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_user_id
  ON public.subscription_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_subscription_id
  ON public.subscription_entitlements(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_entitlements_user_identifier
  ON public.subscription_entitlements(user_id, identifier);

CREATE TABLE IF NOT EXISTS public.revenuecat_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  api_version TEXT,
  app_user_id TEXT,
  original_app_user_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  environment TEXT,
  store TEXT,
  authorization_verified BOOLEAN NOT NULL DEFAULT FALSE,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  occurred_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_event_id
  ON public.revenuecat_events(event_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_app_user
  ON public.revenuecat_events(app_user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_user
  ON public.revenuecat_events(user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_processed
  ON public.revenuecat_events(processed, occurred_at DESC);

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_subscription_entitlements
  BEFORE UPDATE ON public.subscription_entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_revenuecat_events
  BEFORE UPDATE ON public.revenuecat_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own synced subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to synced subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Users can view own synced entitlements"
  ON public.subscription_entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to synced entitlements"
  ON public.subscription_entitlements
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Service role has full access to revenuecat events"
  ON public.revenuecat_events
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());
