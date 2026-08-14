-- Allow durable workers to claim a delivery before making an outbound request.
-- This prevents duplicate sends when more than one API instance is running.

ALTER TABLE public.developer_webhook_deliveries
  DROP CONSTRAINT IF EXISTS developer_webhook_deliveries_status_check;
ALTER TABLE public.developer_webhook_deliveries
  ADD CONSTRAINT developer_webhook_deliveries_status_check CHECK (status IN (
    'pending', 'delivering', 'delivered', 'failed', 'disabled'
  ));

CREATE INDEX IF NOT EXISTS idx_developer_webhook_deliveries_claimable
  ON public.developer_webhook_deliveries(status, next_attempt_at, created_at)
  WHERE status = 'pending';
