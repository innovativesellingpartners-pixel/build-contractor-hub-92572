-- Add missing columns to oauth_states table
ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Rename state_token to state if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oauth_states' AND column_name = 'state_token') THEN
    ALTER TABLE public.oauth_states RENAME COLUMN state_token TO state;
  END IF;
END $$;

-- Make state unique if not already
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'oauth_states_state_key') THEN
    ALTER TABLE public.oauth_states ADD CONSTRAINT oauth_states_state_key UNIQUE (state);
  END IF;
END $$;

-- Add unique constraints for upsert on calendar_connections and email_connections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_connections_user_provider_key'
  ) THEN
    ALTER TABLE public.calendar_connections 
    ADD CONSTRAINT calendar_connections_user_provider_key UNIQUE (user_id, provider);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_connections_user_provider_key'
  ) THEN
    ALTER TABLE public.email_connections 
    ADD CONSTRAINT email_connections_user_provider_key UNIQUE (user_id, provider);
  END IF;
END $$;