-- Security Fix: Make job-photos bucket private and add RLS policies
-- This prevents unauthorized access to sensitive job site photos

-- Make job-photos bucket private (company-logos stays public for estimates/invoices)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'job-photos';

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own job photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own job photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own job photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own job photos" ON storage.objects;

-- RLS Policy: Users can only view their own job photos
CREATE POLICY "Users can view own job photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can only upload to their own folder
CREATE POLICY "Users can upload own job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can only update their own photos
CREATE POLICY "Users can update own job photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can only delete their own photos
CREATE POLICY "Users can delete own job photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);