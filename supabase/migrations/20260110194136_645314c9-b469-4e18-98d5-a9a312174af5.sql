-- Create estimate_photos table mirroring job_photos with photo_type for categorization
CREATE TABLE public.estimate_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT NOT NULL DEFAULT 'general',  -- 'risk_shot', 'before', 'general', 'site_condition'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_estimate_photos_estimate_id ON public.estimate_photos(estimate_id);
CREATE INDEX idx_estimate_photos_user_id ON public.estimate_photos(user_id);
CREATE INDEX idx_estimate_photos_type ON public.estimate_photos(photo_type);

-- Enable RLS
ALTER TABLE public.estimate_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own photos
CREATE POLICY "Users can view their own estimate photos"
  ON public.estimate_photos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own estimate photos"
  ON public.estimate_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estimate photos"
  ON public.estimate_photos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estimate photos"
  ON public.estimate_photos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for estimate photos (private like job-photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('estimate-photos', 'estimate-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for estimate photos
CREATE POLICY "Users can view their own estimate photos storage"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'estimate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own estimate photos storage"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'estimate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own estimate photos storage"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'estimate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own estimate photos storage"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'estimate-photos' AND auth.uid()::text = (storage.foldername(name))[1]);