DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status') THEN
    ALTER TYPE call_status ADD VALUE IF NOT EXISTS 'answered';
    ALTER TYPE call_status ADD VALUE IF NOT EXISTS 'canceled';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calls'
      AND column_name = 'provider_call_sid'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calls'
      AND column_name = 'provider_call_id'
  ) THEN
    ALTER TABLE calls RENAME COLUMN provider_call_sid TO provider_call_id;
  END IF;
END $$;

ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS provider VARCHAR(40),
  ADD COLUMN IF NOT EXISTS billable_seconds INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_locked INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_spent INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS destination_country VARCHAR(8),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(180),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_calls_provider_call_id ON calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_idempotency_key ON calls(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
