-- Add archived_at column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add archived_at column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add archived_at column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add archived_at column to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for efficient filtering of non-archived items
CREATE INDEX IF NOT EXISTS idx_customers_archived_at ON public.customers(archived_at);
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON public.leads(archived_at);
CREATE INDEX IF NOT EXISTS idx_jobs_archived_at ON public.jobs(archived_at);
CREATE INDEX IF NOT EXISTS idx_estimates_archived_at ON public.estimates(archived_at);