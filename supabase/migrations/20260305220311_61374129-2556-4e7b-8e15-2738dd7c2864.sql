
DROP POLICY "Authenticated users can add participants" ON public.portal_participants;
CREATE POLICY "Contractors can add participants" ON public.portal_participants
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens cpt
      WHERE cpt.id = portal_token_id AND cpt.contractor_id = auth.uid()
    )
  );

DROP POLICY "Authenticated users can delete participants" ON public.portal_participants;
CREATE POLICY "Contractors can delete participants" ON public.portal_participants
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens cpt
      WHERE cpt.id = portal_token_id AND cpt.contractor_id = auth.uid()
    )
  );
