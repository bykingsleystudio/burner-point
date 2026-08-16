-- ================================================================
-- Legacy remote schema snapshot intentionally neutralized.
-- ================================================================
-- This file is kept as a strict no-op safety guard. It must never contain
-- destructive DDL, wallet/credit table drops, or policy revocations for the
-- financial ledger.
--
-- Canonical source of truth:
--   - supabase/migrations/0005_wallet_balance_and_call_credits.sql
--   - supabase/migrations/0007_production_schema_reconciliation.sql
--   - apps/api/src/database/entities/financial-ledger.entity.ts
--
-- Production rule:
--   - only create missing ledger tables if they are absent;
--   - never remove or alter the canonical wallet/credit ledger in a migration.
--
-- A clean database will be reconciled by the numbered migration chain above.
-- Existing production databases may also be reconciled idempotently.
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE 'Legacy remote schema snapshot neutralized: no destructive ledger operations applied.';
END $$;

CREATE TABLE IF NOT EXISTS public.wallet_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_usd_cents BIGINT NOT NULL,
  reason TEXT NOT NULL,
  related_product TEXT,
  related_entity_id TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.credit_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credits_amount BIGINT NOT NULL,
  reason TEXT NOT NULL,
  related_product TEXT,
  related_entity_id TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
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

CREATE INDEX IF NOT EXISTS idx_credit_locks_user_id
  ON public.credit_locks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_locks_status
  ON public.credit_locks(status, expires_at);
