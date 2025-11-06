-- Create table to track estimate payment sessions
CREATE TABLE IF NOT EXISTS public.estimate_payment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  clover_session_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment_status column to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- Enable RLS
ALTER TABLE public.estimate_payment_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only
CREATE POLICY "Service role can manage payment sessions"
  ON public.estimate_payment_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimate_payment_sessions_estimate_id 
  ON public.estimate_payment_sessions(estimate_id);

CREATE INDEX IF NOT EXISTS idx_estimate_payment_sessions_clover_session_id 
  ON public.estimate_payment_sessions(clover_session_id);