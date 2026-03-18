
-- Photo reports tracking table
CREATE TABLE IF NOT EXISTS public.photo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  report_type text NOT NULL DEFAULT 'gallery',
  public_token text NOT NULL DEFAULT gen_random_uuid()::text,
  photo_ids uuid[] NOT NULL DEFAULT '{}',
  recipient_email text,
  recipient_name text,
  sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.photo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own photo reports"
  ON public.photo_reports
  FOR ALL
  TO authenticated
  USING (public.is_contractor_member(user_id))
  WITH CHECK (public.is_contractor_member(user_id));

-- Allow anon read by public_token (for the gallery page)
CREATE POLICY "Public can view photo reports by token"
  ON public.photo_reports
  FOR SELECT
  TO anon
  USING (true);
