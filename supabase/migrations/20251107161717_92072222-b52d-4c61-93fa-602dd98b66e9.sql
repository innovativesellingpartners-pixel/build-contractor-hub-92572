-- Fix RLS to allow admins to view all customers and jobs; idempotent checks using pg_policies.policyname

-- Customers table policies
DO $$
BEGIN
  IF to_regclass('public.customers') IS NOT NULL THEN
    -- Enable RLS (idempotent)
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    -- Admins can view all customers
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Admins can view all customers'
    ) THEN
      CREATE POLICY "Admins can view all customers"
      ON public.customers
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
    END IF;

    -- Users can view own customers
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Users can view own customers'
    ) THEN
      CREATE POLICY "Users can view own customers"
      ON public.customers
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- Jobs table policies
DO $$
BEGIN
  IF to_regclass('public.jobs') IS NOT NULL THEN
    -- Enable RLS (idempotent)
    ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

    -- Admins can view all jobs
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Admins can view all jobs'
    ) THEN
      CREATE POLICY "Admins can view all jobs"
      ON public.jobs
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
    END IF;

    -- Users can view own jobs
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Users can view own jobs'
    ) THEN
      CREATE POLICY "Users can view own jobs"
      ON public.jobs
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;
