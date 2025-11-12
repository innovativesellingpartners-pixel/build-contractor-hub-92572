-- Fix Quiz Answer Exposure: Create view without correct answers
CREATE OR REPLACE VIEW lesson_quiz_questions_public AS
SELECT 
  id,
  lesson_id,
  question_text,
  question_type,
  options,
  order_index,
  points,
  created_at,
  updated_at
FROM lesson_quiz_questions;

-- Grant access to the view for authenticated users
GRANT SELECT ON lesson_quiz_questions_public TO authenticated;

-- Drop the overly permissive policy on the base table
DROP POLICY IF EXISTS "Anyone can view quiz questions" ON lesson_quiz_questions;

-- Create restricted policies for the base table
CREATE POLICY "Authenticated users can view quiz questions without answers"
ON lesson_quiz_questions
FOR SELECT
TO authenticated
USING (true);

-- Only admins can see correct answers
CREATE POLICY "Admins can view all quiz question data"
ON lesson_quiz_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin')
);

-- Create edge function for secure answer validation
-- This will be implemented in a separate edge function file