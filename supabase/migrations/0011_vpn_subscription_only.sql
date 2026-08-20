-- VPN sessions are subscription-entitled and never wallet-funded.
ALTER TABLE public.vpn_sessions
  ADD COLUMN IF NOT EXISTS entitlement_source TEXT;

CREATE INDEX IF NOT EXISTS idx_vpn_sessions_user_entitlement
  ON public.vpn_sessions(user_id, entitlement_source, created_at DESC);