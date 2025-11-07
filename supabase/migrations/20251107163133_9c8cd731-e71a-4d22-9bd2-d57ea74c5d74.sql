-- Ensure RLS and admin visibility for roles, jobs, and customers to fix admin dashboard counts

-- Enable RLS on user_roles, jobs, customers (safe if already enabled)
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

-- user_roles: allow users to view their own role and admins to view all roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view own role'
  ) THEN
    CREATE POLICY "Users can view own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can view all roles'
  ) THEN
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));
  END IF;
END $$;

-- jobs: allow admins to view all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Admins can view all jobs'
  ) THEN
    CREATE POLICY "Admins can view all jobs"
    ON public.jobs
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));
  END IF;
END $$;

-- customers: allow admins to view all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Admins can view all customers'
  ) THEN
    CREATE POLICY "Admins can view all customers"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));
  END IF;
END $$;