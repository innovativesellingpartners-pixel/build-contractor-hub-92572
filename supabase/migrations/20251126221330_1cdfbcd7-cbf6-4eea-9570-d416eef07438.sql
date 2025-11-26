-- Extend leads table
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id),
  ADD COLUMN IF NOT EXISTS converted_to_customer boolean DEFAULT false;

-- Add index for customer lookup
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);

-- Extend customers table
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS lifetime_value numeric DEFAULT 0;

-- Extend estimates table (lead_id should already exist based on relationships)
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id);

CREATE INDEX IF NOT EXISTS idx_estimates_lead_id ON public.estimates(lead_id);

-- Extend jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS original_estimate_id uuid REFERENCES public.estimates(id),
  ADD COLUMN IF NOT EXISTS contract_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_orders_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_contract_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payments_collected numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenses_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit numeric DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_jobs_original_estimate_id ON public.jobs(original_estimate_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  amount numeric NOT NULL,
  fee_amount numeric DEFAULT 0,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_contractor_id ON public.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_estimate_id ON public.payments(estimate_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Contractors can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = contractor_id);

-- Create expenses table (if not exists)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  category text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  description text,
  receipt_url text,
  notes text,
  plaid_transaction_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_contractor_id ON public.expenses(contractor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_job_id ON public.expenses(job_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Contractors can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = contractor_id);

-- Function to update job totals when payments change
CREATE OR REPLACE FUNCTION update_job_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET 
      payments_collected = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE job_id = OLD.job_id AND status = 'succeeded'
      ), 0),
      profit = payments_collected - expenses_total
    WHERE id = OLD.job_id;
    
    -- Update customer lifetime value
    IF OLD.customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET lifetime_value = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE customer_id = OLD.customer_id AND status = 'succeeded'
      ), 0)
      WHERE id = OLD.customer_id;
    END IF;
    
    RETURN OLD;
  ELSE
    UPDATE public.jobs
    SET 
      payments_collected = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE job_id = NEW.job_id AND status = 'succeeded'
      ), 0),
      profit = payments_collected - expenses_total
    WHERE id = NEW.job_id;
    
    -- Update customer lifetime value
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET lifetime_value = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE customer_id = NEW.customer_id AND status = 'succeeded'
      ), 0)
      WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for payment changes
DROP TRIGGER IF EXISTS trigger_update_job_payment_totals ON public.payments;
CREATE TRIGGER trigger_update_job_payment_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_payment_totals();

-- Function to update job totals when expenses change
CREATE OR REPLACE FUNCTION update_job_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.job_id IS NOT NULL THEN
      UPDATE public.jobs
      SET 
        expenses_total = COALESCE((
          SELECT SUM(amount)
          FROM public.expenses
          WHERE job_id = OLD.job_id
        ), 0),
        profit = payments_collected - expenses_total
      WHERE id = OLD.job_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.job_id IS NOT NULL THEN
      UPDATE public.jobs
      SET 
        expenses_total = COALESCE((
          SELECT SUM(amount)
          FROM public.expenses
          WHERE job_id = NEW.job_id
        ), 0),
        profit = payments_collected - expenses_total
      WHERE id = NEW.job_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for expense changes
DROP TRIGGER IF EXISTS trigger_update_job_expense_totals ON public.expenses;
CREATE TRIGGER trigger_update_job_expense_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_job_expense_totals();

-- Function to update job totals when change orders change
CREATE OR REPLACE FUNCTION update_job_change_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET 
      change_orders_total = COALESCE((
        SELECT SUM(additional_cost)
        FROM public.change_orders
        WHERE job_id = OLD.job_id AND status = 'approved'
      ), 0),
      total_contract_value = contract_value + change_orders_total
    WHERE id = OLD.job_id;
    RETURN OLD;
  ELSE
    UPDATE public.jobs
    SET 
      change_orders_total = COALESCE((
        SELECT SUM(additional_cost)
        FROM public.change_orders
        WHERE job_id = NEW.job_id AND status = 'approved'
      ), 0),
      total_contract_value = contract_value + change_orders_total
    WHERE id = NEW.job_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for change order changes
DROP TRIGGER IF EXISTS trigger_update_job_change_order_totals ON public.change_orders;
CREATE TRIGGER trigger_update_job_change_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_job_change_order_totals();