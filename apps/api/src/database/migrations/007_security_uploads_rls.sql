-- Security hardening: private upload ledger with row-level security.
-- The API remains the only storage broker. Clients never receive S3 credentials.

CREATE TABLE IF NOT EXISTS secure_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('mms', 'voicemail', 'support_attachment', 'document', 'export')),
  classification TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0),
  checksum_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'quarantined', 'deleted')),
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  retention_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_secure_uploads_user_created
  ON secure_uploads(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_secure_uploads_status
  ON secure_uploads(status);

ALTER TABLE secure_uploads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'secure_uploads'
      AND policyname = 'secure_uploads_owner_select'
  ) THEN
    CREATE POLICY secure_uploads_owner_select
      ON secure_uploads
      FOR SELECT
      USING (user_id::text = current_setting('app.current_user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'secure_uploads'
      AND policyname = 'secure_uploads_owner_insert'
  ) THEN
    CREATE POLICY secure_uploads_owner_insert
      ON secure_uploads
      FOR INSERT
      WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'secure_uploads'
      AND policyname = 'secure_uploads_owner_update'
  ) THEN
    CREATE POLICY secure_uploads_owner_update
      ON secure_uploads
      FOR UPDATE
      USING (user_id::text = current_setting('app.current_user_id', true))
      WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
  END IF;
END $$;
