-- Add training level and CT1 contractor number to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS training_level integer DEFAULT 0 CHECK (training_level >= 0 AND training_level <= 5),
ADD COLUMN IF NOT EXISTS ct1_contractor_number text,
ADD COLUMN IF NOT EXISTS contact_name text;