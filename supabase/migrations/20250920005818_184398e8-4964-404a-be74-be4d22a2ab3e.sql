-- Remove duplicate foreign key constraints to fix PostgREST ambiguity
-- Check if duplicate constraints exist and remove them
DO $$
BEGIN
    -- Drop duplicate foreign key constraint for course_modules if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_course_modules_course_id' 
        AND table_name = 'course_modules'
    ) THEN
        ALTER TABLE course_modules DROP CONSTRAINT fk_course_modules_course_id;
    END IF;

    -- Drop duplicate foreign key constraint for course_lessons if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_course_lessons_module_id' 
        AND table_name = 'course_lessons'
    ) THEN
        ALTER TABLE course_lessons DROP CONSTRAINT fk_course_lessons_module_id;
    END IF;
END $$;