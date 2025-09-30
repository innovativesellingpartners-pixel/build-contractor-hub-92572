-- Add contractor business information fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'launch' CHECK (subscription_tier IN ('launch', 'growth', 'accel'));

-- Add comment to explain subscription tiers
COMMENT ON COLUMN public.profiles.subscription_tier IS 'Subscription tier: launch ($50/mo), growth ($200/mo), accel (TBD)';