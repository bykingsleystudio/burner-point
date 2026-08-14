-- Durable connectivity lifecycle states. Supabase remains the only schema authority.
-- Existing legacy values stay valid while production provider lifecycles add explicit
-- provisioning, failure, revocation, cancellation, and refund terminal states.

ALTER TABLE public.esim_orders
  DROP CONSTRAINT IF EXISTS esim_orders_status_check;
ALTER TABLE public.esim_orders
  ADD CONSTRAINT esim_orders_status_check CHECK (status IN (
    'pending', 'processing', 'provisioning', 'active', 'completed', 'failed',
    'cancelled', 'expired', 'refunded'
  ));

ALTER TABLE public.proxy_orders
  DROP CONSTRAINT IF EXISTS proxy_orders_status_check;
ALTER TABLE public.proxy_orders
  ADD CONSTRAINT proxy_orders_status_check CHECK (status IN (
    'pending', 'provisioning', 'active', 'suspended', 'expired', 'failed',
    'cancelled', 'refunded'
  ));

ALTER TABLE public.vpn_sessions
  DROP CONSTRAINT IF EXISTS vpn_sessions_status_check;
ALTER TABLE public.vpn_sessions
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE public.vpn_sessions
  ADD CONSTRAINT vpn_sessions_status_check CHECK (status IN (
    'pending', 'provisioning', 'active', 'disconnected', 'expired', 'failed', 'revoked'
  ));

CREATE INDEX IF NOT EXISTS idx_esim_orders_user_status_created
  ON public.esim_orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proxy_orders_user_status_created
  ON public.proxy_orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vpn_sessions_user_status_created
  ON public.vpn_sessions(user_id, status, created_at DESC);
