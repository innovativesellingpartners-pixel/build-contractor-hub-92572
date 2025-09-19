-- Insert initial training categories
INSERT INTO training_categories (name, description) VALUES
('Safety Training', 'Essential safety protocols and procedures for construction sites'),
('Equipment Operation', 'Training on heavy machinery and equipment operation'),
('Quality Control', 'Standards and procedures for maintaining quality in construction'),
('Project Management', 'Leadership and project coordination skills'),
('Technical Skills', 'Specialized technical training for construction trades');

-- Insert sample courses
DO $$
DECLARE
    safety_category_id UUID;
    equipment_category_id UUID;
    safety_course_id UUID;
    equipment_course_id UUID;
    safety_module_id UUID;
    equipment_module_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO safety_category_id FROM training_categories WHERE name = 'Safety Training';
    SELECT id INTO equipment_category_id FROM training_categories WHERE name = 'Equipment Operation';

    -- Insert courses
    INSERT INTO training_courses (title, description, category_id, difficulty_level, duration_minutes, is_published) 
    VALUES 
    ('Construction Site Safety Fundamentals', 'Learn the essential safety protocols every construction worker must know', safety_category_id, 'beginner', 180, true)
    RETURNING id INTO safety_course_id;

    INSERT INTO training_courses (title, description, category_id, difficulty_level, duration_minutes, is_published)
    VALUES 
    ('Heavy Equipment Operation Certification', 'Complete certification course for operating heavy construction equipment', equipment_category_id, 'intermediate', 480, true)
    RETURNING id INTO equipment_course_id;

    -- Insert modules for Safety course
    INSERT INTO course_modules (course_id, title, description, order_index)
    VALUES 
    (safety_course_id, 'Introduction to Site Safety', 'Overview of construction site safety principles', 0),
    (safety_course_id, 'Personal Protective Equipment', 'Proper use and maintenance of PPE', 1),
    (safety_course_id, 'Hazard Identification', 'Recognizing and reporting workplace hazards', 2);

    -- Insert modules for Equipment course
    INSERT INTO course_modules (course_id, title, description, order_index)
    VALUES 
    (equipment_course_id, 'Equipment Basics', 'Understanding heavy equipment fundamentals', 0),
    (equipment_course_id, 'Safe Operation Procedures', 'Step-by-step safe operation protocols', 1),
    (equipment_course_id, 'Maintenance and Inspection', 'Daily maintenance and safety inspections', 2);

    -- Get module IDs for lessons
    SELECT id INTO safety_module_id FROM course_modules WHERE course_id = safety_course_id AND title = 'Introduction to Site Safety';
    SELECT id INTO equipment_module_id FROM course_modules WHERE course_id = equipment_course_id AND title = 'Equipment Basics';

    -- Insert lessons for safety module
    INSERT INTO course_lessons (module_id, title, description, content, lesson_type, duration_minutes, order_index)
    VALUES 
    (safety_module_id, 'Welcome to Construction Safety', 'Introduction to the importance of safety on construction sites', 
    'Construction sites are inherently dangerous environments. This lesson covers the fundamental principles of construction safety and why every worker has a responsibility to maintain a safe workplace.

Key topics covered:
- Statistics on construction accidents
- Legal requirements for safety compliance
- Your role in maintaining site safety
- Introduction to safety culture

By the end of this lesson, you will understand the critical importance of safety protocols and your personal responsibility in creating a safe work environment.', 
    'text', 15, 0),
    (safety_module_id, 'Site Safety Video Overview', 'Comprehensive video guide to construction site safety', 
    'This video provides a visual overview of common construction site hazards and safety protocols.', 
    'video', 25, 1),
    (safety_module_id, 'Safety Regulations Handbook', 'OSHA safety regulations reference guide', 
    'Download and review the complete OSHA construction safety regulations.', 
    'pdf', 30, 2);

    -- Insert lessons for equipment module
    INSERT INTO course_lessons (module_id, title, description, content, lesson_type, duration_minutes, order_index)
    VALUES 
    (equipment_module_id, 'Heavy Equipment Types', 'Overview of different types of construction equipment', 
    'Learn about the various types of heavy equipment used in construction:

1. Excavators
   - Track excavators
   - Wheel excavators
   - Mini excavators

2. Bulldozers
   - Crawler dozers
   - Wheel dozers

3. Loaders
   - Wheel loaders
   - Track loaders
   - Skid steer loaders

4. Cranes
   - Mobile cranes
   - Tower cranes
   - Rough terrain cranes

Each type has specific applications, safety considerations, and operational requirements that we will explore in detail.', 
    'text', 20, 0),
    (equipment_module_id, 'Equipment Safety Features', 'Understanding built-in safety systems', 
    'Modern construction equipment includes numerous safety features designed to protect operators and nearby workers.', 
    'video', 30, 1);
END $$;