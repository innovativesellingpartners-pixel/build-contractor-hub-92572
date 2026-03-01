
-- Add contractor_number column
ALTER TABLE public.contractors ADD COLUMN contractor_number text;

-- Create unique index
CREATE UNIQUE INDEX idx_contractors_contractor_number ON public.contractors (contractor_number);

-- Populate existing contractor (7ffdd1df has CT1000009)
UPDATE public.contractors 
SET contractor_number = 'CT1000009' 
WHERE id = '7ffdd1df-2232-4454-9335-ba6c20dc22b1';

-- Create function to generate next contractor number starting at CT1000012
CREATE OR REPLACE FUNCTION public.generate_contractor_number_for_contractors()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  max_existing INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contractor_number FROM 3) AS INTEGER)), 0)
  INTO max_existing
  FROM public.contractors
  WHERE contractor_number ~ '^CT[0-9]+$';

  -- Minimum start at 1000012
  IF max_existing < 1000012 THEN
    next_num := 1000012;
  ELSE
    next_num := max_existing + 1;
  END IF;

  RETURN 'CT' || next_num::TEXT;
END;
$$;

-- Trigger to auto-assign contractor_number on insert
CREATE OR REPLACE FUNCTION public.ensure_contractor_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.contractor_number IS NULL OR btrim(NEW.contractor_number) = '' THEN
    NEW.contractor_number := public.generate_contractor_number_for_contractors();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_contractor_number
  BEFORE INSERT ON public.contractors
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_contractor_number();
