-- Create trigger to auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also fix store_quickbooks_tokens to upsert profiles instead of just update
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
SET search_path TO 'public', 'extensions'
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

  -- Upsert profile to ensure it exists with qb_realm_id
  INSERT INTO profiles (id, user_id, qb_realm_id)
  VALUES (p_user_id, p_user_id, p_realm_id)
  ON CONFLICT (id) DO UPDATE SET qb_realm_id = p_realm_id;
END;
$$;

-- Backfill: create profile rows for any existing users that don't have one
INSERT INTO public.profiles (id, user_id)
SELECT id, id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;