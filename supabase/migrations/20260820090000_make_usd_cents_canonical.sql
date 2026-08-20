-- Burner Point financial model: USD cents are the only internal source of truth.
-- Legacy columns are migrated only when present, then removed after backfill.

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS wallet_balance_usd_cents BIGINT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lifetime_spend_usd_cents BIGINT NOT NULL DEFAULT 0;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'wallet_balance_kobo') THEN
      UPDATE public.users
      SET wallet_balance_usd_cents = CASE WHEN wallet_balance_usd_cents = 0 THEN wallet_balance_kobo ELSE wallet_balance_usd_cents END;
      ALTER TABLE public.users DROP COLUMN wallet_balance_kobo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'lifetime_spend_kobo') THEN
      UPDATE public.users
      SET lifetime_spend_usd_cents = CASE WHEN lifetime_spend_usd_cents = 0 THEN lifetime_spend_kobo ELSE lifetime_spend_usd_cents END;
      ALTER TABLE public.users DROP COLUMN lifetime_spend_kobo;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.wallet_transactions') IS NOT NULL THEN
    ALTER TABLE public.wallet_transactions
      ADD COLUMN IF NOT EXISTS amount_usd_cents BIGINT,
      ADD COLUMN IF NOT EXISTS balance_before_usd_cents BIGINT,
      ADD COLUMN IF NOT EXISTS balance_after_usd_cents BIGINT;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'amount_kobo') THEN
      UPDATE public.wallet_transactions SET amount_usd_cents = CASE WHEN amount_usd_cents IS NULL OR amount_usd_cents = 0 THEN amount_kobo ELSE amount_usd_cents END;
      ALTER TABLE public.wallet_transactions DROP COLUMN amount_kobo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'balance_before_kobo') THEN
      UPDATE public.wallet_transactions SET balance_before_usd_cents = CASE WHEN balance_before_usd_cents IS NULL OR balance_before_usd_cents = 0 THEN balance_before_kobo ELSE balance_before_usd_cents END;
      ALTER TABLE public.wallet_transactions DROP COLUMN balance_before_kobo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'balance_after_kobo') THEN
      UPDATE public.wallet_transactions SET balance_after_usd_cents = CASE WHEN balance_after_usd_cents IS NULL OR balance_after_usd_cents = 0 THEN balance_after_kobo ELSE balance_after_usd_cents END;
      ALTER TABLE public.wallet_transactions DROP COLUMN balance_after_kobo;
    END IF;

    ALTER TABLE public.wallet_transactions
      ALTER COLUMN amount_usd_cents SET NOT NULL,
      ALTER COLUMN balance_before_usd_cents SET NOT NULL,
      ALTER COLUMN balance_after_usd_cents SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.payment_sessions') IS NOT NULL THEN
    ALTER TABLE public.payment_sessions
      ADD COLUMN IF NOT EXISTS amount_usd_cents BIGINT;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_sessions' AND column_name = 'amount_kobo') THEN
      UPDATE public.payment_sessions SET amount_usd_cents = CASE WHEN amount_usd_cents IS NULL OR amount_usd_cents = 0 THEN amount_kobo ELSE amount_usd_cents END;
      ALTER TABLE public.payment_sessions DROP COLUMN amount_kobo;
    END IF;
    UPDATE public.payment_sessions SET currency = 'USD' WHERE currency IS NULL OR currency IN ('NGN', 'USD');
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.phone_numbers') IS NOT NULL THEN
    ALTER TABLE public.phone_numbers
      ADD COLUMN IF NOT EXISTS price_usd_cents INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS renewal_price_usd_cents INTEGER NOT NULL DEFAULT 0;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'phone_numbers' AND column_name = 'price_kobo') THEN
      UPDATE public.phone_numbers SET price_usd_cents = CASE WHEN price_usd_cents = 0 THEN price_kobo ELSE price_usd_cents END;
      ALTER TABLE public.phone_numbers DROP COLUMN price_kobo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'phone_numbers' AND column_name = 'renewal_price_kobo') THEN
      UPDATE public.phone_numbers SET renewal_price_usd_cents = CASE WHEN renewal_price_usd_cents = 0 THEN renewal_price_kobo ELSE renewal_price_usd_cents END;
      ALTER TABLE public.phone_numbers DROP COLUMN renewal_price_kobo;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.wallets') IS NOT NULL
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'balance_ngn_cents') THEN
    ALTER TABLE public.wallets DROP COLUMN balance_ngn_cents;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.credit_packages') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'credit_packages' AND column_name = 'price_kobo') THEN
      UPDATE public.credit_packages SET usd_price_cents = CASE WHEN usd_price_cents = 0 THEN price_kobo ELSE usd_price_cents END;
      ALTER TABLE public.credit_packages DROP COLUMN price_kobo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'credit_packages' AND column_name = 'amount_kobo') THEN
      UPDATE public.credit_packages SET base_credits = CASE WHEN base_credits = 0 THEN amount_kobo ELSE base_credits END;
      ALTER TABLE public.credit_packages DROP COLUMN amount_kobo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'credit_packages' AND column_name = 'bonus_kobo') THEN
      UPDATE public.credit_packages SET bonus_credits = CASE WHEN bonus_credits = 0 THEN bonus_kobo ELSE bonus_credits END;
      ALTER TABLE public.credit_packages DROP COLUMN bonus_kobo;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.subscription_plans') IS NOT NULL
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'price_ngn_cents') THEN
    ALTER TABLE public.subscription_plans DROP COLUMN price_ngn_cents;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price_ngn_cents') THEN
    ALTER TABLE public.products DROP COLUMN price_ngn_cents;
  END IF;
END $$;
