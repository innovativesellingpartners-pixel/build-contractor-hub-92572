-- Create table for secure OAuth state storage
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_token TEXT NOT NULL UNIQUE,
  contractor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service role can manage oauth states (used by edge functions)
CREATE POLICY "Service role can manage oauth states"
  ON public.oauth_states
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for fast lookups
CREATE INDEX idx_oauth_states_token ON public.oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires ON public.oauth_states(expires_at);

-- Auto-cleanup expired states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$;