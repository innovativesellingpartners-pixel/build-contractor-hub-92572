-- Add missing columns to estimates table for complete estimate data
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS site_address TEXT,
ADD COLUMN IF NOT EXISTS trade_type TEXT,
ADD COLUMN IF NOT EXISTS project_description TEXT,
ADD COLUMN IF NOT EXISTS assumptions_and_exclusions TEXT,
ADD COLUMN IF NOT EXISTS cost_summary JSONB,
ADD COLUMN IF NOT EXISTS trade_specific JSONB,
ADD COLUMN IF NOT EXISTS contractor_signature TEXT,
ADD COLUMN IF NOT EXISTS client_signature TEXT;

-- Add index on client_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimates_client_email ON public.estimates(client_email);

-- Add comment for documentation
COMMENT ON COLUMN public.estimates.client_email IS 'Client email address for sending estimates';