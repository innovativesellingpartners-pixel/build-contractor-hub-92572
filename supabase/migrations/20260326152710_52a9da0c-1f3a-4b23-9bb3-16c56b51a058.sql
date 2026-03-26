
-- Create job_cost_alerts table
CREATE TABLE public.job_cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_percent NUMERIC,
  current_percent NUMERIC,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_job_cost_alerts_user_id ON public.job_cost_alerts(user_id);
CREATE INDEX idx_job_cost_alerts_job_id ON public.job_cost_alerts(job_id);
CREATE INDEX idx_job_cost_alerts_unread ON public.job_cost_alerts(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.job_cost_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own alerts"
  ON public.job_cost_alerts FOR SELECT
  TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Users can update own alerts"
  ON public.job_cost_alerts FOR UPDATE
  TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Service role can insert alerts"
  ON public.job_cost_alerts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_contractor_member(user_id));

-- Create check_job_profitability function
CREATE OR REPLACE FUNCTION public.check_job_profitability(p_job_id UUID)
RETURNS TABLE(
  estimated_total NUMERIC,
  actual_total NUMERIC,
  variance_percent NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_estimated NUMERIC;
  v_actual NUMERIC;
  v_variance NUMERIC;
  v_status TEXT;
BEGIN
  -- Get estimated total from job budget or contract value
  SELECT COALESCE(j.budget_amount, j.contract_value, 0)
  INTO v_estimated
  FROM public.jobs j
  WHERE j.id = p_job_id;

  -- Get actual total from expenses + job_costs
  SELECT COALESCE(SUM(amount), 0)
  INTO v_actual
  FROM (
    SELECT amount FROM public.expenses WHERE job_id = p_job_id
    UNION ALL
    SELECT amount FROM public.job_costs WHERE job_id = p_job_id
  ) combined;

  -- Calculate variance
  IF v_estimated > 0 THEN
    v_variance := ((v_actual - v_estimated) / v_estimated) * 100;
  ELSE
    v_variance := 0;
  END IF;

  -- Determine status
  IF v_variance <= 0 THEN
    v_status := 'on_track';
  ELSIF v_variance <= 15 THEN
    v_status := 'warning';
  ELSE
    v_status := 'over_budget';
  END IF;

  RETURN QUERY SELECT v_estimated, v_actual, v_variance, v_status;
END;
$$;
