-- Create stripe_accounts table for Stripe Connect
CREATE TABLE IF NOT EXISTS public.stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stripe_accounts_contractor_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_accounts
CREATE POLICY "Users can view own stripe account"
  ON public.stripe_accounts FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can insert own stripe account"
  ON public.stripe_accounts FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Users can update own stripe account"
  ON public.stripe_accounts FOR UPDATE
  USING (auth.uid() = contractor_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT,
  stripe_payment_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_contractor_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Super admins can view all payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Create plaid_transactions table
CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  plaid_transaction_id TEXT NOT NULL,
  bank_account_link_id UUID REFERENCES public.bank_account_links(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  category TEXT,
  vendor TEXT,
  description TEXT,
  notes TEXT,
  receipt_url TEXT,
  is_expense BOOLEAN DEFAULT true,
  is_reimbursable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT plaid_transactions_contractor_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(plaid_transaction_id)
);

-- Enable RLS
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plaid_transactions
CREATE POLICY "Users can view own transactions"
  ON public.plaid_transactions FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can insert own transactions"
  ON public.plaid_transactions FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Users can update own transactions"
  ON public.plaid_transactions FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Super admins can view all transactions"
  ON public.plaid_transactions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Add stripe_payment_link to estimates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estimates' AND column_name = 'stripe_payment_link'
  ) THEN
    ALTER TABLE public.estimates ADD COLUMN stripe_payment_link TEXT;
  END IF;
END $$;

-- Add balance_due to invoices if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'balance_due'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN balance_due NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add stripe_payment_link to invoices if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'stripe_payment_link'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN stripe_payment_link TEXT;
  END IF;
END $$;

-- Add stripe_payment_id to invoices if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'stripe_payment_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN stripe_payment_id TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_contractor ON public.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_job ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_contractor ON public.plaid_transactions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_job ON public.plaid_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON public.plaid_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_contractor ON public.stripe_accounts(contractor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_stripe_accounts_updated_at
  BEFORE UPDATE ON public.stripe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_plaid_transactions_updated_at
  BEFORE UPDATE ON public.plaid_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();