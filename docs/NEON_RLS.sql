-- Burner Point Neon / Postgres RLS baseline.
-- Run after schema migrations.
--
-- Request-scoped application queries must set:
--   SET LOCAL app.current_user_id = '<authenticated-user-uuid>';
--
-- Trusted background jobs and webhook processors must set:
--   SET LOCAL app.service_context = 'on';

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_is_service_context()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.service_context', true) = 'on'
$$;

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;
DROP POLICY IF EXISTS users_service_all ON users;
CREATE POLICY users_self_select ON users
  FOR SELECT
  USING (id = current_app_user_id());
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = current_app_user_id())
  WITH CHECK (id = current_app_user_id());
CREATE POLICY users_service_all ON users
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

-- Billing
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_transactions_owner_select ON wallet_transactions;
DROP POLICY IF EXISTS wallet_transactions_service_all ON wallet_transactions;
CREATE POLICY wallet_transactions_owner_select ON wallet_transactions
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY wallet_transactions_service_all ON wallet_transactions
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_sessions_owner_select ON payment_sessions;
DROP POLICY IF EXISTS payment_sessions_owner_insert ON payment_sessions;
DROP POLICY IF EXISTS payment_sessions_service_all ON payment_sessions;
CREATE POLICY payment_sessions_owner_select ON payment_sessions
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY payment_sessions_owner_insert ON payment_sessions
  FOR INSERT
  WITH CHECK (user_id = current_app_user_id());
CREATE POLICY payment_sessions_service_all ON payment_sessions
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_subscriptions_owner_select ON user_subscriptions;
DROP POLICY IF EXISTS user_subscriptions_service_all ON user_subscriptions;
CREATE POLICY user_subscriptions_owner_select ON user_subscriptions
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY user_subscriptions_service_all ON user_subscriptions
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plans_public_select ON subscription_plans;
DROP POLICY IF EXISTS subscription_plans_service_all ON subscription_plans;
CREATE POLICY subscription_plans_public_select ON subscription_plans
  FOR SELECT
  USING (is_active = true OR app_is_service_context());
CREATE POLICY subscription_plans_service_all ON subscription_plans
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_packages_public_select ON credit_packages;
DROP POLICY IF EXISTS credit_packages_service_all ON credit_packages;
CREATE POLICY credit_packages_public_select ON credit_packages
  FOR SELECT
  USING (is_active = true OR app_is_service_context());
CREATE POLICY credit_packages_service_all ON credit_packages
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

-- Telecom data
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS phone_numbers_owner_select ON phone_numbers;
DROP POLICY IF EXISTS phone_numbers_owner_update ON phone_numbers;
DROP POLICY IF EXISTS phone_numbers_service_all ON phone_numbers;
CREATE POLICY phone_numbers_owner_select ON phone_numbers
  FOR SELECT
  USING (user_id = current_app_user_id() OR assigned_to_user_id = current_app_user_id());
CREATE POLICY phone_numbers_owner_update ON phone_numbers
  FOR UPDATE
  USING (user_id = current_app_user_id() OR assigned_to_user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id() OR assigned_to_user_id = current_app_user_id());
CREATE POLICY phone_numbers_service_all ON phone_numbers
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_owner_select ON messages;
DROP POLICY IF EXISTS messages_owner_insert ON messages;
DROP POLICY IF EXISTS messages_owner_update ON messages;
DROP POLICY IF EXISTS messages_service_all ON messages;
CREATE POLICY messages_owner_select ON messages
  FOR SELECT
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = messages."phoneNumberId"
        AND (pn.user_id = current_app_user_id() OR pn.assigned_to_user_id = current_app_user_id())
    )
  );
CREATE POLICY messages_owner_insert ON messages
  FOR INSERT
  WITH CHECK ("userId" = current_app_user_id());
CREATE POLICY messages_owner_update ON messages
  FOR UPDATE
  USING ("userId" = current_app_user_id())
  WITH CHECK ("userId" = current_app_user_id());
CREATE POLICY messages_service_all ON messages
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calls_owner_select ON calls;
DROP POLICY IF EXISTS calls_owner_insert ON calls;
DROP POLICY IF EXISTS calls_owner_update ON calls;
DROP POLICY IF EXISTS calls_service_all ON calls;
CREATE POLICY calls_owner_select ON calls
  FOR SELECT
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM phone_numbers pn
      WHERE pn.id = calls."phoneNumberId"
        AND (pn.user_id = current_app_user_id() OR pn.assigned_to_user_id = current_app_user_id())
    )
  );
CREATE POLICY calls_owner_insert ON calls
  FOR INSERT
  WITH CHECK ("userId" = current_app_user_id());
CREATE POLICY calls_owner_update ON calls
  FOR UPDATE
  USING ("userId" = current_app_user_id())
  WITH CHECK ("userId" = current_app_user_id());
