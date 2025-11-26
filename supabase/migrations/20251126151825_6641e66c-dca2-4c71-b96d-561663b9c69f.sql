-- Add referral_source and referral_source_other columns to customers table
ALTER TABLE public.customers 
ADD COLUMN referral_source text,
ADD COLUMN referral_source_other text;