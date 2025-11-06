-- Create storage bucket for insurance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'insurance-documents',
  'insurance-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create table to track insurance documents
CREATE TABLE public.insurance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'general_liability', 'workers_comp', 'contractor_license', 'other'
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at DATE,
  notes TEXT
);

-- Enable RLS on insurance_documents table
ALTER TABLE public.insurance_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurance_documents table
CREATE POLICY "Users can view their own insurance documents"
  ON public.insurance_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own insurance documents"
  ON public.insurance_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance documents"
  ON public.insurance_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insurance documents"
  ON public.insurance_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for insurance-documents bucket
CREATE POLICY "Users can view their own insurance documents in storage"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'insurance-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own insurance documents to storage"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'insurance-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own insurance documents in storage"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'insurance-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own insurance documents from storage"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'insurance-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create index for faster queries
CREATE INDEX idx_insurance_documents_user_id ON public.insurance_documents(user_id);
CREATE INDEX idx_insurance_documents_document_type ON public.insurance_documents(document_type);