CREATE POLICY calls_service_all ON calls
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE phone_otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_otp_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS phone_otp_sessions_owner_select ON phone_otp_sessions;
DROP POLICY IF EXISTS phone_otp_sessions_owner_insert ON phone_otp_sessions;
DROP POLICY IF EXISTS phone_otp_sessions_owner_update ON phone_otp_sessions;
DROP POLICY IF EXISTS phone_otp_sessions_service_all ON phone_otp_sessions;
CREATE POLICY phone_otp_sessions_owner_select ON phone_otp_sessions
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY phone_otp_sessions_owner_insert ON phone_otp_sessions
  FOR INSERT
  WITH CHECK (user_id = current_app_user_id());
CREATE POLICY phone_otp_sessions_owner_update ON phone_otp_sessions
  FOR UPDATE
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());
CREATE POLICY phone_otp_sessions_service_all ON phone_otp_sessions
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

-- API platform and support
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_owner_select ON support_tickets;
DROP POLICY IF EXISTS support_tickets_owner_insert ON support_tickets;
DROP POLICY IF EXISTS support_tickets_owner_update ON support_tickets;
DROP POLICY IF EXISTS support_tickets_service_all ON support_tickets;
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
CREATE POLICY support_tickets_service_all ON support_tickets
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE developer_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_webhooks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS developer_webhooks_owner_select ON developer_webhooks;
DROP POLICY IF EXISTS developer_webhooks_owner_insert ON developer_webhooks;
DROP POLICY IF EXISTS developer_webhooks_owner_update ON developer_webhooks;
DROP POLICY IF EXISTS developer_webhooks_service_all ON developer_webhooks;
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
CREATE POLICY developer_webhooks_service_all ON developer_webhooks
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS api_keys_owner_select ON api_keys;
DROP POLICY IF EXISTS api_keys_owner_insert ON api_keys;
DROP POLICY IF EXISTS api_keys_owner_update ON api_keys;
DROP POLICY IF EXISTS api_keys_service_all ON api_keys;
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
CREATE POLICY api_keys_service_all ON api_keys
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

-- Enterprise
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspaces_member_select ON workspaces;
DROP POLICY IF EXISTS workspaces_owner_insert ON workspaces;
DROP POLICY IF EXISTS workspaces_owner_update ON workspaces;
DROP POLICY IF EXISTS workspaces_owner_select ON workspaces;
DROP POLICY IF EXISTS workspaces_service_all ON workspaces;
CREATE POLICY workspaces_member_select ON workspaces
  FOR SELECT
  USING ("ownerUserId" = current_app_user_id());
CREATE POLICY workspaces_owner_insert ON workspaces
  FOR INSERT
  WITH CHECK ("ownerUserId" = current_app_user_id());
CREATE POLICY workspaces_owner_update ON workspaces
  FOR UPDATE
  USING ("ownerUserId" = current_app_user_id())
  WITH CHECK ("ownerUserId" = current_app_user_id());
CREATE POLICY workspaces_service_all ON workspaces
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_members_member_select ON workspace_members;
DROP POLICY IF EXISTS workspace_members_owner_write ON workspace_members;
DROP POLICY IF EXISTS workspace_members_owner_select ON workspace_members;
DROP POLICY IF EXISTS workspace_members_service_all ON workspace_members;
CREATE POLICY workspace_members_member_select ON workspace_members
  FOR SELECT
  USING (
    "userId" = current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM workspaces w
      WHERE w.id = workspace_members."workspaceId"
        AND w."ownerUserId" = current_app_user_id()
    )
  );
CREATE POLICY workspace_members_owner_write ON workspace_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      WHERE w.id = workspace_members."workspaceId"
        AND w."ownerUserId" = current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      WHERE w.id = workspace_members."workspaceId"
        AND w."ownerUserId" = current_app_user_id()
    )
  );
CREATE POLICY workspace_members_service_all ON workspace_members
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

-- Audit, growth, abuse, and webhook idempotency
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_owner_select ON audit_logs;
DROP POLICY IF EXISTS audit_logs_service_all ON audit_logs;
CREATE POLICY audit_logs_owner_select ON audit_logs
  FOR SELECT
  USING ("userId" = current_app_user_id());
CREATE POLICY audit_logs_service_all ON audit_logs
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS referrals_participant_select ON referrals;
DROP POLICY IF EXISTS referrals_service_all ON referrals;
CREATE POLICY referrals_participant_select ON referrals
  FOR SELECT
  USING (
    "referrerId" = current_app_user_id()
    OR "refereeId" = current_app_user_id()
  );
CREATE POLICY referrals_service_all ON referrals
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE webhook_dedup ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_dedup FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhook_dedup_service_all ON webhook_dedup;
CREATE POLICY webhook_dedup_service_all ON webhook_dedup
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE abuse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS abuse_events_service_all ON abuse_events;
CREATE POLICY abuse_events_service_all ON abuse_events
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());

ALTER TABLE velocity_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE velocity_counters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS velocity_counters_service_all ON velocity_counters;
CREATE POLICY velocity_counters_service_all ON velocity_counters
  FOR ALL
  USING (app_is_service_context())
  WITH CHECK (app_is_service_context());
