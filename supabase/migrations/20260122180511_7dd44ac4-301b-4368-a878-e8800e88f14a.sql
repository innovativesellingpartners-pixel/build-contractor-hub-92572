-- Make job_id nullable in job_meetings to support Voice AI scheduled appointments
-- that aren't tied to a specific job yet
ALTER TABLE job_meetings ALTER COLUMN job_id DROP NOT NULL;

-- Add an index on user_id for faster lookups by contractor
CREATE INDEX IF NOT EXISTS idx_job_meetings_user_id ON job_meetings(user_id);

-- Add a source column to track where the meeting came from
ALTER TABLE job_meetings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

COMMENT ON COLUMN job_meetings.source IS 'Source of the meeting: manual, voice_ai, web_booking';