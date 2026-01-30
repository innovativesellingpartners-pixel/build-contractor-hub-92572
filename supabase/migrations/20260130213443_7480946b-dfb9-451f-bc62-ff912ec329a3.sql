-- Create contractor_warranties table to store custom warranty templates
CREATE TABLE public.contractor_warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  warranty_text TEXT NOT NULL,
  duration_years INTEGER DEFAULT 1,
  duration_months INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add warranty fields to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS warranty_id UUID REFERENCES public.contractor_warranties(id),
ADD COLUMN IF NOT EXISTS warranty_text TEXT,
ADD COLUMN IF NOT EXISTS warranty_duration_years INTEGER,
ADD COLUMN IF NOT EXISTS warranty_duration_months INTEGER;

-- Enable RLS
ALTER TABLE public.contractor_warranties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contractor_warranties
CREATE POLICY "Users can view their own warranties"
ON public.contractor_warranties
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warranties"
ON public.contractor_warranties
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warranties"
ON public.contractor_warranties
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warranties"
ON public.contractor_warranties
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_contractor_warranties_updated_at
BEFORE UPDATE ON public.contractor_warranties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_contractor_warranties_user_id ON public.contractor_warranties(user_id);
CREATE INDEX idx_contractor_warranties_active ON public.contractor_warranties(user_id, is_active) WHERE is_active = true;