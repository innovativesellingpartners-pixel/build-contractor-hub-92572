-- Add payment_intent and payment tracking columns to estimate_payment_sessions
ALTER TABLE public.estimate_payment_sessions 
ADD COLUMN IF NOT EXISTS payment_intent text DEFAULT 'full',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS clover_payment_id text;

-- Add payment tracking columns to estimates if not exist
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimate_payment_sessions_estimate_id 
ON public.estimate_payment_sessions(estimate_id);

CREATE INDEX IF NOT EXISTS idx_estimate_payment_sessions_clover_session_id 
ON public.estimate_payment_sessions(clover_session_id);

-- Add comments for documentation
COMMENT ON COLUMN public.estimate_payment_sessions.payment_intent IS 'deposit, full, or remaining';
COMMENT ON COLUMN public.estimate_payment_sessions.status IS 'pending, succeeded, failed, cancelled';
COMMENT ON COLUMN public.estimates.payment_status IS 'unpaid, partial, paid';