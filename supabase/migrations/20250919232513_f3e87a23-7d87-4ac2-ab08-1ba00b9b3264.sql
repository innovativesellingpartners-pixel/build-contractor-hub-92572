-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.calculate_course_completion_percentage(
  _enrollment_id UUID
) RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  completion_percentage INTEGER;
BEGIN
  -- Get total number of lessons in the course
  SELECT COUNT(cl.id) INTO total_lessons
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  JOIN user_course_enrollments uce ON cm.course_id = uce.course_id
  WHERE uce.id = _enrollment_id;
  
  -- Get number of completed lessons
  SELECT COUNT(ulp.id) INTO completed_lessons
  FROM user_lesson_progress ulp
  WHERE ulp.enrollment_id = _enrollment_id AND ulp.is_completed = true;
  
  -- Calculate percentage
  IF total_lessons > 0 THEN
    completion_percentage := ROUND((completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100);
  ELSE
    completion_percentage := 0;
  END IF;
  
  RETURN completion_percentage;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_course_progress() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_percentage INTEGER;
BEGIN
  -- Calculate new completion percentage
  new_percentage := calculate_course_completion_percentage(NEW.enrollment_id);
  
  -- Update the enrollment record
  UPDATE user_course_enrollments 
  SET 
    progress_percentage = new_percentage,
    started_at = CASE 
      WHEN started_at IS NULL THEN NOW() 
      ELSE started_at 
    END,
    completed_at = CASE 
      WHEN new_percentage = 100 AND completed_at IS NULL THEN NOW()
      WHEN new_percentage < 100 THEN NULL
      ELSE completed_at
    END
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$;