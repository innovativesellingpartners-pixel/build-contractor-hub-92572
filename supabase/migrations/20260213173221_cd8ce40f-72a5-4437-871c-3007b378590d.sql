
-- Customer Portal Access Tokens
CREATE TABLE public.customer_portal_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portal Messages for customer-contractor communication
CREATE TABLE public.portal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_token_id UUID NOT NULL REFERENCES public.customer_portal_tokens(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'contractor')),
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer-uploaded photos linked to portal
CREATE TABLE public.portal_photo_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_token_id UUID NOT NULL REFERENCES public.customer_portal_tokens(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_photo_uploads ENABLE ROW LEVEL SECURITY;

-- Contractor can manage their own portal tokens
CREATE POLICY "Contractors manage own portal tokens"
  ON public.customer_portal_tokens FOR ALL
  USING (contractor_id = auth.uid());

-- Public read access via token (for portal page)
CREATE POLICY "Public read portal tokens by token value"
  ON public.customer_portal_tokens FOR SELECT
  USING (is_active = true);

-- Contractor can view/send messages for their tokens
CREATE POLICY "Contractors manage own portal messages"
  ON public.portal_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.id = portal_token_id AND pt.contractor_id = auth.uid()
    )
  );

-- Public can insert messages (customer sending) and read messages for active tokens
CREATE POLICY "Public read portal messages via active token"
  ON public.portal_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.id = portal_token_id AND pt.is_active = true
    )
  );

CREATE POLICY "Public insert portal messages via active token"
  ON public.portal_messages FOR INSERT
  WITH CHECK (
    sender_type = 'customer' AND
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.id = portal_token_id AND pt.is_active = true
    )
  );

-- Contractor manages portal photo uploads
CREATE POLICY "Contractors manage portal photos"
  ON public.portal_photo_uploads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.id = portal_token_id AND pt.contractor_id = auth.uid()
    )
  );

-- Public can insert and view portal photos for active tokens
CREATE POLICY "Public read portal photos via active token"
  ON public.portal_photo_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.id = portal_token_id AND pt.is_active = true
    )
  );

CREATE POLICY "Public insert portal photos via active token"
  ON public.portal_photo_uploads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customer_portal_tokens pt
      WHERE pt.id = portal_token_id AND pt.is_active = true
    )
  );

-- Enable realtime for portal messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_messages;

-- Timestamps trigger
CREATE TRIGGER update_customer_portal_tokens_updated_at
  BEFORE UPDATE ON public.customer_portal_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Make job-photos bucket public for portal access
UPDATE storage.buckets SET public = true WHERE id = 'job-photos';

-- Storage policy for portal photo uploads (customers can upload to job-photos)
CREATE POLICY "Portal customers can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos');

CREATE POLICY "Public read job photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');
