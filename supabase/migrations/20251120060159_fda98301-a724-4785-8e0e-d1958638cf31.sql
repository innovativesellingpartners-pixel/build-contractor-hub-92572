-- Add recording fields to call_sessions table
ALTER TABLE call_sessions 
ADD COLUMN recording_url TEXT,
ADD COLUMN recording_sid TEXT,
ADD COLUMN recording_duration INTEGER,
ADD COLUMN recording_status TEXT DEFAULT 'none';

-- Update contractor AI profile to include recording consent in greeting
UPDATE contractor_ai_profiles 
SET custom_greeting = 'Hi there! Thanks for calling Innovative Selling Partners. This is Sarah. This call may be recorded for quality and training purposes. Patrick''s with another customer right now, but I''m here to help. What''s going on at your place today?',
    forward_timeout_seconds = 0
WHERE contractor_id = '7ffdd1df-2232-4454-9335-ba6c20dc22b1';