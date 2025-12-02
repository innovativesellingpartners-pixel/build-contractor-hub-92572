-- Create job_meetings table to store scheduled meetings/site visits for jobs
CREATE TABLE public.job_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'site_visit',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  notes TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own job meetings"
ON public.job_meetings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job meetings"
ON public.job_meetings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job meetings"
ON public.job_meetings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job meetings"
ON public.job_meetings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_job_meetings_updated_at
BEFORE UPDATE ON public.job_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();