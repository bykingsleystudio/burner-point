-- Burner Point canonical production schema reconciliation.
--
-- This migration is intentionally additive. It preserves legacy columns and
-- backfills canonical USD-cent and snake_case fields before constraints are
-- enforced. TypeORM maps this schema but does not own or execute migrations.

-- ---------------------------------------------------------------------------
-- Core telecom records: canonical field names and lifecycle metadata.
-- ---------------------------------------------------------------------------
ALTER TABLE public.phone_numbers
  ADD COLUMN IF NOT EXISTS friendly_name TEXT,
  ADD COLUMN IF NOT EXISTS area_code TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'burner',
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_renew_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_usd_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renewal_price_usd_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sms_received INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sms_sent INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calls_received INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forwarding_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

UPDATE public.phone_numbers
SET price_usd_cents = COALESCE(monthly_price_usd_cents, 0)
WHERE price_usd_cents = 0
  AND monthly_price_usd_cents IS NOT NULL;

ALTER TABLE public.phone_numbers
  DROP CONSTRAINT IF EXISTS phone_numbers_status_check;
ALTER TABLE public.phone_numbers
  ADD CONSTRAINT phone_numbers_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'released')) NOT VALID;

ALTER TABLE public.phone_numbers
  DROP CONSTRAINT IF EXISTS phone_numbers_type_check;
ALTER TABLE public.phone_numbers
  ADD CONSTRAINT phone_numbers_type_check
  CHECK (type IN ('burner', 'rental', 'verification', 'enterprise')) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_phone_numbers_workspace_id
  ON public.phone_numbers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_provider_capability
  ON public.phone_numbers(provider, status);

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wallet_balance_usd_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resource TEXT,
  ADD COLUMN IF NOT EXISTS old_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS new_value JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON public.audit_logs(workspace_id, created_at DESC);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS contact_id UUID,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS num_segments INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_classification TEXT,
  ADD COLUMN IF NOT EXISTS extracted_otp TEXT,
  ADD COLUMN IF NOT EXISTS spam_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_type_check
  CHECK (type IN ('sms', 'mms')) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_message_unique
  ON public.messages(provider, provider_message_id)
  WHERE provider IS NOT NULL AND provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_owner_thread
  ON public.messages(user_id, phone_number_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(user_id, phone_number_id, created_at DESC)
  WHERE direction = 'inbound' AND read_at IS NULL;

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS billable_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_locked BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_spent BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS destination_country TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS voicemail_url TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_user_idempotency_key
  ON public.calls(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_provider_call_unique
  ON public.calls(provider, provider_call_id)
  WHERE provider IS NOT NULL AND provider_call_id IS NOT NULL;

-- The primary phone-auth path delegates the code check to a provider, so a
-- local OTP hash is optional. Existing hashes are retained untouched.
ALTER TABLE public.phone_otp_sessions
  ALTER COLUMN otp_code_hash DROP NOT NULL;
ALTER TABLE public.phone_otp_sessions
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS verification_sid TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT;
UPDATE public.phone_otp_sessions
SET verification_sid = provider_session_id
WHERE verification_sid IS NULL AND provider_session_id IS NOT NULL;
UPDATE public.phone_otp_sessions
SET status = 'approved'
WHERE status = 'verified';
ALTER TABLE public.phone_otp_sessions
  DROP CONSTRAINT IF EXISTS phone_otp_sessions_status_check;
ALTER TABLE public.phone_otp_sessions
  ADD CONSTRAINT phone_otp_sessions_status_check
  CHECK (status IN ('pending', 'approved', 'expired', 'failed')) NOT VALID;

-- ---------------------------------------------------------------------------
-- Canonical financial vocabulary. Values are integer USD cents, never kobo.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wallet_balance_usd_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_spend_usd_cents BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS amount_usd_cents BIGINT,
  ADD COLUMN IF NOT EXISTS balance_before_usd_cents BIGINT,
  ADD COLUMN IF NOT EXISTS balance_after_usd_cents BIGINT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'amount_kobo'
  ) THEN
    EXECUTE 'UPDATE public.wallet_transactions SET amount_usd_cents = COALESCE(amount_usd_cents, amount_kobo) WHERE amount_usd_cents IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'balance_before_kobo'
  ) THEN
    EXECUTE 'UPDATE public.wallet_transactions SET balance_before_usd_cents = COALESCE(balance_before_usd_cents, balance_before_kobo) WHERE balance_before_usd_cents IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'balance_after_kobo'
  ) THEN
    EXECUTE 'UPDATE public.wallet_transactions SET balance_after_usd_cents = COALESCE(balance_after_usd_cents, balance_after_kobo) WHERE balance_after_usd_cents IS NULL';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_idempotency_key
  ON public.wallet_transactions(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Messaging contacts and the real BP Verify Hub order lifecycle.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contacts_user_phone_unique UNIQUE (user_id, phone_number)
);

ALTER TABLE public.messages
  ADD CONSTRAINT messages_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL NOT VALID;

