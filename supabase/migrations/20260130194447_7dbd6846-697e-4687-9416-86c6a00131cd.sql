-- Create estimate_drafts table for auto-save functionality
CREATE TABLE public.estimate_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at_client TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Each estimate can have only one draft per user
  UNIQUE(estimate_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.estimate_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own drafts
CREATE POLICY "Users can view their own drafts"
ON public.estimate_drafts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
ON public.estimate_drafts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.estimate_drafts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.estimate_drafts
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_estimate_drafts_estimate_user ON public.estimate_drafts(estimate_id, user_id);
CREATE INDEX idx_estimate_drafts_user ON public.estimate_drafts(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_estimate_drafts_updated_at
BEFORE UPDATE ON public.estimate_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();