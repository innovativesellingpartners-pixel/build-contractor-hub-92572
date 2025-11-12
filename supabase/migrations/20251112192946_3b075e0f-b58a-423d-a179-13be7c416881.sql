-- Drop the security definer view and use column-level security instead
DROP VIEW IF EXISTS lesson_quiz_questions_public;

-- Revoke default grants
REVOKE ALL ON lesson_quiz_questions FROM authenticated;

-- The existing policies will handle security - just update client code to not request correct_answer