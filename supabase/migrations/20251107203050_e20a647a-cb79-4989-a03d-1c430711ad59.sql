-- Enable RLS and add admin/user SELECT policies for jobs and customers (idempotent)

-- Jobs table RLS
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Admins can view all jobs'
  ) THEN
    CREATE POLICY "Admins can view all jobs"
      ON public.jobs
      FOR SELECT
      USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Users can view own jobs'
  ) THEN
    CREATE POLICY "Users can view own jobs"
      ON public.jobs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Customers table RLS
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Admins can view all customers'
  ) THEN
    CREATE POLICY "Admins can view all customers"
      ON public.customers
      FOR SELECT
      USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Users can view own customers'
  ) THEN
    CREATE POLICY "Users can view own customers"
      ON public.customers
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;