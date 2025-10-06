-- Phase 1: Critical Security Fixes

-- 1. Add admin-only policies to user_roles table to prevent privilege escalation
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Only admins can modify roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Only super admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin')
);

-- 2. Add UPDATE policy to subscriptions table for admin management
CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- 3. Add explicit authenticated-only policy to profiles to prevent anonymous access
CREATE POLICY "Authenticated users only"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id);

-- Block all anonymous access to profiles
CREATE POLICY "Block anonymous access"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 4. Create audit log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- System can insert audit logs (via edge functions with service role)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);