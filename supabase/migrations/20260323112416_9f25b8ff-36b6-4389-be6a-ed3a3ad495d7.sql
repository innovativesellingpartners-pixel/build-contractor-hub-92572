
CREATE OR REPLACE FUNCTION public.is_contractor_owner(_contractor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contractor_users
    WHERE user_id = auth.uid()
      AND contractor_id = _contractor_id
      AND role = 'owner'
  );
$$;

DROP POLICY IF EXISTS "Owners can manage memberships" ON public.contractor_users;

CREATE POLICY "Owners can manage memberships"
ON public.contractor_users
FOR ALL
USING (public.is_contractor_owner(contractor_id))
WITH CHECK (public.is_contractor_owner(contractor_id));
