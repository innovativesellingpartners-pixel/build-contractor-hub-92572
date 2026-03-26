
-- Tighten the anon select policy on review_requests to only allow token-based lookups
DROP POLICY "Public can view by token" ON public.review_requests;
CREATE POLICY "Public can view by token" ON public.review_requests
  FOR SELECT TO anon USING (review_token IS NOT NULL);
