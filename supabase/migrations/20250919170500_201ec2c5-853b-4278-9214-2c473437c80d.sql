-- Insert initial training categories
INSERT INTO training_categories (name, description) VALUES
('Safety Training', 'Essential safety protocols and procedures for construction sites'),
('Equipment Operation', 'Training on heavy machinery and equipment operation'),
('Quality Control', 'Standards and procedures for maintaining quality in construction'),
('Project Management', 'Leadership and project coordination skills'),
('Technical Skills', 'Specialized technical training for construction trades');

-- Insert sample courses with modules and lessons
INSERT INTO training_courses (title, description, category_id, difficulty_level, duration_minutes, is_published) 
SELECT 
  'Construction Site Safety Fundamentals',
  'Learn the essential safety protocols every construction worker must know',
  tc.id,
  'Beginner',
  180,
  true
FROM training_categories tc WHERE tc.name = 'Safety Training';

INSERT INTO training_courses (title, description, category_id, difficulty_level, duration_minutes, is_published)
SELECT 
  'Heavy Equipment Operation Certification',
  'Complete certification course for operating heavy construction equipment',
  tc.id,
  'Intermediate',
  480,
  true
FROM training_categories tc WHERE tc.name = 'Equipment Operation';

-- Get the course IDs for creating modules
WITH safety_course AS (
  SELECT id FROM training_courses WHERE title = 'Construction Site Safety Fundamentals'
),
equipment_course AS (
  SELECT id FROM training_courses WHERE title = 'Heavy Equipment Operation Certification'
)

-- Insert modules for Safety course
INSERT INTO course_modules (course_id, title, description, order_index)
SELECT sc.id, 'Introduction to Site Safety', 'Overview of construction site safety principles', 0
FROM safety_course sc
UNION ALL
SELECT sc.id, 'Personal Protective Equipment', 'Proper use and maintenance of PPE', 1
FROM safety_course sc
UNION ALL
SELECT sc.id, 'Hazard Identification', 'Recognizing and reporting workplace hazards', 2
FROM safety_course sc;

-- Insert modules for Equipment course
INSERT INTO course_modules (course_id, title, description, order_index)
SELECT ec.id, 'Equipment Basics', 'Understanding heavy equipment fundamentals', 0
FROM equipment_course ec
UNION ALL
SELECT ec.id, 'Safe Operation Procedures', 'Step-by-step safe operation protocols', 1
FROM equipment_course ec
UNION ALL
SELECT ec.id, 'Maintenance and Inspection', 'Daily maintenance and safety inspections', 2
FROM equipment_course ec;

-- Insert sample lessons for the first module of each course
WITH safety_module AS (
  SELECT cm.id FROM course_modules cm
  JOIN training_courses tc ON cm.course_id = tc.id
  WHERE tc.title = 'Construction Site Safety Fundamentals' AND cm.title = 'Introduction to Site Safety'
),
equipment_module AS (
  SELECT cm.id FROM course_modules cm
  JOIN training_courses tc ON cm.course_id = tc.id
  WHERE tc.title = 'Heavy Equipment Operation Certification' AND cm.title = 'Equipment Basics'
)

-- Insert lessons for safety module
INSERT INTO course_lessons (module_id, title, description, content, lesson_type, duration_minutes, order_index)
SELECT sm.id, 'Welcome to Construction Safety', 'Introduction to the importance of safety on construction sites', 
'Construction sites are inherently dangerous environments. This lesson covers the fundamental principles of construction safety and why every worker has a responsibility to maintain a safe workplace.

Key topics covered:
- Statistics on construction accidents
- Legal requirements for safety compliance
- Your role in maintaining site safety
- Introduction to safety culture

By the end of this lesson, you will understand the critical importance of safety protocols and your personal responsibility in creating a safe work environment.', 
'text', 15, 0
FROM safety_module sm
UNION ALL
SELECT sm.id, 'Site Safety Video Overview', 'Comprehensive video guide to construction site safety', 
'This video provides a visual overview of common construction site hazards and safety protocols.', 
'video', 25, 1
FROM safety_module sm
UNION ALL
SELECT sm.id, 'Safety Regulations Handbook', 'OSHA safety regulations reference guide', 
'Download and review the complete OSHA construction safety regulations.', 
'pdf', 30, 2
FROM safety_module sm;

-- Insert lessons for equipment module  
INSERT INTO course_lessons (module_id, title, description, content, lesson_type, duration_minutes, order_index)
SELECT em.id, 'Heavy Equipment Types', 'Overview of different types of construction equipment', 
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
'text', 20, 0
FROM equipment_module em
UNION ALL
SELECT em.id, 'Equipment Safety Features', 'Understanding built-in safety systems', 
'Modern construction equipment includes numerous safety features designed to protect operators and nearby workers.', 
'video', 30, 1
FROM equipment_module em;