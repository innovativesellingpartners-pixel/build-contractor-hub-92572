-- Add missing columns to marketplace_services
ALTER TABLE public.marketplace_services 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS provider_name TEXT,
ADD COLUMN IF NOT EXISTS provider_email TEXT,
ADD COLUMN IF NOT EXISTS price_range TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create marketplace_categories table
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on marketplace_categories
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketplace_categories
CREATE POLICY "Anyone can view marketplace categories"
ON public.marketplace_categories
FOR SELECT
TO authenticated
USING (true);

-- Create user_lesson_notes table
CREATE TABLE IF NOT EXISTS public.user_lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on user_lesson_notes
ALTER TABLE public.user_lesson_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_lesson_notes
CREATE POLICY "Users can view own notes"
ON public.user_lesson_notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
ON public.user_lesson_notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
ON public.user_lesson_notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
ON public.user_lesson_notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_lesson_notes
CREATE TRIGGER update_user_lesson_notes_updated_at
BEFORE UPDATE ON public.user_lesson_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add user_id column to profiles (make it match the id for existing rows)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Set user_id to match id for existing rows
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Make user_id required and unique
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL,
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);