DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transactions_type_enum') THEN
    ALTER TYPE wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'esim_purchase';
    ALTER TYPE wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'proxy_purchase';
    ALTER TYPE wallet_transactions_type_enum ADD VALUE IF NOT EXISTS 'vpn_purchase';
  END IF;
END $$;
