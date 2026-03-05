
CREATE TABLE public.portal_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_token_id uuid NOT NULL REFERENCES public.customer_portal_tokens(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer',
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portal participants" ON public.portal_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add participants" ON public.portal_participants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete participants" ON public.portal_participants
  FOR DELETE TO authenticated USING (added_by = auth.uid());
