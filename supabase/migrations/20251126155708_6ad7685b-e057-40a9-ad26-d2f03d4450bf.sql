
-- Grant super admins full access to customers
CREATE POLICY "Super admins can update all customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all customers"
ON public.customers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Grant super admins full access to jobs
CREATE POLICY "Super admins can update all jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can create jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Grant super admins full access to estimates
CREATE POLICY "Super admins can update all estimates"
ON public.estimates
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all estimates"
ON public.estimates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can create estimates"
ON public.estimates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));
