-- Phase 1: AI Voice Receptionist Database Schema Extensions

-- 1. Extend calls table with AI-specific columns
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS ai_handled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS message_type TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS customer_info JSONB,
ADD COLUMN IF NOT EXISTS follow_up_action TEXT,
ADD COLUMN IF NOT EXISTS forwarded_to_contractor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contractor_answered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_backup_triggered BOOLEAN DEFAULT false;

-- Add index for AI call queries
CREATE INDEX IF NOT EXISTS idx_calls_ai_handled ON public.calls(ai_handled, contractor_id);
CREATE INDEX IF NOT EXISTS idx_calls_message_type ON public.calls(message_type) WHERE message_type IS NOT NULL;

-- 2. Create contractor_ai_profiles table
CREATE TABLE IF NOT EXISTS public.contractor_ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Identity
  business_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  trade TEXT NOT NULL,
  service_description TEXT,
  license_number TEXT,
  
  -- Services
  services_offered TEXT[],
  services_not_offered TEXT[],
  pricing_rules TEXT,
  service_area TEXT[],
  
  -- Availability
  business_hours JSONB,
  emergency_availability BOOLEAN DEFAULT false,
  emergency_hours JSONB,
  
  -- Calendar Integration
  google_calendar_enabled BOOLEAN DEFAULT false,
  google_calendar_id TEXT,
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expires_at TIMESTAMPTZ,
  
  -- AI Behavior
  ai_enabled BOOLEAN DEFAULT true,
  forward_attempts INTEGER DEFAULT 2,
  forward_timeout_seconds INTEGER DEFAULT 20,
  custom_greeting TEXT,
  custom_instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_contractor_ai_profile UNIQUE(contractor_id)
);

-- Enable RLS on contractor_ai_profiles
ALTER TABLE public.contractor_ai_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_ai_profiles
CREATE POLICY "Contractors manage own AI profile"
  ON public.contractor_ai_profiles
  FOR ALL
  USING (auth.uid() = contractor_id);

CREATE POLICY "Admins can view all AI profiles"
  ON public.contractor_ai_profiles
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can update all AI profiles"
  ON public.contractor_ai_profiles
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'super_admin')
  );

-- Add trigger for updated_at
CREATE TRIGGER update_contractor_ai_profiles_updated_at
  BEFORE UPDATE ON public.contractor_ai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 3. Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_busy BOOLEAN DEFAULT true,
  event_type TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast availability queries
CREATE INDEX IF NOT EXISTS idx_calendar_contractor ON public.calendar_events(contractor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_time_range ON public.calendar_events(contractor_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_availability ON public.calendar_events(contractor_id, is_busy, start_time);

-- Enable RLS on calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Contractors can view own calendar events"
  ON public.calendar_events
  FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can manage own calendar events"
  ON public.calendar_events
  FOR ALL
  USING (auth.uid() = contractor_id);

CREATE POLICY "Admins can view all calendar events"
  ON public.calendar_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'super_admin')
  );

-- 4. Create ai_call_actions table
CREATE TABLE IF NOT EXISTS public.ai_call_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Links to CRM entities
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_action_type CHECK (
    action_type IN ('schedule_estimate', 'callback_4h', 'take_message', 'emergency_dispatch', 'general_info')
  )
);

-- Index for tracking pending actions
CREATE INDEX IF NOT EXISTS idx_ai_actions_pending ON public.ai_call_actions(contractor_id, completed) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_ai_actions_call ON public.ai_call_actions(call_id);

-- Enable RLS on ai_call_actions
ALTER TABLE public.ai_call_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_call_actions
CREATE POLICY "Contractors can view own AI actions"
  ON public.ai_call_actions
  FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update own AI actions"
  ON public.ai_call_actions
  FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Admins can view all AI actions"
  ON public.ai_call_actions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'super_admin')
  );

-- Add comments for documentation
COMMENT ON TABLE public.contractor_ai_profiles IS 'Stores AI assistant configuration and contractor identity for personalized phone interactions';
COMMENT ON TABLE public.calendar_events IS 'Cached Google Calendar events for fast availability lookups during AI calls';
COMMENT ON TABLE public.ai_call_actions IS 'Tracks commitments made by AI during phone calls (callbacks, appointments, etc)';

COMMENT ON COLUMN public.calls.ai_handled IS 'Whether the AI assistant handled this call instead of going to voicemail';
COMMENT ON COLUMN public.calls.message_type IS 'Type of call: voicemail, schedule_request, callback_request, general_qa, emergency';
COMMENT ON COLUMN public.calls.forwarded_to_contractor IS 'Whether call was first forwarded to contractor personal phone';
COMMENT ON COLUMN public.calls.contractor_answered IS 'Whether contractor answered the forwarded call';
COMMENT ON COLUMN public.calls.ai_backup_triggered IS 'Whether AI took over after contractor did not answer';