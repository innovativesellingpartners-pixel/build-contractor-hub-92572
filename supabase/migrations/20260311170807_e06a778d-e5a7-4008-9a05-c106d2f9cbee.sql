
-- Harden signatures INSERT policy to also validate the caller knows the public_token value
DROP POLICY IF EXISTS "Public can create signatures for public estimates" ON public.signatures;
CREATE POLICY "Public can create signatures for public estimates"
  ON public.signatures FOR INSERT
  TO public
  WITH CHECK (
    estimate_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.estimates
      WHERE estimates.id = signatures.estimate_id
        AND estimates.public_token IS NOT NULL
        AND (estimates.public_token)::text = get_request_token()
        AND (estimates.expires_at IS NULL OR estimates.expires_at > now())
        AND estimates.voided_at IS NULL
    )
  );
