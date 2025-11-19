-- Create phone_numbers table for contractor Twilio numbers
CREATE TABLE public.phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID NULL,
  twilio_phone_number TEXT NOT NULL UNIQUE,
  twilio_sid TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookup by phone number
CREATE INDEX idx_phone_numbers_twilio_phone_number ON public.phone_numbers(twilio_phone_number) WHERE active = true;
CREATE INDEX idx_phone_numbers_contractor_id ON public.phone_numbers(contractor_id);

-- Enable RLS
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own phone numbers
CREATE POLICY "Contractors can view own phone numbers"
  ON public.phone_numbers
  FOR SELECT
  USING (auth.uid() = contractor_id);

-- Service role can manage phone numbers (for provisioning)
CREATE POLICY "Service role can manage phone numbers"
  ON public.phone_numbers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Update calls table to add tenant_id and routing_status
ALTER TABLE public.calls 
  ADD COLUMN IF NOT EXISTS tenant_id UUID NULL,
  ADD COLUMN IF NOT EXISTS routing_status TEXT NOT NULL DEFAULT 'ok';

-- Add index for filtering calls by contractor
CREATE INDEX IF NOT EXISTS idx_calls_contractor_id ON public.calls(contractor_id) WHERE contractor_id IS NOT NULL;

COMMENT ON TABLE public.phone_numbers IS 'Stores Twilio phone numbers assigned to contractors';
COMMENT ON COLUMN public.calls.routing_status IS 'Status of call routing: ok, unassigned_number, etc.';