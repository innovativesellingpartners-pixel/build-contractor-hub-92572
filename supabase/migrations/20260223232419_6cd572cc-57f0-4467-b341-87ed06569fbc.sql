
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS zelle_email TEXT,
  ADD COLUMN IF NOT EXISTS zelle_phone TEXT,
  ADD COLUMN IF NOT EXISTS ach_instructions TEXT,
  ADD COLUMN IF NOT EXISTS accepted_payment_methods TEXT[] DEFAULT ARRAY['card']::TEXT[];
