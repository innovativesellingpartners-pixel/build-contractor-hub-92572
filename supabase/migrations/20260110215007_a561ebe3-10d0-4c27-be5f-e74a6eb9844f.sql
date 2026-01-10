-- Add signature and signing fields to invoice_waivers table
ALTER TABLE public.invoice_waivers 
ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS signer_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS signer_title TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.invoice_waivers.signature_data IS 'Base64 encoded signature image data';
COMMENT ON COLUMN public.invoice_waivers.signed_at IS 'Timestamp when the waiver was digitally signed';
COMMENT ON COLUMN public.invoice_waivers.signer_name IS 'Printed name of the person who signed';
COMMENT ON COLUMN public.invoice_waivers.signer_title IS 'Title/position of the person who signed';