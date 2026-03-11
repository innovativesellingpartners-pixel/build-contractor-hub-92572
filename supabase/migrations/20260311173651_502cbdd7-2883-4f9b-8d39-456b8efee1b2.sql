-- Fix WARNING 1: lead_sources INSERT too permissive - restrict to admins
DROP POLICY IF EXISTS "Authenticated users can create lead sources" ON public.lead_sources;
CREATE POLICY "Admins can create lead sources"
  ON public.lead_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Fix WARNING 2: estimate_views INSERT - validate estimate_id exists and has public_token
DROP POLICY IF EXISTS "Anyone can log estimate views" ON public.estimate_views;
CREATE POLICY "Anyone can log estimate views"
  ON public.estimate_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    estimate_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.estimates
      WHERE estimates.id = estimate_views.estimate_id
        AND estimates.public_token IS NOT NULL
    )
  );

-- Fix WARNING 3: change_order_views INSERT - validate change_order_id exists and has public_token
DROP POLICY IF EXISTS "Anyone can insert change order views" ON public.change_order_views;
CREATE POLICY "Anyone can insert change order views"
  ON public.change_order_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    change_order_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.change_orders
      WHERE change_orders.id = change_order_views.change_order_id
        AND change_orders.public_token IS NOT NULL
    )
  );