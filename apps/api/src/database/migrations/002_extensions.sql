-- ============================================================
-- Migration 002: Extensions
-- Billing, Abuse, AI, API Platform, Enterprise
-- ============================================================

-- Wallet transactions
CREATE TYPE transaction_type AS ENUM ('credit_purchase','number_purchase','number_renewal','sms_send','call_charge','referral_bonus','refund','adjustment');
CREATE TYPE transaction_status AS ENUM ('pending','completed','failed','reversed');
CREATE TYPE payment_gateway AS ENUM ('stripe','paystack','flutterwave','squad','opay','korapay','crypto');

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  amount_kobo BIGINT NOT NULL,
  balance_before_kobo BIGINT NOT NULL,
  balance_after_kobo BIGINT NOT NULL,
  description TEXT,
  reference_id VARCHAR(255),
  external_reference VARCHAR(255),
  gateway payment_gateway,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_kobo_monthly BIGINT NOT NULL,
  price_kobo_yearly BIGINT NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Webhook deduplication
CREATE TABLE webhook_dedup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'processed',
  processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_dedup_event_id ON webhook_dedup(event_id);
CREATE INDEX idx_webhook_dedup_processed_at ON webhook_dedup(processed_at DESC);

-- Abuse events
CREATE TYPE abuse_event_type AS ENUM ('velocity_breach','suspicious_login','fraud_pattern','sanctions_hit','spam_detected','device_fraud');
CREATE TYPE abuse_action AS ENUM ('allow','flag','block','challenge');

CREATE TABLE abuse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  device_fingerprint VARCHAR(255),
  event_type abuse_event_type NOT NULL,
  action abuse_action NOT NULL DEFAULT 'flag',
  risk_score FLOAT NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_abuse_events_user_id ON abuse_events(user_id);
CREATE INDEX idx_abuse_events_ip ON abuse_events(ip_address);
CREATE INDEX idx_abuse_events_created_at ON abuse_events(created_at DESC);

-- Velocity counters
CREATE TABLE velocity_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  dimension VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  window VARCHAR(10) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_velocity_key ON velocity_counters(key);

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  wallet_balance_kobo BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workspace members
CREATE TYPE workspace_member_role AS ENUM ('owner','admin','member','viewer');

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role workspace_member_role NOT NULL DEFAULT 'member',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  old_value JSONB NOT NULL DEFAULT '{}',
  new_value JSONB NOT NULL DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(8) NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{read}',
  expires_at TIMESTAMP,
  usage_count INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Developer webhooks
CREATE TABLE developer_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  signing_secret VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_success_count INT NOT NULL DEFAULT 0,
  delivery_failure_count INT NOT NULL DEFAULT 0,
  last_delivery_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  referrer_bonus_kobo BIGINT NOT NULL DEFAULT 0,
  referee_bonus_kobo BIGINT NOT NULL DEFAULT 0,
  bonus_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

-- Seed default subscription plans
INSERT INTO subscription_plans (slug, name, description, price_kobo_monthly, price_kobo_yearly, features, sort_order) VALUES
  ('free', 'Free', 'Get started with BurnerPoint', 0, 0, '{"numbers":1,"sms_per_month":50,"calls_per_month":10,"api_access":false,"enterprise":false}', 0),
  ('starter', 'Starter', 'For personal privacy needs', 300000, 3000000, '{"numbers":3,"sms_per_month":300,"calls_per_month":100,"api_access":false,"enterprise":false}', 1),
  ('pro', 'Pro', 'For power users', 800000, 8000000, '{"numbers":10,"sms_per_month":"unlimited","calls_per_month":"unlimited","api_access":true,"enterprise":false}', 2),
  ('enterprise', 'Enterprise', 'For teams and businesses', 3000000, 30000000, '{"numbers":"unlimited","sms_per_month":"unlimited","calls_per_month":"unlimited","api_access":true,"enterprise":true}', 3);
