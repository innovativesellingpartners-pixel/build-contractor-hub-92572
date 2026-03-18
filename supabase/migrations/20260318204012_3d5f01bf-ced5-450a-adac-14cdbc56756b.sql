
-- Assignment audit log table
CREATE TABLE IF NOT EXISTS public.assignment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL, -- 'lead', 'customer', 'job', 'estimate', 'invoice'
  record_id uuid NOT NULL,
  record_name text,
  assigned_by uuid,
  assigned_from uuid,
  assigned_to uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view assignment audit log"
  ON public.assignment_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- System can insert (via trigger with SECURITY DEFINER)
CREATE POLICY "System can insert assignment audit log"
  ON public.assignment_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger function to log user_id changes
CREATE OR REPLACE FUNCTION public.log_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record_name text;
  v_record_type text;
BEGIN
  -- Only fire on user_id change
  IF OLD.user_id IS NOT DISTINCT FROM NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_record_type := TG_ARGV[0];

  -- Get a human-readable name
  CASE v_record_type
    WHEN 'lead' THEN
      v_record_name := COALESCE(NEW.name, NEW.company, 'Lead');
    WHEN 'customer' THEN
      v_record_name := COALESCE(NEW.name, 'Customer');
    WHEN 'job' THEN
      v_record_name := COALESCE(NEW.project_name, NEW.job_number, 'Job');
    WHEN 'estimate' THEN
      v_record_name := COALESCE(NEW.title, NEW.estimate_number, 'Estimate');
    WHEN 'invoice' THEN
      v_record_name := COALESCE(NEW.invoice_number, 'Invoice');
    ELSE
      v_record_name := v_record_type;
  END CASE;

  INSERT INTO public.assignment_audit_log (
    record_type, record_id, record_name,
    assigned_by, assigned_from, assigned_to
  ) VALUES (
    v_record_type, NEW.id, v_record_name,
    auth.uid(), OLD.user_id, NEW.user_id
  );

  RETURN NEW;
END;
$$;

-- Attach triggers
CREATE TRIGGER trg_log_lead_assignment
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change('lead');

CREATE TRIGGER trg_log_customer_assignment
  AFTER UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change('customer');

CREATE TRIGGER trg_log_job_assignment
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change('job');

CREATE TRIGGER trg_log_estimate_assignment
  AFTER UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change('estimate');

CREATE TRIGGER trg_log_invoice_assignment
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_change('invoice');

-- Index for fast lookups
CREATE INDEX idx_assignment_audit_record ON public.assignment_audit_log (record_type, record_id);
CREATE INDEX idx_assignment_audit_created ON public.assignment_audit_log (created_at DESC);
