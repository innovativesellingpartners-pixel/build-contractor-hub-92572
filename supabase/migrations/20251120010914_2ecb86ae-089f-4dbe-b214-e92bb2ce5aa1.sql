-- Add contractor_phone field to contractor_ai_profiles table
ALTER TABLE public.contractor_ai_profiles
ADD COLUMN IF NOT EXISTS contractor_phone TEXT;