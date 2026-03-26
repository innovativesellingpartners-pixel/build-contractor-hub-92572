
-- Review requests table
CREATE TABLE public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_phone TEXT,
  sent_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  review_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_requests_user ON public.review_requests (user_id);
CREATE INDEX idx_review_requests_token ON public.review_requests (review_token);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own review requests" ON public.review_requests
  FOR ALL TO authenticated USING (public.is_contractor_member(user_id))
  WITH CHECK (public.is_contractor_member(user_id));

CREATE POLICY "Public can view by token" ON public.review_requests
  FOR SELECT TO anon USING (true);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  google_review_redirected BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_request_id UUID REFERENCES public.review_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_user ON public.reviews (user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reviews" ON public.reviews
  FOR ALL TO authenticated USING (public.is_contractor_member(user_id))
  WITH CHECK (public.is_contractor_member(user_id));

CREATE POLICY "Public can insert reviews" ON public.reviews
  FOR INSERT TO anon WITH CHECK (true);
