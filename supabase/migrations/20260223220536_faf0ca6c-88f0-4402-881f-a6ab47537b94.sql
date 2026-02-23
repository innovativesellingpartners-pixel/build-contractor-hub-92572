-- Allow public read of jobs when they have an active portal token
CREATE POLICY "Public read jobs via portal token"
ON public.jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_portal_tokens pt
    WHERE pt.job_id = jobs.id AND pt.is_active = true
  )
);

-- Allow public read of profiles (contractor info) when they have an active portal token
CREATE POLICY "Public read profiles via portal token"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_portal_tokens pt
    WHERE pt.contractor_id = profiles.id AND pt.is_active = true
  )
);

-- Allow public read of customers when they have an active portal token
CREATE POLICY "Public read customers via portal token"
ON public.customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_portal_tokens pt
    WHERE pt.customer_id = customers.id AND pt.is_active = true
  )
);

-- Allow public read of tasks when the task's job has an active portal token
CREATE POLICY "Public read tasks via portal token"
ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_portal_tokens pt
    WHERE pt.job_id = tasks.job_id AND pt.is_active = true
  )
);

-- Allow public read of invoices when the invoice's job has an active portal token
CREATE POLICY "Public read invoices via portal token"
ON public.invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_portal_tokens pt
    WHERE pt.job_id = invoices.job_id AND pt.is_active = true
  )
);

-- Allow public read of job_photos when the photo's job has an active portal token
CREATE POLICY "Public read job_photos via portal token"
ON public.job_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_portal_tokens pt
    WHERE pt.job_id = job_photos.job_id AND pt.is_active = true
  )
);

-- Allow public update of customer_portal_tokens (for last_accessed_at)
CREATE POLICY "Public update portal token last accessed"
ON public.customer_portal_tokens FOR UPDATE
USING (is_active = true)
WITH CHECK (is_active = true);