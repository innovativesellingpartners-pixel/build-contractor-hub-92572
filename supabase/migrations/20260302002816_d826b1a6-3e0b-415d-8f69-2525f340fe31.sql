-- Super admins can view ALL templates
CREATE POLICY "Super admins can view all templates"
ON public.estimate_templates
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can update any template
CREATE POLICY "Super admins can update all templates"
ON public.estimate_templates
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can delete any template
CREATE POLICY "Super admins can delete all templates"
ON public.estimate_templates
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));