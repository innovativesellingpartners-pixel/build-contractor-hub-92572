-- Extend estimates table with new professional fields
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS date_issued timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS prepared_by text,
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS project_address text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS scope_objective text,
  ADD COLUMN IF NOT EXISTS scope_key_deliverables jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scope_exclusions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scope_timeline text,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS permit_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terms_validity text,
  ADD COLUMN IF NOT EXISTS terms_payment_schedule text,
  ADD COLUMN IF NOT EXISTS terms_change_orders text,
  ADD COLUMN IF NOT EXISTS terms_insurance text,
  ADD COLUMN IF NOT EXISTS terms_warranty_years integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS client_printed_name text,
  ADD COLUMN IF NOT EXISTS client_acceptance_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS contractor_printed_name text,
  ADD COLUMN IF NOT EXISTS contractor_acceptance_date timestamp with time zone;

-- Update line_items structure to support enhanced fields
-- line_items is jsonb, so we'll document the expected structure:
-- [{
--   itemNumber: "1.1",
--   description: "...",
--   quantity: 10,
--   unit: "SF",
--   unitPrice: 25.00,
--   totalPrice: 250.00,
--   included: true
-- }]

-- Add index on public_token for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_estimates_public_token ON public.estimates(public_token);

-- Add RLS policy for public estimate viewing
CREATE POLICY "Anyone can view estimates by public token"
ON public.estimates
FOR SELECT
USING (public_token IS NOT NULL);