
-- Phase 2: Tenant Isolation Foundation

-- Step 1: Helper functions
CREATE OR REPLACE FUNCTION public.get_user_contractor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT contractor_id
  FROM public.contractor_users
  WHERE user_id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_contractor_member(_record_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contractor_users cu1
    INNER JOIN public.contractor_users cu2 ON cu1.contractor_id = cu2.contractor_id
    WHERE cu1.user_id = auth.uid()
      AND cu2.user_id = _record_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_contractor_admin(_record_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contractor_users cu1
    INNER JOIN public.contractor_users cu2 ON cu1.contractor_id = cu2.contractor_id
    WHERE cu1.user_id = auth.uid()
      AND cu1.role IN ('owner', 'admin')
      AND cu2.user_id = _record_user_id
  );
$$;

-- Step 2: SELECT policies for team members (core 5 tables)
CREATE POLICY "Team members can view contractor estimates"
ON public.estimates FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

CREATE POLICY "Team members can view contractor jobs"
ON public.jobs FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

CREATE POLICY "Team members can view contractor invoices"
ON public.invoices FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

CREATE POLICY "Team members can view contractor leads"
ON public.leads FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

CREATE POLICY "Team members can view contractor customers"
ON public.customers FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

-- Step 3: UPDATE policies for team admins
CREATE POLICY "Team admins can update contractor estimates"
ON public.estimates FOR UPDATE TO authenticated
USING (public.is_contractor_admin(user_id))
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can update contractor jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (public.is_contractor_admin(user_id))
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can update contractor invoices"
ON public.invoices FOR UPDATE TO authenticated
USING (public.is_contractor_admin(user_id))
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can update contractor leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.is_contractor_admin(user_id))
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can update contractor customers"
ON public.customers FOR UPDATE TO authenticated
USING (public.is_contractor_admin(user_id))
WITH CHECK (public.is_contractor_admin(user_id));

-- Step 4: INSERT policies for team admins
CREATE POLICY "Team admins can create contractor estimates"
ON public.estimates FOR INSERT TO authenticated
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can create contractor invoices"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can create contractor leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can create contractor customers"
ON public.customers FOR INSERT TO authenticated
WITH CHECK (public.is_contractor_admin(user_id));

CREATE POLICY "Team admins can create contractor jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (public.is_contractor_admin(user_id));

-- Step 5: Related tables (using correct column names)
CREATE POLICY "Team members can view contractor change orders"
ON public.change_orders FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

CREATE POLICY "Team admins can update contractor change orders"
ON public.change_orders FOR UPDATE TO authenticated
USING (public.is_contractor_admin(user_id))
WITH CHECK (public.is_contractor_admin(user_id));

-- Payments uses contractor_id directly
CREATE POLICY "Team members can view contractor payments"
ON public.payments FOR SELECT TO authenticated
USING (contractor_id = public.get_user_contractor_id(auth.uid()));

-- Daily logs
CREATE POLICY "Team members can view contractor daily logs"
ON public.daily_logs FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

CREATE POLICY "Team members can create contractor daily logs"
ON public.daily_logs FOR INSERT TO authenticated
WITH CHECK (public.is_contractor_member(user_id));

-- Expenses uses contractor_id directly
CREATE POLICY "Team members can view contractor expenses"
ON public.expenses FOR SELECT TO authenticated
USING (contractor_id = public.get_user_contractor_id(auth.uid()));

-- Crew members
CREATE POLICY "Team members can view contractor crew members"
ON public.crew_members FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

-- Step 6: Performance indexes
CREATE INDEX IF NOT EXISTS idx_contractor_users_user_id ON public.contractor_users(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_users_contractor_id ON public.contractor_users(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_users_lookup ON public.contractor_users(user_id, contractor_id, role);
