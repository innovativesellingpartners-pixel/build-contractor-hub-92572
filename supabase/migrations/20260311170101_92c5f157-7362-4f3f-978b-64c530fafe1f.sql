
CREATE OR REPLACE FUNCTION public.get_request_token()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'x-portal-token',
    current_setting('app.public_token', true)
  );
$$;
