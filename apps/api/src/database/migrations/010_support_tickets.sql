CREATE TYPE support_tickets_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE support_tickets_priority_enum AS ENUM ('normal', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(24) NOT NULL UNIQUE,
  category VARCHAR(40) NOT NULL,
  product VARCHAR(80),
  subject VARCHAR(140) NOT NULL,
  message TEXT NOT NULL,
  status support_tickets_status_enum NOT NULL DEFAULT 'open',
  priority support_tickets_priority_enum NOT NULL DEFAULT 'normal',
  reference VARCHAR(120),
  resolution_summary TEXT,
  last_reply_at TIMESTAMP,
  closed_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_updated_at ON support_tickets(updated_at DESC);
