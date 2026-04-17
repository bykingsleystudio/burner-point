-- ============================================================
-- Migration 005: Bind phone OTP sessions to Burner Point users
-- ============================================================

ALTER TABLE phone_otp_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_phone_otp_user_id
  ON phone_otp_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_phone_otp_user_phone_status
  ON phone_otp_sessions(user_id, phone_number, status, created_at DESC);
