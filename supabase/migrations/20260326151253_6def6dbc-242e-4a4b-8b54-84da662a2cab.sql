-- Add missing columns to daily_logs for enhanced field reporting
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS crew_on_site JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS issues_delays TEXT;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS client_visible BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS signed_by TEXT;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Add index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_daily_logs_job_date ON public.daily_logs (job_id, log_date);