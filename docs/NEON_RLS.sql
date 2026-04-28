-- Burner Point Neon / Postgres RLS baseline
-- Run after the schema migrations in apps/api/src/database/migrations/.
-- The application must set `SET LOCAL app.current_user_id = '<user-uuid>';`
-- for request-scoped user queries that should obey these policies.

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_select ON users
  FOR SELECT
  USING (id = current_app_user_id());
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = current_app_user_id())
  WITH CHECK (id = current_app_user_id());

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_transactions_owner_select ON wallet_transactions;
CREATE POLICY wallet_transactions_owner_select ON wallet_transactions
  FOR SELECT
  USING (user_id = current_app_user_id());

ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_sessions_owner_select ON payment_sessions;
CREATE POLICY payment_sessions_owner_select ON payment_sessions
  FOR SELECT
  USING (user_id = current_app_user_id());

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS phone_numbers_owner_select ON phone_numbers;
DROP POLICY IF EXISTS phone_numbers_owner_update ON phone_numbers;
CREATE POLICY phone_numbers_owner_select ON phone_numbers
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY phone_numbers_owner_update ON phone_numbers
  FOR UPDATE
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_owner_select ON messages;
DROP POLICY IF EXISTS messages_owner_update ON messages;
CREATE POLICY messages_owner_select ON messages
  FOR SELECT
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = messages."phoneNumberId"
        AND pn.user_id = current_app_user_id()
    )
  );
CREATE POLICY messages_owner_update ON messages
  FOR UPDATE
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = messages."phoneNumberId"
        AND pn.user_id = current_app_user_id()
    )
  )
  WITH CHECK (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = messages."phoneNumberId"
        AND pn.user_id = current_app_user_id()
    )
  );

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calls_owner_select ON calls;
DROP POLICY IF EXISTS calls_owner_update ON calls;
CREATE POLICY calls_owner_select ON calls
  FOR SELECT
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = calls."phoneNumberId"
        AND pn.user_id = current_app_user_id()
    )
  );
CREATE POLICY calls_owner_update ON calls
  FOR UPDATE
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = calls."phoneNumberId"
        AND pn.user_id = current_app_user_id()
    )
  )
  WITH CHECK (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = calls."phoneNumberId"
        AND pn.user_id = current_app_user_id()
    )
  );

ALTER TABLE phone_otp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS phone_otp_sessions_owner_select ON phone_otp_sessions;
DROP POLICY IF EXISTS phone_otp_sessions_owner_insert ON phone_otp_sessions;
CREATE POLICY phone_otp_sessions_owner_select ON phone_otp_sessions
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY phone_otp_sessions_owner_insert ON phone_otp_sessions
  FOR INSERT
  WITH CHECK (user_id = current_app_user_id());

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_subscriptions_owner_select ON user_subscriptions;
CREATE POLICY user_subscriptions_owner_select ON user_subscriptions
  FOR SELECT
  USING (user_id = current_app_user_id());

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_owner_select ON support_tickets;
DROP POLICY IF EXISTS support_tickets_owner_insert ON support_tickets;
DROP POLICY IF EXISTS support_tickets_owner_update ON support_tickets;
CREATE POLICY support_tickets_owner_select ON support_tickets
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY support_tickets_owner_insert ON support_tickets
  FOR INSERT
  WITH CHECK (user_id = current_app_user_id());
CREATE POLICY support_tickets_owner_update ON support_tickets
  FOR UPDATE
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

ALTER TABLE developer_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS developer_webhooks_owner_select ON developer_webhooks;
DROP POLICY IF EXISTS developer_webhooks_owner_insert ON developer_webhooks;
DROP POLICY IF EXISTS developer_webhooks_owner_update ON developer_webhooks;
CREATE POLICY developer_webhooks_owner_select ON developer_webhooks
  FOR SELECT
  USING ("userId" = current_app_user_id());
CREATE POLICY developer_webhooks_owner_insert ON developer_webhooks
  FOR INSERT
  WITH CHECK ("userId" = current_app_user_id());
CREATE POLICY developer_webhooks_owner_update ON developer_webhooks
  FOR UPDATE
  USING ("userId" = current_app_user_id())
  WITH CHECK ("userId" = current_app_user_id());

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS api_keys_owner_select ON api_keys;
DROP POLICY IF EXISTS api_keys_owner_insert ON api_keys;
DROP POLICY IF EXISTS api_keys_owner_update ON api_keys;
CREATE POLICY api_keys_owner_select ON api_keys
  FOR SELECT
  USING ("userId" = current_app_user_id());
CREATE POLICY api_keys_owner_insert ON api_keys
  FOR INSERT
  WITH CHECK ("userId" = current_app_user_id());
CREATE POLICY api_keys_owner_update ON api_keys
  FOR UPDATE
  USING ("userId" = current_app_user_id())
  WITH CHECK ("userId" = current_app_user_id());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_owner_select ON audit_logs;
CREATE POLICY audit_logs_owner_select ON audit_logs
  FOR SELECT
  USING ("userId" = current_app_user_id());

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS referrals_participant_select ON referrals;
CREATE POLICY referrals_participant_select ON referrals
  FOR SELECT
  USING (
    "referrerId" = current_app_user_id()
    OR "refereeId" = current_app_user_id()
  );

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspaces_owner_select ON workspaces;
CREATE POLICY workspaces_owner_select ON workspaces
  FOR SELECT
  USING ("ownerUserId" = current_app_user_id());

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_members_owner_select ON workspace_members;
CREATE POLICY workspace_members_owner_select ON workspace_members
  FOR SELECT
  USING ("userId" = current_app_user_id());
