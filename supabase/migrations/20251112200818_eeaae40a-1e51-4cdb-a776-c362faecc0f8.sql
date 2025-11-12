-- Create secure function to store encrypted QuickBooks tokens
CREATE OR REPLACE FUNCTION public.store_quickbooks_tokens(
  p_user_id uuid,
  p_realm_id text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamp with time zone,
  p_encryption_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO quickbooks_connections (
    user_id, 
    realm_id, 
    access_token_encrypted, 
    refresh_token_encrypted, 
    expires_at
  )
  VALUES (
    p_user_id,
    p_realm_id,
    pgp_sym_encrypt(p_access_token, p_encryption_key),
    pgp_sym_encrypt(p_refresh_token, p_encryption_key),
    p_expires_at
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    realm_id = EXCLUDED.realm_id,
    access_token_encrypted = EXCLUDED.access_token_encrypted,
    refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
    expires_at = EXCLUDED.expires_at;
END;
$$;

-- Create secure function to retrieve decrypted QuickBooks tokens
CREATE OR REPLACE FUNCTION public.get_quickbooks_tokens(
  p_user_id uuid,
  p_encryption_key text
)
RETURNS TABLE (
  user_id uuid,
  realm_id text,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qc.user_id,
    qc.realm_id,
    pgp_sym_decrypt(qc.access_token_encrypted, p_encryption_key)::text as access_token,
    pgp_sym_decrypt(qc.refresh_token_encrypted, p_encryption_key)::text as refresh_token,
    qc.expires_at
  FROM quickbooks_connections qc
  WHERE qc.user_id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.store_quickbooks_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.get_quickbooks_tokens TO service_role;