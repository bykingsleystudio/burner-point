-- =============================================
-- Burner Point - Row Level Security (RLS) Policies
-- =============================================
-- Enable RLS on ALL tables with comprehensive policies
-- Users can ONLY access their own data
-- Service role can access everything (for background jobs)
-- =============================================

-- =============================================
-- USERS TABLE
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own data (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to users"
  ON public.users
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- PROFILES TABLE
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- WALLETS TABLE
-- =============================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own wallet
CREATE POLICY "Users can view own wallet"
  ON public.wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own wallet
CREATE POLICY "Users can update own wallet"
  ON public.wallets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own wallet
CREATE POLICY "Users can insert own wallet"
  ON public.wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to wallets"
  ON public.wallets
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- WALLET TRANSACTIONS TABLE
-- =============================================
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.wallet_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to wallet transactions"
  ON public.wallet_transactions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- PAYMENT SESSIONS TABLE
-- =============================================
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment sessions
CREATE POLICY "Users can view own payment sessions"
  ON public.payment_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own payment sessions
CREATE POLICY "Users can insert own payment sessions"
  ON public.payment_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own payment sessions
CREATE POLICY "Users can update own payment sessions"
  ON public.payment_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to payment sessions"
  ON public.payment_sessions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- USER SUBSCRIPTIONS TABLE
-- =============================================
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to user subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- SUBSCRIPTION PLANS TABLE
-- =============================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active subscription plans
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = TRUE OR is_service_role());

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- CREDIT PACKAGES TABLE
-- =============================================
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active credit packages
CREATE POLICY "Anyone can view active credit packages"
  ON public.credit_packages
  FOR SELECT
  USING (is_active = TRUE OR is_service_role());

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to credit packages"
  ON public.credit_packages
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- PHONE NUMBERS TABLE
-- =============================================
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own phone numbers
CREATE POLICY "Users can view own phone numbers"
  ON public.phone_numbers
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to_user_id);

-- Policy: Users can update their own phone numbers
CREATE POLICY "Users can update own phone numbers"
  ON public.phone_numbers
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to_user_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to_user_id);

-- Policy: Users can insert their own phone numbers
CREATE POLICY "Users can insert own phone numbers"
  ON public.phone_numbers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to phone numbers"
  ON public.phone_numbers
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- MESSAGES TABLE
-- =============================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.phone_numbers pn
      WHERE pn.id = messages.phone_number_id
      AND (pn.user_id = auth.uid() OR pn.assigned_to_user_id = auth.uid())
    )
  );

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to messages"
  ON public.messages
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- CALLS TABLE
-- =============================================
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own calls
CREATE POLICY "Users can view own calls"
  ON public.calls
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.phone_numbers pn
      WHERE pn.id = calls.phone_number_id
      AND (pn.user_id = auth.uid() OR pn.assigned_to_user_id = auth.uid())
    )
  );

-- Policy: Users can insert their own calls
CREATE POLICY "Users can insert own calls"
  ON public.calls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calls
CREATE POLICY "Users can update own calls"
  ON public.calls
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to calls"
  ON public.calls
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- PHONE OTP SESSIONS TABLE
-- =============================================
ALTER TABLE public.phone_otp_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own OTP sessions
CREATE POLICY "Users can view own OTP sessions"
  ON public.phone_otp_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own OTP sessions
CREATE POLICY "Users can insert own OTP sessions"
  ON public.phone_otp_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own OTP sessions
CREATE POLICY "Users can update own OTP sessions"
  ON public.phone_otp_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to OTP sessions"
  ON public.phone_otp_sessions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- VERIFICATIONS TABLE
-- =============================================
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own verifications
CREATE POLICY "Users can view own verifications"
  ON public.verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own verifications
CREATE POLICY "Users can insert own verifications"
  ON public.verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own verifications
