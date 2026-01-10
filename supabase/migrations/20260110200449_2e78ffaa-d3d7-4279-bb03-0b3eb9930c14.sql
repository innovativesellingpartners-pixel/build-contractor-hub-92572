-- Add lead_number column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_number TEXT UNIQUE;

-- Add customer_number column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_number TEXT UNIQUE;

-- Create function to generate lead number
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_suffix TEXT;
  sequence_num INT;
BEGIN
  year_suffix := to_char(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 'LD[0-9]{2}-([0-9]+)') AS INT)), 0) + 1
  INTO sequence_num
  FROM leads
  WHERE lead_number LIKE 'LD' || year_suffix || '-%';
  
  new_number := 'LD' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Create function to generate customer number
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_suffix TEXT;
  sequence_num INT;
BEGIN
  year_suffix := to_char(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_number FROM 'CU[0-9]{2}-([0-9]+)') AS INT)), 0) + 1
  INTO sequence_num
  FROM customers
  WHERE customer_number LIKE 'CU' || year_suffix || '-%';
  
  new_number := 'CU' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_lead_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_customer_number() TO authenticated;