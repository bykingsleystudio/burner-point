-- Proxy orders settle through the shared Burner Point wallet ledger.
ALTER TABLE public.proxy_orders
  ADD COLUMN IF NOT EXISTS wallet_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_proxy_orders_wallet_transaction
  ON public.proxy_orders(wallet_transaction_id)
  WHERE wallet_transaction_id IS NOT NULL;