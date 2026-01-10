-- Ensure job/lead/customer/estimate numbers are always generated

-- 1) Unique indexes (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS jobs_job_number_uniq ON public.jobs (job_number) WHERE job_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leads_lead_number_uniq ON public.leads (lead_number) WHERE lead_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_number_uniq ON public.customers (customer_number) WHERE customer_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS estimates_estimate_number_uniq ON public.estimates (estimate_number) WHERE estimate_number IS NOT NULL;

-- 2) Trigger functions
CREATE OR REPLACE FUNCTION public.ensure_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL OR btrim(NEW.job_number) = '' THEN
    NEW.job_number := public.generate_job_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ensure_lead_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_number IS NULL OR btrim(NEW.lead_number) = '' THEN
    NEW.lead_number := public.generate_lead_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ensure_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_number IS NULL OR btrim(NEW.customer_number) = '' THEN
    NEW.customer_number := public.generate_customer_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ensure_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR btrim(NEW.estimate_number) = '' THEN
    NEW.estimate_number := public.generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Triggers (drop/recreate for idempotency)
DROP TRIGGER IF EXISTS trg_ensure_job_number ON public.jobs;
CREATE TRIGGER trg_ensure_job_number
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.ensure_job_number();

DROP TRIGGER IF EXISTS trg_ensure_lead_number ON public.leads;
CREATE TRIGGER trg_ensure_lead_number
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.ensure_lead_number();

DROP TRIGGER IF EXISTS trg_ensure_customer_number ON public.customers;
CREATE TRIGGER trg_ensure_customer_number
BEFORE INSERT ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.ensure_customer_number();

DROP TRIGGER IF EXISTS trg_ensure_estimate_number ON public.estimates;
CREATE TRIGGER trg_ensure_estimate_number
BEFORE INSERT ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.ensure_estimate_number();
