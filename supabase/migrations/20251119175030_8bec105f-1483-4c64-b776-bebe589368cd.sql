-- Create calls table for Twilio voice call logging
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  call_sid TEXT NOT NULL UNIQUE,
  call_status TEXT NOT NULL,
  contractor_id UUID NULL, -- Placeholder until contractor mapping is wired
  recording_url TEXT NULL,
  recording_sid TEXT NULL,
  duration INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all calls (for edge function)
CREATE POLICY "Service role can manage calls"
  ON public.calls
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow contractors to view their own calls
CREATE POLICY "Contractors can view own calls"
  ON public.calls
  FOR SELECT
  USING (contractor_id = auth.uid());

-- Create index on call_sid for faster lookups
CREATE INDEX idx_calls_call_sid ON public.calls(call_sid);

-- Create index on contractor_id for filtering
CREATE INDEX idx_calls_contractor_id ON public.calls(contractor_id);

-- Add updated_at trigger
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();