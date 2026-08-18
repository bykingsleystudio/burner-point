-- Reconcile production columns required by the TypeORM auth, audit, and phone entities.
-- This migration is additive and preserves the legacy snake_case audit value column.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(255);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS "oldValue" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Preserve existing audit payloads when the legacy migration created old_value.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'old_value'
  ) THEN
    UPDATE public.audit_logs
    SET "oldValue" = old_value
    WHERE "oldValue" = '{}'::jsonb
      AND old_value IS NOT NULL;
  END IF;
END $$;

ALTER TABLE public.phone_numbers
  ADD COLUMN IF NOT EXISTS price_kobo INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renewal_price_kobo INTEGER NOT NULL DEFAULT 0;

COMMIT;