CREATE INDEX IF NOT EXISTS idx_contacts_user_id
  ON public.contacts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.verification_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}'::text[],
  supported_providers TEXT[] NOT NULL DEFAULT '{}'::text[],
  base_price_usd_cents BIGINT NOT NULL CHECK (base_price_usd_cents >= 0),
  margin_usd_cents BIGINT NOT NULL DEFAULT 0 CHECK (margin_usd_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.verification_services(id) ON DELETE RESTRICT,
  phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_order_id TEXT,
  country_code TEXT NOT NULL,
  phone_number TEXT,
  price_usd_cents BIGINT NOT NULL CHECK (price_usd_cents >= 0),
  wallet_lock_id UUID REFERENCES public.wallet_locks(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  otp_code TEXT,
  failure_reason TEXT,
  idempotency_key TEXT,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verification_orders_status_check CHECK (status IN (
    'pending', 'provisioning', 'active', 'waiting_for_code', 'code_received',
    'completed', 'cancelled', 'expired', 'failed', 'refunded'
  )),
  CONSTRAINT verification_orders_user_idempotency_unique UNIQUE (user_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_orders_provider_order
  ON public.verification_orders(provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_orders_user_status
  ON public.verification_orders(user_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Durable first-party connectivity orders. Credential material is stored only
-- in encrypted columns; no plaintext provider secret belongs in these rows.
-- ---------------------------------------------------------------------------
ALTER TABLE public.esim_orders
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS activation_data_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_esim_orders_provider_order
  ON public.esim_orders(provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_esim_orders_user_idempotency
  ON public.esim_orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.proxy_orders
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS credentials_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS renewal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_proxy_orders_provider_order
  ON public.proxy_orders(provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_proxy_orders_user_idempotency
  ON public.proxy_orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.vpn_sessions
  ADD COLUMN IF NOT EXISTS provider_session_id TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT,
  ADD COLUMN IF NOT EXISTS server_id TEXT,
  ADD COLUMN IF NOT EXISTS config_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS private_key_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vpn_sessions_provider_session
  ON public.vpn_sessions(provider, provider_session_id)
  WHERE provider_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vpn_sessions_user_idempotency
  ON public.vpn_sessions(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Developer webhook delivery is persistent, signed, and independently retryable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.developer_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES public.developer_webhooks(id) ON DELETE CASCADE,
  event_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'disabled')),
  response_status INTEGER,
  response_body TEXT,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT developer_webhook_deliveries_webhook_idempotency_unique UNIQUE (webhook_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_developer_webhook_deliveries_pending
  ON public.developer_webhook_deliveries(status, next_attempt_at)
  WHERE status = 'pending';

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scopes JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rate_limit JSONB NOT NULL DEFAULT '{}'::jsonb;
UPDATE public.api_keys
SET scopes = permissions
WHERE scopes = '["read"]'::jsonb
  AND permissions IS NOT NULL
  AND jsonb_typeof(permissions) = 'array';
UPDATE public.api_keys
SET is_active = NOT COALESCE(revoked, FALSE)
WHERE revoked IS NOT NULL;

ALTER TABLE public.developer_webhooks
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Webhook endpoint',
  ADD COLUMN IF NOT EXISTS signing_secret TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS delivery_success_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_at TIMESTAMPTZ;
UPDATE public.developer_webhooks
SET signing_secret = secret
WHERE signing_secret IS NULL AND secret IS NOT NULL;
UPDATE public.developer_webhooks
SET is_active = active
WHERE active IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS and timestamp maintenance for new user-owned tables.
-- ---------------------------------------------------------------------------
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role has full access to contacts" ON public.contacts;
CREATE POLICY "Service role has full access to contacts" ON public.contacts
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Anyone can view active verification services" ON public.verification_services;
CREATE POLICY "Anyone can view active verification services" ON public.verification_services
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Service role has full access to verification services" ON public.verification_services;
CREATE POLICY "Service role has full access to verification services" ON public.verification_services
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Users can view own verification orders" ON public.verification_orders;
CREATE POLICY "Users can view own verification orders" ON public.verification_orders
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role has full access to verification orders" ON public.verification_orders;
CREATE POLICY "Service role has full access to verification orders" ON public.verification_orders
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Service role has full access to developer webhook deliveries" ON public.developer_webhook_deliveries;
CREATE POLICY "Service role has full access to developer webhook deliveries" ON public.developer_webhook_deliveries
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

DROP TRIGGER IF EXISTS set_updated_at_contacts ON public.contacts;
CREATE TRIGGER set_updated_at_contacts BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_verification_services ON public.verification_services;
CREATE TRIGGER set_updated_at_verification_services BEFORE UPDATE ON public.verification_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_verification_orders ON public.verification_orders;
CREATE TRIGGER set_updated_at_verification_orders BEFORE UPDATE ON public.verification_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_developer_webhook_deliveries ON public.developer_webhook_deliveries;
CREATE TRIGGER set_updated_at_developer_webhook_deliveries BEFORE UPDATE ON public.developer_webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
