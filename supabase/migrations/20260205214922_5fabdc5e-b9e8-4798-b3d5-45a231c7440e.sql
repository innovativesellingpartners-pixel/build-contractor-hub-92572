-- Create trigger function to ensure invoice number is set
CREATE OR REPLACE FUNCTION public.ensure_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR btrim(NEW.invoice_number) = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on invoices table
DROP TRIGGER IF EXISTS ensure_invoice_number_trigger ON public.invoices;
CREATE TRIGGER ensure_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_invoice_number();