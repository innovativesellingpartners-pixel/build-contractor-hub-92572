-- Add missing foreign key relationships to enable PostgREST embedded selects used by admin pages
-- Use conditional guards to avoid errors if constraints already exist

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_lead_id_leads_fkey'
  ) THEN
    ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_lead_id_leads_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.customers
    ADD CONSTRAINT customers_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_job_id_jobs_fkey'
  ) THEN
    ALTER TABLE public.customers
    ADD CONSTRAINT customers_job_id_jobs_fkey
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;
END $$;