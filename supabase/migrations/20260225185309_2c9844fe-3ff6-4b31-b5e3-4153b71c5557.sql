
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS finix_merchant_id text,
ADD COLUMN IF NOT EXISTS preferred_payment_provider text DEFAULT 'clover';

COMMENT ON COLUMN public.profiles.finix_merchant_id IS 'Finix Merchant Identity ID for payment processing';
COMMENT ON COLUMN public.profiles.preferred_payment_provider IS 'Preferred payment provider: clover, finix, or stripe';
