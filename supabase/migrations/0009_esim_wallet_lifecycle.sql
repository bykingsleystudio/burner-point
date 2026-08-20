-- eSIM orders use the shared Burner Point wallet ledger. The transaction id is
-- retained for support and reconciliation; provider secrets remain encrypted.
ALTER TABLE public.esim_orders
  ADD COLUMN IF NOT EXISTS wallet_transaction_id UUID;

CREATE INDEX IF NOT EXISTS idx_esim_orders_wallet_transaction
  ON public.esim_orders(wallet_transaction_id)
  WHERE wallet_transaction_id IS NOT NULL;