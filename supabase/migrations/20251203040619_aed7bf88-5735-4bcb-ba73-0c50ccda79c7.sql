-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add estimate_id to customers table for linear flow: Lead → Estimate → Customer
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS estimate_id uuid REFERENCES public.estimates(id);

-- Create index for estimate_id lookups
CREATE INDEX IF NOT EXISTS idx_customers_estimate_id ON public.customers(estimate_id);

-- Create post_sale_follow_ups table for PSFU stage
CREATE TABLE IF NOT EXISTS public.post_sale_follow_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  next_contact_date date,
  contact_method text,
  notes text,
  outcome text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for PSFU lookups
CREATE INDEX IF NOT EXISTS idx_psfu_job_id ON public.post_sale_follow_ups(job_id);
CREATE INDEX IF NOT EXISTS idx_psfu_customer_id ON public.post_sale_follow_ups(customer_id);
CREATE INDEX IF NOT EXISTS idx_psfu_user_id ON public.post_sale_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_psfu_status ON public.post_sale_follow_ups(status);

-- Enable RLS
ALTER TABLE public.post_sale_follow_ups ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_sale_follow_ups
CREATE POLICY "Users can view own PSFUs" ON public.post_sale_follow_ups
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own PSFUs" ON public.post_sale_follow_ups
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PSFUs" ON public.post_sale_follow_ups
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PSFUs" ON public.post_sale_follow_ups
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all PSFUs" ON public.post_sale_follow_ups
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));

-- Create trigger for updated_at
CREATE TRIGGER update_post_sale_follow_ups_updated_at
BEFORE UPDATE ON public.post_sale_follow_ups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();