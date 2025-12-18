-- Add job_id and caller_name to call_sessions for linking calls to jobs
ALTER TABLE public.call_sessions 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS caller_name TEXT;

-- Add index for faster job lookups
CREATE INDEX IF NOT EXISTS idx_call_sessions_job_id ON public.call_sessions(job_id);

-- Add index for phone number search
CREATE INDEX IF NOT EXISTS idx_call_sessions_from_number ON public.call_sessions(from_number);