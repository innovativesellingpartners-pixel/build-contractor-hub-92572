
-- Fix portal token bypass on jobs, invoices, tasks, job_photos
-- Drop public policies that check only is_active without validating token string
DROP POLICY IF EXISTS "Public read jobs via portal token" ON public.jobs;
DROP POLICY IF EXISTS "Public read invoices via portal token" ON public.invoices;
DROP POLICY IF EXISTS "Public read tasks via portal token" ON public.tasks;
DROP POLICY IF EXISTS "Public read job photos via portal token" ON public.job_photos;

-- Fix help_support_requests ownership check
DROP POLICY IF EXISTS "Users can create support requests" ON public.help_support_requests;
CREATE POLICY "Users can create own support requests"
ON public.help_support_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
