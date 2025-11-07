-- Add additional SELECT policies based on has_full_access to support org-level admins
CREATE POLICY "Full access users can view all customers"
ON public.customers
FOR SELECT
USING (public.has_full_access(auth.uid()));

CREATE POLICY "Full access users can view all jobs"
ON public.jobs
FOR SELECT
USING (public.has_full_access(auth.uid()));

-- Ensure leads already covered; add if missing (will error if exists)
CREATE POLICY "Full access users can view all leads"
ON public.leads
FOR SELECT
USING (public.has_full_access(auth.uid()));