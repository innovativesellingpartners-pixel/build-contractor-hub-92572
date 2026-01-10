-- Add contractor_twilio_number column to scheduled_sms_reminders for use during cron processing
ALTER TABLE public.scheduled_sms_reminders 
ADD COLUMN IF NOT EXISTS contractor_twilio_number TEXT;