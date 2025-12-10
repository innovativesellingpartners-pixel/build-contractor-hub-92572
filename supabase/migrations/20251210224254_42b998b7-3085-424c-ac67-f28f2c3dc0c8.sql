-- Create invoice_waivers table for lien waiver management
CREATE TABLE public.invoice_waivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  gc_id UUID REFERENCES public.gc_contacts(id) ON DELETE SET NULL,
  waiver_type TEXT NOT NULL CHECK (waiver_type IN ('conditional_progress', 'unconditional_progress', 'conditional_final', 'unconditional_final')),
  amount NUMERIC NOT NULL DEFAULT 0,
  billing_period_start DATE,
  billing_period_end DATE,
  retainage NUMERIC DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.invoice_waivers ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_waivers
CREATE POLICY "Users can view own invoice waivers"
  ON public.invoice_waivers FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create invoice waivers"
  ON public.invoice_waivers FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own invoice waivers"
  ON public.invoice_waivers FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own invoice waivers"
  ON public.invoice_waivers FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all invoice waivers"
  ON public.invoice_waivers FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create index for faster lookups
CREATE INDEX idx_invoice_waivers_invoice_id ON public.invoice_waivers(invoice_id);
CREATE INDEX idx_invoice_waivers_created_by ON public.invoice_waivers(created_by);