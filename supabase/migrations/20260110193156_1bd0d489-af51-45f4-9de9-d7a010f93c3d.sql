-- Create table for scheduled SMS reminders
CREATE TABLE public.scheduled_sms_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meeting_id UUID NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('immediate', '24_hours', '30_minutes')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  twilio_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for finding pending reminders to send
CREATE INDEX idx_scheduled_sms_pending ON public.scheduled_sms_reminders(scheduled_for, status) WHERE status = 'pending';

-- Add index for user lookups
CREATE INDEX idx_scheduled_sms_user ON public.scheduled_sms_reminders(user_id);

-- Add index for meeting lookups
CREATE INDEX idx_scheduled_sms_meeting ON public.scheduled_sms_reminders(meeting_id);

-- Enable RLS
ALTER TABLE public.scheduled_sms_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminders
CREATE POLICY "Users can view own reminders" ON public.scheduled_sms_reminders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own reminders
CREATE POLICY "Users can insert own reminders" ON public.scheduled_sms_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own reminders
CREATE POLICY "Users can update own reminders" ON public.scheduled_sms_reminders
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own reminders
CREATE POLICY "Users can delete own reminders" ON public.scheduled_sms_reminders
  FOR DELETE USING (auth.uid() = user_id);