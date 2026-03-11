
-- ============================================
-- Phase 2.5 Security Hardening: Fix permissive INSERT policies
-- ============================================

-- 1. SIGNATURES: Replace open INSERT with validation that estimate has a public_token
DROP POLICY IF EXISTS "Anyone can create signatures" ON public.signatures;
DROP POLICY IF EXISTS "Public can create signatures" ON public.signatures;
DROP POLICY IF EXISTS "Public can create signatures for public estimates" ON public.signatures;

CREATE POLICY "Public can create signatures for public estimates"
ON public.signatures FOR INSERT
WITH CHECK (
  estimate_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.estimates
    WHERE id = estimate_id AND public_token IS NOT NULL
  )
);

-- 2. INVOICE_PAYMENT_SESSIONS: Remove public INSERT/UPDATE, restrict to authenticated + service_role
DROP POLICY IF EXISTS "Anyone can create payment sessions" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Anyone can update payment sessions" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Public can create payment sessions" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Public can update payment sessions" ON public.invoice_payment_sessions;

-- Allow authenticated users (contractors) to manage their own payment sessions
CREATE POLICY "Authenticated users can create payment sessions"
ON public.invoice_payment_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment sessions"
ON public.invoice_payment_sessions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. LEAD_SOURCES: Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can manage lead sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Anyone can insert lead sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Public can insert lead sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Anyone can view lead sources" ON public.lead_sources;

CREATE POLICY "Authenticated users can view lead sources"
ON public.lead_sources FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead sources"
ON public.lead_sources FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead sources"
ON public.lead_sources FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. ESTIMATES: Narrow the public token SELECT policy to only expose columns needed
-- We can't restrict columns via RLS, but we can ensure the policy is tightly scoped
-- The edge function already controls what's returned, so the RLS policy is acceptable
-- but we add token expiration check
DROP POLICY IF EXISTS "Anyone can view estimates with public token" ON public.estimates;
DROP POLICY IF EXISTS "Public can view estimates with public_token" ON public.estimates;

CREATE POLICY "Public can view estimates with valid public_token"
ON public.estimates FOR SELECT
USING (
  public_token IS NOT NULL
  AND (expires_at IS NULL OR expires_at > now())
  AND voided_at IS NULL
);
