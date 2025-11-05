-- Create lead_sources table
CREATE TABLE public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  project_type TEXT,
  value NUMERIC,
  status TEXT NOT NULL DEFAULT 'new',
  source_id UUID REFERENCES public.lead_sources(id),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_contact_date TIMESTAMP WITH TIME ZONE
);

-- Create lead_activities table for tracking interactions
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_sources
CREATE POLICY "Anyone can view lead sources"
  ON public.lead_sources
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create lead sources"
  ON public.lead_sources
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leads
CREATE POLICY "Users can view own leads"
  ON public.leads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON public.leads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON public.leads
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for lead_activities
CREATE POLICY "Users can view own lead activities"
  ON public.lead_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lead activities"
  ON public.lead_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead activities"
  ON public.lead_activities
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead activities"
  ON public.lead_activities
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default lead sources
INSERT INTO public.lead_sources (name) VALUES
  ('Website'),
  ('Referral'),
  ('Phone Call'),
  ('Social Media'),
  ('Email Campaign'),
  ('Trade Show'),
  ('Other');