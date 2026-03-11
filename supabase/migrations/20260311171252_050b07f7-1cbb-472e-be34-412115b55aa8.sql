
-- 2. Fix quiz questions: create a view that hides correct_answer for non-admins
CREATE OR REPLACE VIEW public.quiz_questions_safe AS
SELECT 
  id, lesson_id, question_text, question_type, options, order_index, points, created_at, updated_at,
  CASE 
    WHEN has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
    THEN correct_answer
    ELSE NULL
  END AS correct_answer
FROM public.lesson_quiz_questions;

-- Re-add the permissive SELECT policy (the old one was dropped in the partially-applied migration)
CREATE POLICY "Authenticated users can view quiz questions"
  ON public.lesson_quiz_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Fix lead_sources: restrict UPDATE to admins only  
DROP POLICY IF EXISTS "Authenticated users can update lead sources" ON public.lead_sources;
CREATE POLICY "Admins can update lead sources"
  ON public.lead_sources
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Drop the duplicate INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert lead sources" ON public.lead_sources;
