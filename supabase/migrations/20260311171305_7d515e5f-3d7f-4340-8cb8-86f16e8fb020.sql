
-- Fix the security definer view warning - use SECURITY INVOKER instead
ALTER VIEW public.quiz_questions_safe SET (security_invoker = on);
