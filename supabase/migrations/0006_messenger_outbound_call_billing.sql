ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS billable_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_locked INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_spent INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS destination_country TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calls'
      AND column_name = 'provider_call_sid'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calls'
      AND column_name = 'provider_call_id'
  ) THEN
    ALTER TABLE public.calls RENAME COLUMN provider_call_sid TO provider_call_id;
  END IF;
END $$;

ALTER TABLE public.calls
  DROP CONSTRAINT IF EXISTS calls_status_check;

ALTER TABLE public.calls
  ADD CONSTRAINT calls_status_check CHECK (
    status IN ('initiated', 'ringing', 'answered', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled')
  );

CREATE INDEX IF NOT EXISTS idx_calls_provider_call_id ON public.calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_idempotency_key ON public.calls(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
