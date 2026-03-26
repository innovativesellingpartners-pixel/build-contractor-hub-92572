CREATE TABLE public.stripe_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stripe_webhook_events_event_id ON public.stripe_webhook_events (stripe_event_id);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service_role can access this table (no anon/authenticated policies)
CREATE POLICY "Service role only" ON public.stripe_webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);