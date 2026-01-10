-- Add archived column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Drop existing delete policies and create new super_admin only policies

-- JOBS: Only super_admin can delete
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Only super_admin can delete jobs" ON public.jobs;
CREATE POLICY "Only super_admin can delete jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- LEADS: Only super_admin can delete
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Only super_admin can delete leads" ON public.leads;
CREATE POLICY "Only super_admin can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- CUSTOMERS: Only super_admin can delete
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Only super_admin can delete customers" ON public.customers;
CREATE POLICY "Only super_admin can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- ESTIMATES: Only super_admin can delete
DROP POLICY IF EXISTS "Users can delete their own estimates" ON public.estimates;
DROP POLICY IF EXISTS "Only super_admin can delete estimates" ON public.estimates;
CREATE POLICY "Only super_admin can delete estimates"
ON public.estimates
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));