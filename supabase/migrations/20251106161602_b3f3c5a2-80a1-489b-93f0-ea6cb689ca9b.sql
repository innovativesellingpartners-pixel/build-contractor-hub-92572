-- Add email provider tracking fields to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS email_provider_id text,
ADD COLUMN IF NOT EXISTS email_send_error text,
ADD COLUMN IF NOT EXISTS last_send_attempt timestamp with time zone;