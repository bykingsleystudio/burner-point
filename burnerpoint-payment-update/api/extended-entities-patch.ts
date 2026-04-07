/**
 * PATCH FILE — extended-entities.ts
 *
 * CHANGE ONLY: The PaymentGateway enum.
 * Replace the existing enum block (search for "export enum PaymentGateway")
 * with the block below. Everything else in extended-entities.ts stays identical.
 *
 * BEFORE (remove this):
 *   export enum PaymentGateway {
 *     STRIPE = 'stripe',
 *     PAYSTACK = 'paystack',
 *     FLUTTERWAVE = 'flutterwave',
 *     SQUAD = 'squad',
 *     OPAY = 'opay',
 *     KORAPAY = 'korapay',
 *     CRYPTO = 'crypto'
 *   }
 *
 * AFTER (replace with this):
 */
export enum PaymentGateway {
  // Nigerian gateways — priority order 1-5
  FLUTTERWAVE = 'flutterwave',
  PAYSTACK    = 'paystack',
  SQUAD       = 'squad',
  KORAPAY     = 'korapay',
  OPAY        = 'opay',
  // International gateways — priority order 6-7
  PADDLE      = 'paddle',
  NOWPAYMENTS = 'nowpayments',
}

/**
 * DATABASE MIGRATION NOTE:
 * The payment_sessions and wallet_transactions tables have a `gateway` column
 * typed as the PostgreSQL enum `payment_gateway`. You must run this SQL after
 * deploying so existing rows don't break and new values are accepted:
 *
 *   -- Add new values to the Postgres enum type
 *   ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'paddle';
 *   ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'nowpayments';
 *
 *   -- Remove old values (Postgres does not support DROP VALUE directly —
 *   -- safest approach is to keep old values in the DB type so old rows
 *   -- stay intact, but remove them from the TS enum so no new rows use them)
 *   -- If you need to drop them entirely, you must recreate the enum type:
 *
 *   -- Step 1: Create new enum without old values
 *   CREATE TYPE payment_gateway_new AS ENUM (
 *     'flutterwave','paystack','squad','korapay','opay','paddle','nowpayments'
 *   );
 *   -- Step 2: Update columns to use new type
 *   ALTER TABLE payment_sessions
 *     ALTER COLUMN gateway TYPE payment_gateway_new
 *     USING gateway::text::payment_gateway_new;
 *   ALTER TABLE wallet_transactions
 *     ALTER COLUMN gateway TYPE payment_gateway_new
 *     USING gateway::text::payment_gateway_new;
 *   -- Step 3: Swap type names
 *   DROP TYPE payment_gateway;
 *   ALTER TYPE payment_gateway_new RENAME TO payment_gateway;
 *
 * Run this in migration 004 (create file: 004_replace_gateways.sql)
 */
