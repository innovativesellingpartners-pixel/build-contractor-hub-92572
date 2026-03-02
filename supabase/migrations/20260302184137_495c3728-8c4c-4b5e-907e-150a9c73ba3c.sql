
-- Add unique constraint on email_connections for upsert support
-- First check if it exists, use IF NOT EXISTS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_connections_user_id_provider_key'
  ) THEN
    ALTER TABLE public.email_connections ADD CONSTRAINT email_connections_user_id_provider_key UNIQUE (user_id, provider);
  END IF;
END $$;

-- Add unique constraint on calendar_connections for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_connections_user_id_provider_key'
  ) THEN
    ALTER TABLE public.calendar_connections ADD CONSTRAINT calendar_connections_user_id_provider_key UNIQUE (user_id, provider);
  END IF;
END $$;
