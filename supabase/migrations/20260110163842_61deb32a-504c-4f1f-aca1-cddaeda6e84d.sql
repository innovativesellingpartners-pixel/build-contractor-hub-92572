-- Add source_other column to leads table for custom "Other" source text
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_other text;

-- Add comment for clarity
COMMENT ON COLUMN public.leads.source_other IS 'Custom text when lead source is "Other"';