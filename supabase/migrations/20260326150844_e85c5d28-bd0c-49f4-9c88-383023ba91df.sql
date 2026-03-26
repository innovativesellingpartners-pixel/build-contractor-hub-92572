-- Add missing columns to crews table
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS foreman_name TEXT;
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS foreman_phone TEXT;
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.crews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add missing columns to crew_assignments table
ALTER TABLE public.crew_assignments ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES public.crews(id) ON DELETE CASCADE;
ALTER TABLE public.crew_assignments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.crew_assignments ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.crew_assignments ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.crew_assignments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.crew_assignments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';