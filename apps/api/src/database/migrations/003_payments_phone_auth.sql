-- ============================================================
-- Migration 003: Payment Sessions, Phone OTP, NGN Packages
-- ============================================================

-- Payment sessions
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gateway payment_gateway NOT NULL,
  amount_kobo BIGINT NOT NULL,
  currency VARCHAR(5) NOT NULL DEFAULT 'NGN',
  reference VARCHAR(255) UNIQUE NOT NULL,
  gateway_reference VARCHAR(255),
  checkout_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  gateway_response JSONB NOT NULL DEFAULT '{}',
  paid_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_reference ON payment_sessions(reference);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_created_at ON payment_sessions(created_at DESC);

-- Phone OTP sessions
CREATE TABLE phone_otp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'sms',
  verification_sid VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phone_otp_phone_number ON phone_otp_sessions(phone_number);
CREATE INDEX idx_phone_otp_expires_at ON phone_otp_sessions(expires_at);

-- Credit packages (NGN-first pricing)
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  amount_kobo BIGINT NOT NULL,        -- Credits added to wallet
  bonus_kobo BIGINT NOT NULL DEFAULT 0, -- Bonus credits
  price_kobo BIGINT NOT NULL,          -- What user pays
  available_gateways TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed NGN credit packages
INSERT INTO credit_packages (name, amount_kobo, bonus_kobo, price_kobo, available_gateways, is_featured, sort_order) VALUES
  ('Starter Pack', 200000, 0, 200000, '{paystack,flutterwave,squad,opay,korapay,stripe,crypto}', FALSE, 0),
  ('Basic Pack', 500000, 25000, 500000, '{paystack,flutterwave,squad,opay,korapay,stripe,crypto}', FALSE, 1),
  ('Value Pack', 1000000, 100000, 1000000, '{paystack,flutterwave,squad,opay,korapay,stripe,crypto}', TRUE, 2),
  ('Pro Pack', 2500000, 375000, 2500000, '{paystack,flutterwave,squad,opay,korapay,stripe,crypto}', FALSE, 3),
  ('Power Pack', 5000000, 1000000, 5000000, '{paystack,flutterwave,squad,opay,korapay,stripe,crypto}', FALSE, 4),
  ('Business Pack', 10000000, 2500000, 10000000, '{paystack,flutterwave,squad,opay,korapay,stripe,crypto}', FALSE, 5);

-- Number pricing table for different countries
CREATE TABLE number_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code VARCHAR(5) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'local',
  setup_price_kobo INT NOT NULL DEFAULT 0,
  monthly_price_kobo INT NOT NULL,
  sms_price_kobo INT NOT NULL DEFAULT 0,
  call_price_per_min_kobo INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO number_pricing (country_code, country_name, type, setup_price_kobo, monthly_price_kobo, sms_price_kobo, call_price_per_min_kobo) VALUES
  ('US', 'United States', 'local', 0, 160000, 2400, 3200),
  ('GB', 'United Kingdom', 'local', 0, 200000, 3200, 4800),
  ('CA', 'Canada', 'local', 0, 160000, 2400, 3200),
  ('NG', 'Nigeria', 'local', 0, 80000, 1600, 2400),
  ('AU', 'Australia', 'local', 0, 200000, 3200, 4800),
  ('DE', 'Germany', 'local', 0, 240000, 3200, 4800),
  ('FR', 'France', 'local', 0, 240000, 3200, 4800),
  ('IN', 'India', 'local', 0, 120000, 1600, 2400);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- Push tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL, -- ios | android | web
  device_name VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