CREATE POLICY "Users can update own verifications"
  ON public.verifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to verifications"
  ON public.verifications
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- ESIM ORDERS TABLE
-- =============================================
ALTER TABLE public.esim_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own eSIM orders
CREATE POLICY "Users can view own eSIM orders"
  ON public.esim_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own eSIM orders
CREATE POLICY "Users can insert own eSIM orders"
  ON public.esim_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own eSIM orders
CREATE POLICY "Users can update own eSIM orders"
  ON public.esim_orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to eSIM orders"
  ON public.esim_orders
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- PROXY ORDERS TABLE
-- =============================================
ALTER TABLE public.proxy_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own proxy orders
CREATE POLICY "Users can view own proxy orders"
  ON public.proxy_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own proxy orders
CREATE POLICY "Users can insert own proxy orders"
  ON public.proxy_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own proxy orders
CREATE POLICY "Users can update own proxy orders"
  ON public.proxy_orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to proxy orders"
  ON public.proxy_orders
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- VPN SESSIONS TABLE
-- =============================================
ALTER TABLE public.vpn_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own VPN sessions
CREATE POLICY "Users can view own VPN sessions"
  ON public.vpn_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own VPN sessions
CREATE POLICY "Users can insert own VPN sessions"
  ON public.vpn_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own VPN sessions
CREATE POLICY "Users can update own VPN sessions"
  ON public.vpn_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to VPN sessions"
  ON public.vpn_sessions
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- SUPPORT TICKETS TABLE
-- =============================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own support tickets
CREATE POLICY "Users can view own support tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own support tickets
CREATE POLICY "Users can insert own support tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own support tickets
CREATE POLICY "Users can update own support tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to support tickets"
  ON public.support_tickets
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- API KEYS TABLE
-- =============================================
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
CREATE POLICY "Users can view own API keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own API keys
CREATE POLICY "Users can insert own API keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own API keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to API keys"
  ON public.api_keys
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- DEVELOPER WEBHOOKS TABLE
-- =============================================
ALTER TABLE public.developer_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own webhooks
CREATE POLICY "Users can view own webhooks"
  ON public.developer_webhooks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own webhooks
CREATE POLICY "Users can insert own webhooks"
  ON public.developer_webhooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own webhooks
CREATE POLICY "Users can update own webhooks"
  ON public.developer_webhooks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to webhooks"
  ON public.developer_webhooks
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to audit logs"
  ON public.audit_logs
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- REFERRALS TABLE
-- =============================================
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referrals
CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to referrals"
  ON public.referrals
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- WEBHOOK DEDUP TABLE
-- =============================================
ALTER TABLE public.webhook_dedup ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to webhook dedup"
  ON public.webhook_dedup
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- ABUSE EVENTS TABLE
-- =============================================
ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to abuse events"
  ON public.abuse_events
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- VELOCITY COUNTERS TABLE
-- =============================================
ALTER TABLE public.velocity_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to velocity counters"
  ON public.velocity_counters
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- WORKSPACES TABLE
-- =============================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their workspaces
CREATE POLICY "Workspace owners can view"
  ON public.workspaces
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Policy: Workspace members can view
CREATE POLICY "Workspace members can view"
  ON public.workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id
      AND wm.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own workspaces
CREATE POLICY "Users can insert own workspaces"
  ON public.workspaces
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Owners can update their workspaces
CREATE POLICY "Workspace owners can update"
  ON public.workspaces
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to workspaces"
  ON public.workspaces
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- =============================================
-- WORKSPACE MEMBERS TABLE
-- =============================================
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view workspace memberships
CREATE POLICY "Workspace members can view"
  ON public.workspace_members
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_user_id = auth.uid()
    )
  );

-- Policy: Owners can insert workspace members
CREATE POLICY "Workspace owners can insert members"
  ON public.workspace_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_user_id = auth.uid()
    )
  );

-- Policy: Owners can update workspace members
CREATE POLICY "Workspace owners can update members"
  ON public.workspace_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to workspace members"
  ON public.workspace_members
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());
