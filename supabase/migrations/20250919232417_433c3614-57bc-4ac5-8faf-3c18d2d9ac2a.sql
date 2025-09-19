-- Add foreign key relationships for proper data integrity
ALTER TABLE course_modules ADD CONSTRAINT fk_course_modules_course_id 
FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE;

ALTER TABLE course_lessons ADD CONSTRAINT fk_course_lessons_module_id 
FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE;

ALTER TABLE user_lesson_notes ADD CONSTRAINT fk_user_lesson_notes_lesson_id 
FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;

ALTER TABLE user_lesson_progress ADD CONSTRAINT fk_user_lesson_progress_lesson_id 
FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;

-- Create function to calculate course completion percentage
CREATE OR REPLACE FUNCTION public.calculate_course_completion_percentage(
  _enrollment_id UUID
) RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update course progress
CREATE OR REPLACE FUNCTION public.update_course_progress() RETURNS TRIGGER AS $$
DECLARE
  new_percentage INTEGER;
  total_lessons INTEGER;
  completed_lessons INTEGER;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update course progress when lesson progress changes
CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress();