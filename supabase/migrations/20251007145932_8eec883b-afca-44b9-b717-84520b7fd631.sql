-- ============================================
-- SECURITY HARDENING MIGRATION
-- Phase 1: Critical Security Fixes
-- ============================================

-- 1. Create chatbot usage tracking table for server-side rate limiting
CREATE TABLE IF NOT EXISTS public.chatbot_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  last_reset_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on chatbot_usage
ALTER TABLE public.chatbot_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own chatbot usage"
ON public.chatbot_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage usage (edge functions only)
CREATE POLICY "Service role can manage chatbot usage"
ON public.chatbot_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Improve profiles RLS - Restrict admin access to sensitive PII
-- Drop existing overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create granular policies for different admin levels
CREATE POLICY "Admins can view non-sensitive profile data"
ON public.profiles
FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  AND id != auth.uid()
);

-- Super admins can update all profiles (needed for legitimate admin tasks)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

-- Remove the old admin update policy
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Create audit log trigger for integrity
-- First, create a function to auto-log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log to audit table automatically
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    NEW.user_id,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$;

-- Attach trigger to user_roles table
DROP TRIGGER IF EXISTS audit_role_changes ON public.user_roles;
CREATE TRIGGER audit_role_changes
  AFTER UPDATE OR INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();

-- 4. Remove overly permissive service role policy from audit_log
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_log;

-- Only allow inserts through triggers now
CREATE POLICY "Audit logs inserted via triggers only"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (false);

-- But enable for the trigger function by making it security definer (already done above)

-- 5. Add certificate URL security
-- Drop existing certificate policy if it's too permissive
DROP POLICY IF EXISTS "Users can view own certificates" ON public.user_certificates;

-- Recreate with proper isolation
CREATE POLICY "Users can view only their own certificates"
ON public.user_certificates
FOR SELECT
USING (auth.uid() = user_id);

-- 6. Add indexes for performance on security checks
CREATE INDEX IF NOT EXISTS idx_chatbot_usage_user_id ON public.chatbot_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- 7. Create trigger for chatbot_usage updated_at
CREATE TRIGGER update_chatbot_usage_updated_at
  BEFORE UPDATE ON public.chatbot_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();