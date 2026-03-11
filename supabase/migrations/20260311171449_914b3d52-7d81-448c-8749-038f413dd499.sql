
-- Fix portal_calendar_events: add token validation
DROP POLICY IF EXISTS "Portal customers can view calendar events" ON public.portal_calendar_events;
CREATE POLICY "Portal customers can view calendar events"
  ON public.portal_calendar_events
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM customer_portal_tokens cpt
      WHERE cpt.job_id = portal_calendar_events.job_id
        AND cpt.is_active = true
        AND cpt.token = get_request_token()
    )
  );

DROP POLICY IF EXISTS "Authenticated portal view calendar events" ON public.portal_calendar_events;
CREATE POLICY "Authenticated portal view calendar events"
  ON public.portal_calendar_events
  FOR SELECT
  TO authenticated
  USING (
    contractor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM customer_portal_tokens cpt
      WHERE cpt.job_id = portal_calendar_events.job_id
        AND cpt.is_active = true
        AND cpt.token = get_request_token()
    )
  );
