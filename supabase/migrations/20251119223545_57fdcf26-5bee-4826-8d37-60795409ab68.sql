-- Add missing fields to contractor_ai_profiles table
ALTER TABLE public.contractor_ai_profiles
  ADD COLUMN IF NOT EXISTS allow_pricing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS calendar_type text,
  ADD COLUMN IF NOT EXISTS calendar_email text,
  ADD COLUMN IF NOT EXISTS default_meeting_length integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS booking_buffer_minutes integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS preferred_meeting_types text[] DEFAULT ARRAY['phone']::text[],
  ADD COLUMN IF NOT EXISTS inbound_call_mode text DEFAULT 'ai_assistant',
  ADD COLUMN IF NOT EXISTS voice_id text DEFAULT 'pocketbot',
  ADD COLUMN IF NOT EXISTS confirmation_message_template text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Add check constraint for inbound_call_mode
ALTER TABLE public.contractor_ai_profiles
  DROP CONSTRAINT IF EXISTS contractor_ai_profiles_inbound_call_mode_check;

ALTER TABLE public.contractor_ai_profiles
  ADD CONSTRAINT contractor_ai_profiles_inbound_call_mode_check 
  CHECK (inbound_call_mode IN ('ai_assistant', 'voicemail_only'));

-- Add check constraint for calendar_type
ALTER TABLE public.contractor_ai_profiles
  DROP CONSTRAINT IF EXISTS contractor_ai_profiles_calendar_type_check;

ALTER TABLE public.contractor_ai_profiles
  ADD CONSTRAINT contractor_ai_profiles_calendar_type_check 
  CHECK (calendar_type IS NULL OR calendar_type IN ('google', 'outlook', 'other'));

-- Ensure unique constraint on contractor_id
ALTER TABLE public.contractor_ai_profiles
  DROP CONSTRAINT IF EXISTS contractor_ai_profiles_contractor_id_key;

ALTER TABLE public.contractor_ai_profiles
  ADD CONSTRAINT contractor_ai_profiles_contractor_id_key 
  UNIQUE (contractor_id);