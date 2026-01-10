-- Add new fields to estimates table for comprehensive status tracking
ALTER TABLE public.estimates
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_by_name TEXT,
ADD COLUMN IF NOT EXISTS signed_by_email TEXT,
ADD COLUMN IF NOT EXISTS signed_document_url TEXT,
ADD COLUMN IF NOT EXISTS signed_document_file_id TEXT,
ADD COLUMN IF NOT EXISTS signature_audit_trail_url TEXT,
ADD COLUMN IF NOT EXISTS last_status_event_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create estimate_status_history table for audit trail
CREATE TABLE IF NOT EXISTS public.estimate_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_source TEXT DEFAULT 'system',
  event_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimate_status_history_estimate_id ON public.estimate_status_history(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_status_history_created_at ON public.estimate_status_history(created_at DESC);

-- Enable RLS on status history
ALTER TABLE public.estimate_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimate_status_history
CREATE POLICY "Users can view status history for their estimates"
ON public.estimate_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.id = estimate_status_history.estimate_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert status history for their estimates"
ON public.estimate_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.id = estimate_status_history.estimate_id
    AND e.user_id = auth.uid()
  )
);

-- Create storage bucket for signed documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-estimates',
  'signed-estimates',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for signed estimates
CREATE POLICY "Users can view their own signed estimates"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'signed-estimates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload signed estimates to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'signed-estimates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own signed estimates"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'signed-estimates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own signed estimates"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'signed-estimates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_estimate_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.estimate_status_history (
      estimate_id,
      user_id,
      from_status,
      to_status,
      event_type,
      event_source
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      'status_change',
      'user_action'
    );
    
    -- Update last_status_event_at
    NEW.last_status_event_at = now();
  END IF;
  
  -- Auto-set signed_at when status changes to signed
  IF NEW.status = 'signed' AND OLD.status != 'signed' AND NEW.signed_at IS NULL THEN
    NEW.signed_at = now();
  END IF;
  
  -- Auto-set sent_at when status changes to sent
  IF NEW.status = 'sent' AND OLD.status != 'sent' AND NEW.sent_at IS NULL THEN
    NEW.sent_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status logging
DROP TRIGGER IF EXISTS trigger_log_estimate_status_change ON public.estimates;
CREATE TRIGGER trigger_log_estimate_status_change
BEFORE UPDATE ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.log_estimate_status_change();