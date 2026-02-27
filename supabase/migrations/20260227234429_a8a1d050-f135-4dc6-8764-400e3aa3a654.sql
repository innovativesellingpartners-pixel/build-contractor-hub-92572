
-- Create crews table
CREATE TABLE public.crews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lead_crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE SET NULL,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add additional fields to crew_members
ALTER TABLE public.crew_members
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Junction table for crew membership
CREATE TABLE public.crew_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(crew_id, crew_member_id)
);

-- RLS for crews
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crews" ON public.crews
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for crew_memberships
ALTER TABLE public.crew_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage memberships for own crews" ON public.crew_memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.crews WHERE crews.id = crew_memberships.crew_id AND crews.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.crews WHERE crews.id = crew_memberships.crew_id AND crews.user_id = auth.uid())
  );

-- Trigger for updated_at on crews
CREATE TRIGGER update_crews_updated_at
  BEFORE UPDATE ON public.crews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
