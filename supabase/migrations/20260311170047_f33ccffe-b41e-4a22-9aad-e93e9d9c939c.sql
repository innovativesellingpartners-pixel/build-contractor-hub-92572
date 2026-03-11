
-- Helper function to get the portal token from request headers (set by frontend via supabase RPC or headers)
CREATE OR REPLACE FUNCTION public.get_request_token()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'x-portal-token',
    current_setting('app.public_token', true)
  );
$$;

-- 1. Fix estimates: require caller to supply the actual public_token value
DROP POLICY IF EXISTS "Public can view estimates with valid public_token" ON public.estimates;
CREATE POLICY "Public can view estimates with valid public_token"
  ON public.estimates
  FOR SELECT
  TO public
  USING (
    public_token IS NOT NULL
    AND public_token::text = get_request_token()
    AND (expires_at IS NULL OR expires_at > now())
    AND voided_at IS NULL
  );

-- 2. Fix portal_messages: require caller to supply the actual token value
DROP POLICY IF EXISTS "Public read portal messages via active token" ON public.portal_messages;
CREATE POLICY "Public read portal messages via active token"
  ON public.portal_messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM customer_portal_tokens pt
      WHERE pt.id = portal_messages.portal_token_id
        AND pt.is_active = true
        AND pt.token = get_request_token()
    )
  );

-- 3. Fix job_photos: require caller to supply the actual token value
DROP POLICY IF EXISTS "Public read job_photos via portal token" ON public.job_photos;
CREATE POLICY "Public read job_photos via portal token"
  ON public.job_photos
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM customer_portal_tokens pt
      WHERE pt.job_id = job_photos.job_id
        AND pt.is_active = true
        AND pt.token = get_request_token()
    )
  );

-- 4. Fix portal_photo_uploads: require caller to supply the actual token value
DROP POLICY IF EXISTS "Public read portal photos via active token" ON public.portal_photo_uploads;
CREATE POLICY "Public read portal photos via active token"
  ON public.portal_photo_uploads
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM customer_portal_tokens pt
      WHERE pt.id = portal_photo_uploads.portal_token_id
        AND pt.is_active = true
        AND pt.token = get_request_token()
    )
  );
