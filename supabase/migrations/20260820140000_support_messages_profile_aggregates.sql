BEGIN;

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL DEFAULT 'customer' CHECK (author_role IN ('customer', 'agent', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON public.support_messages(user_id);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMIT;
