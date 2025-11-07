-- Ensure admins/super_admins can aggregate Jobs and Customers across the platform
-- Safe, idempotent-style migration

-- Enable RLS (no-op if already enabled)
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

-- Create admin SELECT policies for jobs and customers if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'jobs' 
      AND policyname = 'Admins can view all jobs'
  ) THEN
    CREATE POLICY "Admins can view all jobs"
    ON public.jobs
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'customers' 
      AND policyname = 'Admins can view all customers'
  ) THEN
    CREATE POLICY "Admins can view all customers"
    ON public.customers
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    );
  END IF;

  -- Ensure leads policy exists (won't duplicate if already present)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'leads' 
      AND policyname = 'Admins can view all leads'
  ) THEN
    CREATE POLICY "Admins can view all leads"
    ON public.leads
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    );
  END IF;
END $$;

-- Optional: ensure basic self-view policies exist to avoid locking out regular users (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'jobs' 
      AND policyname = 'Users can view own jobs'
  ) THEN
    CREATE POLICY "Users can view own jobs"
    ON public.jobs
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'customers' 
      AND policyname = 'Users can view own customers'
  ) THEN
    CREATE POLICY "Users can view own customers"
    ON public.customers
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;
