-- Add ct1_contractor_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN ct1_contractor_number TEXT;

-- Add index for better lookup performance
CREATE INDEX idx_profiles_ct1_contractor_number ON public.profiles(ct1_contractor_number);