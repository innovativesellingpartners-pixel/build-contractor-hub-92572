-- Fix ERROR 1: Quiz - remove broad SELECT, restrict to admin-only on base table
DROP POLICY IF EXISTS "Non-admin authenticated can select quiz questions" ON public.lesson_quiz_questions;

-- Fix ERROR 2: Profile INSERT - require user_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND auth.uid() = user_id);

-- Fix WARN 1: Portal messages INSERT - require token validation
DROP POLICY IF EXISTS "Portal users can send messages" ON public.portal_messages;
DROP POLICY IF EXISTS "Portal customers can send messages" ON public.portal_messages;
CREATE POLICY "Portal customers can send messages"
  ON public.portal_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    portal_token_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM customer_portal_tokens pt
      WHERE pt.id = portal_messages.portal_token_id
        AND pt.is_active = true
        AND pt.token = get_request_token()
    )
  );

-- Fix WARN 2: Portal photo uploads INSERT - require token validation
DROP POLICY IF EXISTS "Portal users can upload photos" ON public.portal_photo_uploads;
DROP POLICY IF EXISTS "Portal customers can upload photos" ON public.portal_photo_uploads;
CREATE POLICY "Portal customers can upload photos"
  ON public.portal_photo_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    portal_token_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM customer_portal_tokens pt
      WHERE pt.id = portal_photo_uploads.portal_token_id
        AND pt.is_active = true
        AND pt.token = get_request_token()
    )
  );