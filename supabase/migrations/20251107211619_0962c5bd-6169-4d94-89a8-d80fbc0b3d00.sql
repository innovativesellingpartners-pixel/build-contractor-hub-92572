-- Add QuickBooks connection fields to profiles table (contractor model)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qb_realm_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qb_access_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qb_refresh_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qb_access_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qb_refresh_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qb_last_sync_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.qb_access_token IS 'Encrypted QuickBooks access token - server only';
COMMENT ON COLUMN public.profiles.qb_refresh_token IS 'Encrypted QuickBooks refresh token - server only';