-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for job photos bucket
CREATE POLICY "Users can view own job photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own job photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own job photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own job photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all job photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'job-photos' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
);