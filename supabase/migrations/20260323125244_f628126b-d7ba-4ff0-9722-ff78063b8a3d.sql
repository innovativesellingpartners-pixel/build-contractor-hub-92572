
CREATE POLICY "Contractor members can insert crew members"
ON public.crew_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_user_contractor_id(auth.uid())
);

CREATE POLICY "Contractor members can update crew members"
ON public.crew_members
FOR UPDATE
TO authenticated
USING (
  user_id = public.get_user_contractor_id(auth.uid())
)
WITH CHECK (
  user_id = public.get_user_contractor_id(auth.uid())
);

CREATE POLICY "Contractor members can delete crew members"
ON public.crew_members
FOR DELETE
TO authenticated
USING (
  user_id = public.get_user_contractor_id(auth.uid())
);
