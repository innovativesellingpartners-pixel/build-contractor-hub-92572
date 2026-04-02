
-- 1. CREWS: Add team member SELECT and admin SELECT policies
CREATE POLICY "Team members can view crews"
  ON public.crews FOR SELECT TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Admins can manage all crews"
  ON public.crews FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- 2. PHOTO_REPORTS: Replace overly permissive SELECT true with token-gated policy
DROP POLICY IF EXISTS "Public can view photo reports by token" ON public.photo_reports;

CREATE POLICY "Public can view photo reports by valid token"
  ON public.photo_reports FOR SELECT
  USING (
    public_token IS NOT NULL 
    AND public_token = public.get_request_token()
  );

-- 3. CHANGE_ORDER_HISTORY: Replace overly permissive SELECT true with job-owner scoping
DROP POLICY IF EXISTS "Public can view history via edge function" ON public.change_order_history;

CREATE POLICY "Authenticated users can view their change order history"
  ON public.change_order_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.change_orders co
      WHERE co.id = change_order_history.change_order_id
        AND public.is_contractor_member(co.user_id)
    )
  );
