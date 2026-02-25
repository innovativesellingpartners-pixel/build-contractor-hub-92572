
ALTER TABLE public.profiles 
ALTER COLUMN preferred_payment_provider SET DEFAULT 'finix';

-- Update all existing contractors to use finix as default
UPDATE public.profiles SET preferred_payment_provider = 'finix' WHERE preferred_payment_provider = 'clover' OR preferred_payment_provider IS NULL;
