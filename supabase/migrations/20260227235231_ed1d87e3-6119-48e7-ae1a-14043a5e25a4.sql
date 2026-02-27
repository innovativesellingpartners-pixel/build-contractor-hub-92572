
-- Junction table for estimate document attachments
CREATE TABLE public.estimate_document_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.contractor_documents(id) ON DELETE CASCADE,
  include_in_body BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(estimate_id, document_id)
);

ALTER TABLE public.estimate_document_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own estimate doc attachments" ON public.estimate_document_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_document_attachments.estimate_id AND estimates.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_document_attachments.estimate_id AND estimates.user_id = auth.uid())
  );
