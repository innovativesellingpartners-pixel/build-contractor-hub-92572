-- Create a function to generate contractor numbers
CREATE OR REPLACE FUNCTION public.generate_contractor_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ct1_contractor_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.profiles
  WHERE ct1_contractor_number ~ '^CT1[0-9]+$';
  
  RETURN 'CT1' || LPAD(next_num::TEXT, 6, '0');
END;
$function$;

-- Create a trigger function to auto-set contractor number on profile creation
CREATE OR REPLACE FUNCTION public.set_contractor_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only set if not already set
  IF NEW.ct1_contractor_number IS NULL THEN
    NEW.ct1_contractor_number := public.generate_contractor_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS set_contractor_number_on_insert ON public.profiles;
CREATE TRIGGER set_contractor_number_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contractor_number();

-- Backfill existing profiles that don't have contractor numbers
DO $$
DECLARE
  profile_record RECORD;
  new_number TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id FROM public.profiles 
    WHERE ct1_contractor_number IS NULL
    ORDER BY created_at ASC
  LOOP
    new_number := public.generate_contractor_number();
    UPDATE public.profiles 
    SET ct1_contractor_number = new_number 
    WHERE id = profile_record.id;
  END LOOP;
END $$;