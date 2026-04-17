-- ============================================================
-- Migration 006: Payment fulfillment architecture
-- Adds reconciliation metadata and a subscription transaction type.
-- ============================================================

ALTER TYPE transaction_type
  ADD VALUE IF NOT EXISTS 'subscription_purchase';

ALTER TYPE number_provider
  ADD VALUE IF NOT EXISTS 'bandwidth';

ALTER TYPE number_provider
  ADD VALUE IF NOT EXISTS 'vonage';

ALTER TYPE number_provider
  ADD VALUE IF NOT EXISTS 'infobip';

ALTER TYPE number_provider
  ADD VALUE IF NOT EXISTS 'plivo';

ALTER TYPE number_provider
  ADD VALUE IF NOT EXISTS 'termii';

ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_payment_sessions_gateway_reference
  ON payment_sessions(gateway_reference);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_metadata_payment_type
  ON payment_sessions((metadata ->> 'paymentType'));

INSERT INTO subscription_plans (
  slug,
  name,
  description,
  price_kobo_monthly,
  price_kobo_yearly,
  features,
  sort_order
) VALUES (
  'privacy-monthly',
  'Privacy Monthly',
  'Renewable Burner Point access for private communication, verification continuity, rentals, and account recovery.',
  2558400,
  28142400,
  '{"numbers":3,"renewable_rentals":true,"verification_priority":true,"api_access":true,"conversation_us_ca":true}',
  2
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_kobo_monthly = EXCLUDED.price_kobo_monthly,
  price_kobo_yearly = EXCLUDED.price_kobo_yearly,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
