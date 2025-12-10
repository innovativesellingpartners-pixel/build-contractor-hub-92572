-- Create gc_contacts table for General Contractors (separate from customers)
CREATE TABLE public.gc_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gc_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for gc_contacts
CREATE POLICY "Users can view own gc_contacts"
  ON public.gc_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gc_contacts"
  ON public.gc_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gc_contacts"
  ON public.gc_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gc_contacts"
  ON public.gc_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_gc_contacts_updated_at
  BEFORE UPDATE ON public.gc_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();