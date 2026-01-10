-- Add estimate-like fields to change_orders for full workflow support
ALTER TABLE public.change_orders
ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES public.estimates(id),
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS client_printed_name TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_order_number TEXT;

-- Create index for public token lookups
CREATE INDEX IF NOT EXISTS idx_change_orders_public_token ON public.change_orders(public_token);

-- Create index for estimate_id lookups
CREATE INDEX IF NOT EXISTS idx_change_orders_estimate_id ON public.change_orders(estimate_id);

-- Add policy for public access via token (for customer signing)
CREATE POLICY "Public can view change orders by token"
ON public.change_orders
FOR SELECT
USING (public_token IS NOT NULL);

-- Update status enum if needed - add new statuses for workflow
-- We'll use text status with these values: draft, sent, viewed, signed, approved, rejected

-- Create change_order_views table for tracking views
CREATE TABLE IF NOT EXISTS public.change_order_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID REFERENCES public.change_orders(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on change_order_views
ALTER TABLE public.change_order_views ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for tracking views)
CREATE POLICY "Anyone can insert change order views"
ON public.change_order_views
FOR INSERT
WITH CHECK (true);

-- Only owner can view change order views
CREATE POLICY "Users can view their change order views"
ON public.change_order_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.change_orders co 
    WHERE co.id = change_order_id 
    AND co.user_id = auth.uid()
  )
);