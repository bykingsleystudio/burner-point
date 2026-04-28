-- ============================================================
-- Migration 008: Convert wallet + pricing minor units to USD cents
--
-- Burner Point production requirement:
-- - Wallet balance is stored in USD (minor units: cents).
-- - Local currency conversion is display-only.
--
-- Historical schema uses *_kobo column names. This migration converts
-- existing values IN PLACE to represent USD cents instead of NGN kobo.
--
-- IMPORTANT:
-- - This uses a fixed conversion rate of 1600 NGN per 1 USD.
-- - If you need a different baseline rate, adjust FX_RATE_NGN_PER_USD
--   before applying the migration in production.
-- ============================================================

DO $$
DECLARE
  FX_RATE_NGN_PER_USD numeric := 1600;
BEGIN
  -- Users wallet + lifetime spend
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='wallet_balance_kobo') THEN
    UPDATE users
      SET wallet_balance_kobo = ROUND(((wallet_balance_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE wallet_balance_kobo IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lifetime_spend_kobo') THEN
    UPDATE users
      SET lifetime_spend_kobo = ROUND(((lifetime_spend_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE lifetime_spend_kobo IS NOT NULL;
  END IF;

  -- Wallet transactions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='amount_kobo') THEN
    UPDATE wallet_transactions
      SET amount_kobo = ROUND(((amount_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE amount_kobo IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='balance_before_kobo') THEN
    UPDATE wallet_transactions
      SET balance_before_kobo = ROUND(((balance_before_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE balance_before_kobo IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='balance_after_kobo') THEN
    UPDATE wallet_transactions
      SET balance_after_kobo = ROUND(((balance_after_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE balance_after_kobo IS NOT NULL;
  END IF;

  -- Credit packages (amount/bonus/price)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='credit_packages') THEN
    UPDATE credit_packages
      SET amount_kobo = ROUND(((amount_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE amount_kobo IS NOT NULL;

    UPDATE credit_packages
      SET bonus_kobo = ROUND(((bonus_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE bonus_kobo IS NOT NULL;

    UPDATE credit_packages
      SET price_kobo = ROUND(((price_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE price_kobo IS NOT NULL;
  END IF;

  -- Subscription plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='subscription_plans') THEN
    UPDATE subscription_plans
      SET price_kobo_monthly = ROUND(((price_kobo_monthly::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE price_kobo_monthly IS NOT NULL;

    UPDATE subscription_plans
      SET price_kobo_yearly = ROUND(((price_kobo_yearly::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::bigint
      WHERE price_kobo_yearly IS NOT NULL;
  END IF;

  -- Number pricing (if present)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='number_pricing') THEN
    UPDATE number_pricing
      SET setup_price_kobo = ROUND(((setup_price_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::int
      WHERE setup_price_kobo IS NOT NULL;

    UPDATE number_pricing
      SET monthly_price_kobo = ROUND(((monthly_price_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::int
      WHERE monthly_price_kobo IS NOT NULL;

    UPDATE number_pricing
      SET sms_price_kobo = ROUND(((sms_price_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::int
      WHERE sms_price_kobo IS NOT NULL;

    UPDATE number_pricing
      SET call_price_per_min_kobo = ROUND(((call_price_per_min_kobo::numeric / 100) / FX_RATE_NGN_PER_USD) * 100)::int
      WHERE call_price_per_min_kobo IS NOT NULL;
  END IF;
END $$;

