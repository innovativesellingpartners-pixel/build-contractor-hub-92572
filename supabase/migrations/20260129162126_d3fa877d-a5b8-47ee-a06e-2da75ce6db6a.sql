-- Add public payment token and enhanced payment tracking to invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
ADD COLUMN IF NOT EXISTS clover_payment_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_intent TEXT,
ADD COLUMN IF NOT EXISTS last_payment_request_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ;

-- Create invoice payment sessions table for idempotency
CREATE TABLE IF NOT EXISTS public.invoice_payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  clover_session_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_intent TEXT CHECK (payment_intent IN ('full', 'remaining')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  clover_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice payment request log
CREATE TABLE IF NOT EXISTS public.invoice_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_email TEXT,
  recipient_phone TEXT,
  amount_requested NUMERIC NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS for invoice_payment_sessions (public read for checkout callbacks)
CREATE POLICY "Allow public read for payment sessions"
  ON public.invoice_payment_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON public.invoice_payment_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for payment callbacks"
  ON public.invoice_payment_sessions FOR UPDATE
  USING (true);

-- RLS for invoice_payment_requests (user can only see their own)
CREATE POLICY "Users can view own payment requests"
  ON public.invoice_payment_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment requests"
  ON public.invoice_payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON public.invoices(public_token);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_sessions_invoice ON public.invoice_payment_sessions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_requests_invoice ON public.invoice_payment_requests(invoice_id);