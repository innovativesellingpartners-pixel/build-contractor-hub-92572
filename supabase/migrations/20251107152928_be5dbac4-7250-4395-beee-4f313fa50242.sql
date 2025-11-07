-- Allow admins to view all leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);