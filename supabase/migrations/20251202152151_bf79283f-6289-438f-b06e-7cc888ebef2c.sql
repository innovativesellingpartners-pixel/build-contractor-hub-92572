-- Add job_id column to estimates table for bidirectional linking
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id);

-- Add missing columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS fee_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Create index for estimate-job lookup
CREATE INDEX IF NOT EXISTS idx_estimates_job_id ON public.estimates(job_id);

-- Attach trigger to expenses table for auto-updating job totals
DROP TRIGGER IF EXISTS update_job_expense_totals_trigger ON public.expenses;
CREATE TRIGGER update_job_expense_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_job_expense_totals();

-- Attach trigger to payments table for auto-updating job payment totals
DROP TRIGGER IF EXISTS update_job_payment_totals_trigger ON public.payments;
CREATE TRIGGER update_job_payment_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_job_payment_totals();