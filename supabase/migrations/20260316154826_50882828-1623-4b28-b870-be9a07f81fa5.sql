
-- Drop existing SELECT policy and replace with one that includes admin bypass
DROP POLICY IF EXISTS "Contractor members can view" ON public.contractors;

CREATE POLICY "Contractor members and admins can view"
ON public.contractors
FOR SELECT
TO authenticated
USING (
  -- Admins/super_admins can see all contractors
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'super_admin')
  -- Regular users can see their own contractor
  OR EXISTS (
    SELECT 1 FROM public.contractor_users cu
    WHERE cu.contractor_id = contractors.id
    AND cu.user_id = auth.uid()
  )
);
