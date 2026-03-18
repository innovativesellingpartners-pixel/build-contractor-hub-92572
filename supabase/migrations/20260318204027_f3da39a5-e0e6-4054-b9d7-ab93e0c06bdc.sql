
-- Replace overly permissive insert policy with a restricted one
DROP POLICY IF EXISTS "System can insert assignment audit log" ON public.assignment_audit_log;

-- No direct insert allowed from client - only via SECURITY DEFINER trigger
-- The trigger function runs as definer and bypasses RLS
