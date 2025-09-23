-- Fix security issue: Restrict marketplace services contact information access
-- Remove the current public access policy and implement secure access controls

-- First, drop the existing public policy
DROP POLICY IF EXISTS "Anyone can view active services" ON public.marketplace_services;

-- Create new policies for secure access
-- Policy 1: Authenticated users can view full service details including contact info
CREATE POLICY "Authenticated users can view active services with contact info" 
ON public.marketplace_services 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Policy 2: Anonymous users can only view basic service information (no contact details)
-- We'll handle contact info filtering at the application level for anonymous users

-- For now, let's require authentication to view any marketplace services
-- This is the most secure approach to prevent contact harvesting

-- The existing admin policy remains unchanged for full management access