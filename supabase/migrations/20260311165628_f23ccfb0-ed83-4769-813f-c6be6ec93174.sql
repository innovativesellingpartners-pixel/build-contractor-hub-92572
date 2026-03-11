
-- 1. Fix estimates.public_token default to NULL so new estimates aren't auto-exposed
ALTER TABLE public.estimates ALTER COLUMN public_token SET DEFAULT NULL;

-- 2. Clear public_token on estimates that have never been explicitly sent/shared
-- (if sent_at is NULL, the token was auto-generated, not intentionally shared)
UPDATE public.estimates 
SET public_token = NULL 
WHERE public_token IS NOT NULL 
  AND sent_at IS NULL 
  AND signed_at IS NULL 
  AND viewed_at IS NULL;

-- 3. Drop the overly permissive invoice_payment_sessions policies
DROP POLICY IF EXISTS "Authenticated users can create payment sessions" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Authenticated users can update payment sessions" ON public.invoice_payment_sessions;
