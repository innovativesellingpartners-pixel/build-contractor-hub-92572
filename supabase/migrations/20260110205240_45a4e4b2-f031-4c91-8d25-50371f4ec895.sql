-- Fix linter: set immutable search_path on newly added trigger functions

CREATE OR REPLACE FUNCTION public.ensure_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL OR btrim(NEW.job_number) = '' THEN
    NEW.job_number := public.generate_job_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.ensure_lead_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_number IS NULL OR btrim(NEW.lead_number) = '' THEN
    NEW.lead_number := public.generate_lead_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.ensure_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_number IS NULL OR btrim(NEW.customer_number) = '' THEN
    NEW.customer_number := public.generate_customer_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.ensure_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR btrim(NEW.estimate_number) = '' THEN
    NEW.estimate_number := public.generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
