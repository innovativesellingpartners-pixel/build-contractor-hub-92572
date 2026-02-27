
-- Table for job schedule events visible in customer portal
CREATE TABLE public.portal_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type TEXT NOT NULL DEFAULT 'milestone',
  status TEXT NOT NULL DEFAULT 'scheduled',
  is_all_day BOOLEAN NOT NULL DEFAULT true,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_calendar_events ENABLE ROW LEVEL SECURITY;

-- Contractors can CRUD their own events
CREATE POLICY "Contractors manage own portal calendar events"
  ON public.portal_calendar_events
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- Public read via portal token (customers viewing portal)
CREATE POLICY "Portal customers can view calendar events"
  ON public.portal_calendar_events
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens cpt
      WHERE cpt.job_id = portal_calendar_events.job_id
        AND cpt.is_active = true
    )
  );

-- Also allow authenticated users with portal tokens to read
CREATE POLICY "Authenticated portal view calendar events"
  ON public.portal_calendar_events
  FOR SELECT
  TO authenticated
  USING (
    contractor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customer_portal_tokens cpt
      WHERE cpt.job_id = portal_calendar_events.job_id
        AND cpt.is_active = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_portal_calendar_events_updated_at
  BEFORE UPDATE ON public.portal_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
