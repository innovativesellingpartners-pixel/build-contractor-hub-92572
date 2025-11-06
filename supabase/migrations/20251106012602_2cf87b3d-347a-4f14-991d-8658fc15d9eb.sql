-- Fix search_path for generate_job_number function
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.jobs
  WHERE job_number ~ '^JOB-[0-9]+$';
  
  RETURN 'JOB-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Fix search_path for generate_estimate_number function
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.estimates
  WHERE estimate_number ~ '^EST-[0-9]+$';
  
  RETURN 'EST-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;