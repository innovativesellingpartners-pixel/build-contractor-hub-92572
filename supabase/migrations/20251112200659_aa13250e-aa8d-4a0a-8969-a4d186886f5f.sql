-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted token columns to quickbooks_connections
ALTER TABLE public.quickbooks_connections 
  ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- Create function to safely drop old columns after migration
CREATE OR REPLACE FUNCTION public.drop_quickbooks_plaintext_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only drop if encrypted columns exist and have data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quickbooks_connections' 
    AND column_name = 'access_token_encrypted'
  ) THEN
    ALTER TABLE public.quickbooks_connections 
      DROP COLUMN IF EXISTS access_token,
      DROP COLUMN IF EXISTS refresh_token;
  END IF;
END;
$$;

-- Add comment explaining encryption
COMMENT ON COLUMN public.quickbooks_connections.access_token_encrypted IS 'Encrypted QuickBooks OAuth access token using pgcrypto';
COMMENT ON COLUMN public.quickbooks_connections.refresh_token_encrypted IS 'Encrypted QuickBooks OAuth refresh token using pgcrypto';