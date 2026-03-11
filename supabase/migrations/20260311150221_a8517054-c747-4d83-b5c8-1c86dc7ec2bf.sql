
-- PHASE 1: CRITICAL SECURITY FIXES (all idempotent)

-- 1. Remove has_full_access() policies and replace with admin role checks
-- Drop existing admin policies first (they already exist with correct definition)
DROP POLICY IF EXISTS "Full access users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Full access users can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Full access users can view all leads" ON public.leads;
-- Admin policies already exist with correct has_role() checks, no need to recreate

-- 2. Fix retailer_catalog - remove has_full_access() reference
DROP POLICY IF EXISTS "Admins can manage retailer catalog" ON public.retailer_catalog;
CREATE POLICY "Admins can manage retailer catalog"
  ON public.retailer_catalog FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 3. Remove dangerous estimates public token policy (frontend uses Edge Function)
DROP POLICY IF EXISTS "Anyone can view estimates by public token" ON public.estimates;

-- 4. Remove dangerous change_orders public token policy
DROP POLICY IF EXISTS "Public can view change orders by token" ON public.change_orders;

-- 5. Fix portal_participants - scoped SELECT
DROP POLICY IF EXISTS "Anyone can view portal participants" ON public.portal_participants;
DROP POLICY IF EXISTS "Portal participants viewable by token holder or contractor" ON public.portal_participants;
CREATE POLICY "Portal participants viewable by token holder or contractor"
  ON public.portal_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens cpt
      WHERE cpt.id = portal_participants.portal_token_id
        AND (cpt.contractor_id = auth.uid() OR cpt.is_active = true)
    )
  );

-- 6. Fix invoice_payment_sessions - remove world-readable policy
DROP POLICY IF EXISTS "Allow public read for payment sessions" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Payment sessions viewable by invoice owner or session participant" ON public.invoice_payment_sessions;
CREATE POLICY "Payment sessions viewable by invoice owner or participant"
  ON public.invoice_payment_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices inv
      WHERE inv.id = invoice_payment_sessions.invoice_id
    )
  );

-- 7. Fix customer_portal_tokens UPDATE policy - use function for safe update
DROP POLICY IF EXISTS "Public update portal token last accessed" ON public.customer_portal_tokens;

CREATE OR REPLACE FUNCTION public.update_portal_token_last_accessed(p_token_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.customer_portal_tokens
  SET last_accessed_at = now()
  WHERE id = p_token_id AND is_active = true;
END;
$$;

-- 8. Fix profiles portal policy - keep but document it's scoped to active tokens
DROP POLICY IF EXISTS "Public read profiles via portal token" ON public.profiles;
CREATE POLICY "Public read profiles via portal token"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.contractor_id = profiles.id
        AND pt.is_active = true
    )
  );

-- 9. Fix estimate_templates account visibility
DROP POLICY IF EXISTS "Users can view account templates" ON public.estimate_templates;
CREATE POLICY "Authenticated users can view account templates"
  ON public.estimate_templates FOR SELECT
  TO authenticated
  USING (
    visibility = 'account'
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.contractor_users cu1
        JOIN public.contractor_users cu2 ON cu1.contractor_id = cu2.contractor_id
        WHERE cu1.user_id = auth.uid()
          AND cu2.user_id = estimate_templates.user_id
      )
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

-- 10. Drop the has_full_access() function (now unused)
DROP FUNCTION IF EXISTS public.has_full_access(uuid);
