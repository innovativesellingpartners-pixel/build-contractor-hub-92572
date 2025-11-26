-- Extend profiles table with Stripe and currency fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'usd';

-- Create bank_account_links table for Plaid integration
CREATE TABLE IF NOT EXISTS public.bank_account_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL,
  plaid_access_token_encrypted BYTEA NOT NULL,
  plaid_institution_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on bank_account_links
ALTER TABLE public.bank_account_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_account_links (contractor isolation)
CREATE POLICY "Users can view own bank links" ON public.bank_account_links
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create own bank links" ON public.bank_account_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own bank links" ON public.bank_account_links
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own bank links" ON public.bank_account_links
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create stripe_payment_sessions table for tracking test payments
CREATE TABLE IF NOT EXISTS public.stripe_payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_session_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on stripe_payment_sessions
ALTER TABLE public.stripe_payment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy for stripe_payment_sessions
CREATE POLICY "Users can view own payment sessions" ON public.stripe_payment_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment sessions" ON public.stripe_payment_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on bank_account_links
CREATE OR REPLACE FUNCTION public.update_bank_account_links_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_bank_account_links_updated_at
  BEFORE UPDATE ON public.bank_account_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_account_links_updated_at();