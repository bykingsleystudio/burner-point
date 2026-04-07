-- ============================================================
-- Migration 001: Initial Schema
-- Core tables: users, phone_numbers, messages, calls
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'enterprise');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned', 'pending');
CREATE TYPE kyc_status AS ENUM ('none', 'pending', 'verified', 'rejected');
CREATE TYPE number_status AS ENUM ('active', 'expired', 'released', 'suspended', 'pending');
CREATE TYPE number_type AS ENUM ('burner', 'rental', 'verification', 'enterprise');
CREATE TYPE number_provider AS ENUM ('twilio', 'telnyx');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'failed', 'received', 'unread', 'read');
CREATE TYPE message_type AS ENUM ('sms', 'mms');
CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer');
CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  phone_number VARCHAR(20) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'pending',
  kyc_status kyc_status NOT NULL DEFAULT 'none',
  wallet_balance_kobo BIGINT NOT NULL DEFAULT 0,
  lifetime_spend_kobo BIGINT NOT NULL DEFAULT 0,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  country VARCHAR(10),
  timezone VARCHAR(100),
  preferences JSONB NOT NULL DEFAULT '{}',
  google_id VARCHAR(255),
  apple_id VARCHAR(255),
  referral_code VARCHAR(20) UNIQUE,
  referred_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_count INT NOT NULL DEFAULT 0,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  trusted_devices JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_status ON users(status);

-- Phone numbers table
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(20) NOT NULL UNIQUE,
  friendly_name VARCHAR(255),
  status number_status NOT NULL DEFAULT 'active',
  type number_type NOT NULL DEFAULT 'burner',
  provider number_provider NOT NULL DEFAULT 'twilio',
  provider_number_sid VARCHAR(100),
  capabilities TEXT[],
  country_code VARCHAR(5),
  area_code VARCHAR(10),
  expires_at TIMESTAMP,
  auto_renew_at TIMESTAMP,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  price_kobo INT NOT NULL DEFAULT 0,
  renewal_price_kobo INT NOT NULL DEFAULT 0,
  sms_received INT NOT NULL DEFAULT 0,
  sms_sent INT NOT NULL DEFAULT 0,
  calls_received INT NOT NULL DEFAULT 0,
  forwarding_config JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  workspace_id UUID,
  assigned_to_user_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);
CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX idx_phone_numbers_expires_at ON phone_numbers(expires_at) WHERE status = 'active';

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "from" VARCHAR(20) NOT NULL,
  "to" VARCHAR(20) NOT NULL,
  body TEXT,
  direction message_direction NOT NULL,
  status message_status NOT NULL DEFAULT 'pending',
  type message_type NOT NULL DEFAULT 'sms',
  provider_message_sid VARCHAR(100),
  num_segments INT NOT NULL DEFAULT 0,
  price_kobo INT NOT NULL DEFAULT 0,
  ai_classification VARCHAR(50),
  extracted_otp VARCHAR(10),
  spam_score FLOAT NOT NULL DEFAULT 0,
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  media_urls JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMP,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_from ON messages("from");
CREATE INDEX idx_messages_to ON messages("to");
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_phone_number_id ON messages(phone_number_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);

-- Calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "from" VARCHAR(20) NOT NULL,
  "to" VARCHAR(20) NOT NULL,
  direction call_direction NOT NULL,
  status call_status NOT NULL DEFAULT 'initiated',
  provider_call_sid VARCHAR(100),
  duration_seconds INT NOT NULL DEFAULT 0,
  price_kobo INT NOT NULL DEFAULT 0,
  recording_url TEXT,
  voicemail_url TEXT,
  transcription TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
