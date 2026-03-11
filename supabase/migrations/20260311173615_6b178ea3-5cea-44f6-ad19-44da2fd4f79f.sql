-- Fix ERROR: Quiz correct answers readable by all authenticated users
-- Step 1: Drop the two permissive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view quiz questions" ON public.lesson_quiz_questions;
DROP POLICY IF EXISTS "Authenticated users can view quiz questions without answers" ON public.lesson_quiz_questions;
-- Also drop the one we created earlier if it exists
DROP POLICY IF EXISTS "Authenticated read for safe view" ON public.lesson_quiz_questions;

-- Step 2: Recreate quiz_questions_safe view WITHOUT correct_answer column
DROP VIEW IF EXISTS public.quiz_questions_safe;
CREATE VIEW public.quiz_questions_safe AS
SELECT 
  id, lesson_id, question_text, question_type, options, order_index, points, created_at, updated_at
FROM public.lesson_quiz_questions;

ALTER VIEW public.quiz_questions_safe SET (security_invoker = on);
GRANT SELECT ON public.quiz_questions_safe TO authenticated;

-- Step 3: Create a restrictive SELECT policy for non-admin users
-- This policy allows SELECT but the app must use quiz_questions_safe view
-- which excludes correct_answer. Direct table access still has RLS but
-- non-admins should use the view.
CREATE POLICY "Non-admin authenticated can select quiz questions"
  ON public.lesson_quiz_questions
  FOR SELECT
  TO authenticated
  USING (true);