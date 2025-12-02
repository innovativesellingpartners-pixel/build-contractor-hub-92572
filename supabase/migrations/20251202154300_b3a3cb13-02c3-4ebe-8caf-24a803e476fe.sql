-- Add missing contractor business profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_email text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS default_sales_tax_rate numeric(5,2) DEFAULT 6.00,
ADD COLUMN IF NOT EXISTS default_deposit_percent numeric(5,2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS default_warranty_years integer DEFAULT 2;

-- Add required_deposit_percent to estimates table for storing the percentage
ALTER TABLE public.estimates
ADD COLUMN IF NOT EXISTS required_deposit_percent numeric(5,2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS sales_tax_rate_percent numeric(5,2) DEFAULT 6.00;

-- Create index for faster estimate lookups by status
CREATE INDEX IF NOT EXISTS idx_estimates_status ON public.estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_user_status ON public.estimates(user_id, status);