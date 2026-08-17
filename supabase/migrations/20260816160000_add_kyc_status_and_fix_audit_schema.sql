-- ============================================================
-- Burner Point - KYC Status and Audit Schema Fix
-- ============================================================
-- This migration:
-- 1. Adds kyc_status enum type and column to users table
-- 2. Ensures audit_logs and abuse_events have proper user_id FK
-- 3. Adds missing columns detected by TypeORM entity mismatch
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Create KYC Status Enum Type
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Create the enum type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    CREATE TYPE public.kyc_status AS ENUM ('none', 'pending', 'verified', 'rejected');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Add kyc_status Column to Users Table
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status NOT NULL DEFAULT 'none';

-- ─────────────────────────────────────────────────────────────
-- 3. Ensure Audit Logs Has Proper Schema
-- ─────────────────────────────────────────────────────────────

-- Only add columns that are absent in the live production schema.
-- Do not alter existing UUID columns because their type is already correct
-- and Postgres will reject the change when an RLS policy depends on the column.
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resource TEXT,
  ADD COLUMN IF NOT EXISTS old_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS new_value JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON public.audit_logs(workspace_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 4. Ensure Abuse Events Has Proper Schema
-- ─────────────────────────────────────────────────────────────

-- Only add columns that are missing. The live schema already has user_id as UUID
-- and changing it would trigger policy dependency errors.
ALTER TABLE public.abuse_events
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- 5. Ensure Wallet Transactions Has user_id Properly Mapped
-- ─────────────────────────────────────────────────────────────

-- Wallet transactions should already have user_id from extended entities.
-- Only add the foreign key if it is missing so we do not recreate an existing constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wallet_transactions_user_id_fkey'
      AND conrelid = 'public.wallet_transactions'::regclass
  ) THEN
    ALTER TABLE public.wallet_transactions
      ADD CONSTRAINT wallet_transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. Verify Users Table Has All Expected Columns
-- ─────────────────────────────────────────────────────────────

-- These columns should exist from earlier migrations, but we verify/add if missing
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wallet_balance_kobo BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_spend_kobo BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
  ADD COLUMN IF NOT EXISTS google_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_id TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS trusted_devices JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Ensure email column was properly modified by auth_identity_model_v2 migration
-- (it should be nullable)
ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

COMMIT;
