
-- Job budget line items: maps estimate line items to per-job budget lines
CREATE TABLE public.job_budget_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  estimate_line_item_index INT, -- position in original estimate line_items JSON
  description TEXT NOT NULL,
  item_code TEXT,
  category TEXT DEFAULT 'General',
  budgeted_quantity NUMERIC DEFAULT 1,
  budgeted_unit_price NUMERIC DEFAULT 0,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  variance_amount NUMERIC GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED,
  variance_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN budgeted_amount > 0 THEN ROUND(((budgeted_amount - actual_amount) / budgeted_amount) * 100, 2) ELSE 0 END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_budget_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budget line items"
  ON public.job_budget_line_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_job_budget_line_items_job ON public.job_budget_line_items(job_id);

-- Budget alert thresholds per job
CREATE TABLE public.job_budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'threshold', -- 'threshold', 'overrun', 'forecast'
  threshold_percent NUMERIC DEFAULT 80,
  triggered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budget alerts"
  ON public.job_budget_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_job_budget_alerts_job ON public.job_budget_alerts(job_id);

-- Add budget tracking fields to jobs if not present
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS budget_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS budget_source TEXT DEFAULT 'estimate',
  ADD COLUMN IF NOT EXISTS budget_override_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_alert_threshold NUMERIC DEFAULT 80,
  ADD COLUMN IF NOT EXISTS forecasted_final_cost NUMERIC;

-- Trigger to auto-update updated_at on budget line items
CREATE TRIGGER update_job_budget_line_items_updated_at
  BEFORE UPDATE ON public.job_budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
