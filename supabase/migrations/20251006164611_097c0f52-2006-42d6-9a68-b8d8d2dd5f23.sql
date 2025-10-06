-- Fix profiles table RLS policies to properly secure sensitive data
-- Remove the problematic "Block anonymous access" policy
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;

-- Remove the overly broad "Authenticated users only" policy
DROP POLICY IF EXISTS "Authenticated users only" ON public.profiles;

-- Keep the specific, secure policies that ensure users can only access their own profiles:
-- These policies already exist and are correct:
-- 1. "Users can view own profile" - SELECT with auth.uid() = id
-- 2. "Users can insert own profile" - INSERT with auth.uid() = id  
-- 3. "Users can update own profile" - UPDATE with auth.uid() = id

-- Add admin access for profile viewing (admins need to see profiles in admin dashboard)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::text) OR 
    has_role(auth.uid(), 'super_admin'::text)
  );

-- Add admin access for profile updates (admins need to update profiles)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::text) OR 
    has_role(auth.uid(), 'super_admin'::text)
  );