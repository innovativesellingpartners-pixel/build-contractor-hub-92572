
CREATE TABLE public.ai_estimate_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  job_type TEXT,
  input_summary TEXT,
  token_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_estimate_usage_user_date ON public.ai_estimate_usage (user_id, generated_at);

ALTER TABLE public.ai_estimate_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_estimate_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_estimate_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
