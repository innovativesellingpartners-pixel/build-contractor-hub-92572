-- Create user_meetings table for standalone meetings that don't require a job
CREATE TABLE public.user_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'other',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  notes TEXT,
  calendar_event_id TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_meetings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own meetings
CREATE POLICY "Users can view their own meetings"
  ON public.user_meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meetings"
  ON public.user_meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
  ON public.user_meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
  ON public.user_meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_user_meetings_user_id ON public.user_meetings(user_id);
CREATE INDEX idx_user_meetings_start_time ON public.user_meetings(start_time);
CREATE INDEX idx_user_meetings_job_id ON public.user_meetings(job_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_meetings_updated_at
  BEFORE UPDATE ON public.user_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();