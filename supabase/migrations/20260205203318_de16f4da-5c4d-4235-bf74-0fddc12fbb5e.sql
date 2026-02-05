-- Add waiver type field to estimates table
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS selected_waiver_type text;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS selected_waiver_amount numeric;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS selected_waiver_billing_period_end date;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS selected_waiver_retainage numeric;

-- Add comments for documentation
COMMENT ON COLUMN public.estimates.selected_waiver_type IS 'Type of lien waiver to include: conditional_progress, unconditional_progress, conditional_final, unconditional_final';
COMMENT ON COLUMN public.estimates.selected_waiver_amount IS 'Amount for the selected waiver';
COMMENT ON COLUMN public.estimates.selected_waiver_billing_period_end IS 'Billing period end date for the waiver';
COMMENT ON COLUMN public.estimates.selected_waiver_retainage IS 'Retainage amount for the waiver';