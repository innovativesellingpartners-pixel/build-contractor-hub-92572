-- Add enrollment_id column to user_lesson_notes for better organization
ALTER TABLE user_lesson_notes
ADD COLUMN enrollment_id uuid;