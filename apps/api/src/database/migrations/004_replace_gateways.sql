-- ============================================================
-- Migration 004: Replace Stripe and Coinbase with Paddle and NOWPayments
-- Run this BEFORE deploying the updated API code
-- ============================================================

-- Step 1: Add new gateway values to the existing enum
-- (Postgres ADD VALUE is safe to run even if value already exists)
ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'paddle';
ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'nowpayments';

-- Step 2: Rebuild the enum without 'stripe' and 'crypto'
-- Postgres cannot drop enum values directly, so we recreate the type.

-- 2a. Create the clean replacement enum
CREATE TYPE payment_gateway_v2 AS ENUM (
  'flutterwave',
  'paystack',
  'squad',
  'korapay',
  'opay',
  'paddle',
  'nowpayments'
);

-- 2b. Update payment_sessions.gateway column
ALTER TABLE payment_sessions
  ALTER COLUMN gateway DROP DEFAULT;

ALTER TABLE payment_sessions
  ALTER COLUMN gateway TYPE payment_gateway_v2
  USING (
    CASE gateway::text
      WHEN 'stripe' THEN 'paddle'::payment_gateway_v2      -- migrate old stripe rows → paddle
      WHEN 'crypto' THEN 'nowpayments'::payment_gateway_v2 -- migrate old crypto rows → nowpayments
      ELSE gateway::text::payment_gateway_v2
    END
  );

-- 2c. Update wallet_transactions.gateway column
ALTER TABLE wallet_transactions
  ALTER COLUMN gateway TYPE payment_gateway_v2
  USING (
    CASE gateway::text
      WHEN 'stripe' THEN 'paddle'::payment_gateway_v2
      WHEN 'crypto' THEN 'nowpayments'::payment_gateway_v2
      ELSE gateway::text::payment_gateway_v2
    END
  );

-- 2d. Swap type names
DROP TYPE payment_gateway;
ALTER TYPE payment_gateway_v2 RENAME TO payment_gateway;

-- Step 3: Verify (optional — uncomment to check)
-- SELECT column_name, udt_name FROM information_schema.columns
-- WHERE table_name IN ('payment_sessions', 'wallet_transactions')
-- AND column_name = 'gateway';

-- Step 4: Remove Paddle and Nowpayments config from credit_packages
-- (The `available_gateways` column is a TEXT array — update any rows
-- that referenced 'stripe' or 'crypto')
UPDATE credit_packages
SET available_gateways = array_replace(
  array_replace(available_gateways, 'stripe', 'paddle'),
  'crypto', 'nowpayments'
)
WHERE 'stripe' = ANY(available_gateways)
   OR 'crypto' = ANY(available_gateways);

-- Step 5: Confirm credit_packages still look correct
-- SELECT name, available_gateways FROM credit_packages;
