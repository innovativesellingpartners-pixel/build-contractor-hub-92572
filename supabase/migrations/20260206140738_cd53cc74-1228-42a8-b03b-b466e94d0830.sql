-- Update the generate_invoice_number function to use 6-digit format starting at 119
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  max_existing INTEGER;
BEGIN
  -- Get the maximum existing invoice number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0)
  INTO max_existing
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  -- Start at 119 if no invoices exist or max is less than 119
  IF max_existing < 119 THEN
    next_num := 119;
  ELSE
    next_num := max_existing + 1;
  END IF;
  
  -- Return with 6-digit padding (e.g., INV-000119)
  RETURN 'INV-' || LPAD(next_num::TEXT, 6, '0');
END;
$function$;