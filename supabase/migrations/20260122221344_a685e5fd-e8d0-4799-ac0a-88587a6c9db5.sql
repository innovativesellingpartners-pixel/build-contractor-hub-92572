-- Add lead_id column to user_meetings table for linking meetings to leads
ALTER TABLE public.user_meetings 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_meetings_lead_id ON public.user_meetings(lead_id);