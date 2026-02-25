
-- Teller.io bank connections table
CREATE TABLE public.teller_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teller_enrollment_id TEXT NOT NULL,
  teller_access_token_encrypted TEXT NOT NULL,
  institution_name TEXT,
  account_id TEXT,
  account_name TEXT,
  account_type TEXT,
  account_subtype TEXT,
  account_last_four TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.teller_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teller connections"
  ON public.teller_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teller connections"
  ON public.teller_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teller connections"
  ON public.teller_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own teller connections"
  ON public.teller_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Teller transactions table
CREATE TABLE public.teller_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teller_connection_id UUID REFERENCES public.teller_connections(id) ON DELETE SET NULL,
  teller_transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  description TEXT,
  vendor TEXT,
  category TEXT,
  transaction_date DATE NOT NULL,
  status TEXT,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.teller_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teller transactions"
  ON public.teller_transactions FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can insert own teller transactions"
  ON public.teller_transactions FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Users can update own teller transactions"
  ON public.teller_transactions FOR UPDATE
  USING (auth.uid() = contractor_id);

-- Updated_at triggers
CREATE TRIGGER update_teller_connections_updated_at
  BEFORE UPDATE ON public.teller_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_teller_transactions_updated_at
  BEFORE UPDATE ON public.teller_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
