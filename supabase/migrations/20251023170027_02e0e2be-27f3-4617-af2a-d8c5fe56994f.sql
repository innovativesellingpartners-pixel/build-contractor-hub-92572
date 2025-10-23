-- Delete all existing quiz questions
DELETE FROM lesson_quiz_questions;

-- Add 4 questions for each video lesson
INSERT INTO lesson_quiz_questions (lesson_id, question_text, question_type, options, correct_answer, order_index, points)
VALUES 
  -- Communication Mastery
  ('1db643e6-55f9-45f5-b402-0ccdccc92153', 'Did you watch the Communication Mastery video?', 'true_false', NULL, 'True', 1, 1),
  ('1db643e6-55f9-45f5-b402-0ccdccc92153', 'What is the foundation of effective communication?', 'multiple_choice', '["Active listening", "Speaking loudly", "Using technical jargon", "Interrupting frequently"]', 'Active listening', 2, 1),
  ('1db643e6-55f9-45f5-b402-0ccdccc92153', 'Body language plays a significant role in communication.', 'true_false', NULL, 'True', 3, 1),
  ('1db643e6-55f9-45f5-b402-0ccdccc92153', 'What percentage of communication is non-verbal?', 'multiple_choice', '["20%", "40%", "55%", "93%"]', '93%', 4, 1),

  -- Communication Skills Part 1
  ('f87fbf37-ea62-4e02-8b19-3873dc4d4e6f', 'Did you watch the Communication Skills Part 1 video?', 'true_false', NULL, 'True', 1, 1),
  ('f87fbf37-ea62-4e02-8b19-3873dc4d4e6f', 'Which is a barrier to effective communication?', 'multiple_choice', '["Clear language", "Making assumptions", "Active listening", "Open body language"]', 'Making assumptions', 2, 1),
  ('f87fbf37-ea62-4e02-8b19-3873dc4d4e6f', 'Asking clarifying questions improves understanding.', 'true_false', NULL, 'True', 3, 1),
  ('f87fbf37-ea62-4e02-8b19-3873dc4d4e6f', 'What is the best way to handle difficult conversations?', 'multiple_choice', '["Avoid them", "Stay calm and focused", "Raise your voice", "Blame others"]', 'Stay calm and focused', 4, 1),

  -- Communication Skills Part 2
  ('80028e19-07d1-4d5c-b9cf-6e8f995ddf64', 'Did you watch the Communication Skills Part 2 video?', 'true_false', NULL, 'True', 1, 1),
  ('80028e19-07d1-4d5c-b9cf-6e8f995ddf64', 'What is empathetic listening?', 'multiple_choice', '["Interrupting to share your story", "Understanding the speaker''s perspective", "Thinking about your response", "Checking your phone"]', 'Understanding the speaker''s perspective', 2, 1),
  ('80028e19-07d1-4d5c-b9cf-6e8f995ddf64', 'Written communication should be clear and concise.', 'true_false', NULL, 'True', 3, 1),
  ('80028e19-07d1-4d5c-b9cf-6e8f995ddf64', 'When giving feedback, you should focus on:', 'multiple_choice', '["Personal attacks", "Specific behaviors", "General complaints", "Past mistakes"]', 'Specific behaviors', 4, 1),

  -- Effective Leadership Training Video
  ('1f4c9560-9e41-41d7-9664-dde3c10401ee', 'Did you watch the Effective Leadership Training Video?', 'true_false', NULL, 'True', 1, 1),
  ('1f4c9560-9e41-41d7-9664-dde3c10401ee', 'What is the most important quality of an effective leader?', 'multiple_choice', '["Micromanaging", "Integrity and trust", "Being the loudest", "Avoiding decisions"]', 'Integrity and trust', 2, 1),
  ('1f4c9560-9e41-41d7-9664-dde3c10401ee', 'Effective leaders should delegate tasks to their team.', 'true_false', NULL, 'True', 3, 1),
  ('1f4c9560-9e41-41d7-9664-dde3c10401ee', 'What leadership style empowers team members?', 'multiple_choice', '["Autocratic", "Servant leadership", "Laissez-faire", "Dictatorial"]', 'Servant leadership', 4, 1),

  -- Leadership Fundamentals Part 2
  ('2fbc1ed5-23e0-4c4c-853d-3b48d9d1e197', 'Did you watch the Leadership Fundamentals Part 2 video?', 'true_false', NULL, 'True', 1, 1),
  ('2fbc1ed5-23e0-4c4c-853d-3b48d9d1e197', 'What builds team morale?', 'multiple_choice', '["Criticism only", "Recognition and appreciation", "Ignoring achievements", "Micromanagement"]', 'Recognition and appreciation', 2, 1),
  ('2fbc1ed5-23e0-4c4c-853d-3b48d9d1e197', 'Leaders should lead by example.', 'true_false', NULL, 'True', 3, 1),
  ('2fbc1ed5-23e0-4c4c-853d-3b48d9d1e197', 'Which is essential for team development?', 'multiple_choice', '["Providing clear goals", "Creating confusion", "Avoiding feedback", "Working in isolation"]', 'Providing clear goals', 4, 1),

  -- Performance Metrics & Tracking
  ('9b5401ff-95f2-4166-b457-c7d22c0f4aa3', 'Did you watch the Performance Metrics & Tracking video?', 'true_false', NULL, 'True', 1, 1),
  ('9b5401ff-95f2-4166-b457-c7d22c0f4aa3', 'What is a KPI?', 'multiple_choice', '["Key Performance Indicator", "Key Personal Information", "Keep Projects Incomplete", "Know People Inside"]', 'Key Performance Indicator', 2, 1),
  ('9b5401ff-95f2-4166-b457-c7d22c0f4aa3', 'Tracking metrics helps identify areas for improvement.', 'true_false', NULL, 'True', 3, 1),
  ('9b5401ff-95f2-4166-b457-c7d22c0f4aa3', 'How often should you review performance metrics?', 'multiple_choice', '["Never", "Once a year", "Regularly", "Only when problems occur"]', 'Regularly', 4, 1),

  -- Performance Training Video
  ('283c35f6-c6e6-4ec0-8924-191a5fe8ddf6', 'Did you watch the Performance Training Video?', 'true_false', NULL, 'True', 1, 1),
  ('283c35f6-c6e6-4ec0-8924-191a5fe8ddf6', 'What drives high performance?', 'multiple_choice', '["Unclear expectations", "Clear goals and accountability", "No feedback", "Working without breaks"]', 'Clear goals and accountability', 2, 1),
  ('283c35f6-c6e6-4ec0-8924-191a5fe8ddf6', 'Regular feedback improves employee performance.', 'true_false', NULL, 'True', 3, 1),
  ('283c35f6-c6e6-4ec0-8924-191a5fe8ddf6', 'What is continuous improvement?', 'multiple_choice', '["Accepting status quo", "Always seeking better methods", "Resisting change", "Doing things the old way"]', 'Always seeking better methods', 4, 1),

  -- Process Training Video
  ('2f029851-106b-4324-8d96-97ddf69fa88e', 'Did you watch the Process Training Video?', 'true_false', NULL, 'True', 1, 1),
  ('2f029851-106b-4324-8d96-97ddf69fa88e', 'What is the benefit of standardized processes?', 'multiple_choice', '["Inconsistent results", "Predictable outcomes", "More confusion", "Slower operations"]', 'Predictable outcomes', 2, 1),
  ('2f029851-106b-4324-8d96-97ddf69fa88e', 'Documented processes help with training new employees.', 'true_false', NULL, 'True', 3, 1),
  ('2f029851-106b-4324-8d96-97ddf69fa88e', 'What should you do with outdated processes?', 'multiple_choice', '["Keep them forever", "Update or eliminate them", "Ignore them", "Make them more complex"]', 'Update or eliminate them', 4, 1),

  -- Systems That Scale Part 2
  ('3b4a6234-df28-404d-aba2-afdfa0e44539', 'Did you watch the Systems That Scale Part 2 video?', 'true_false', NULL, 'True', 1, 1),
  ('3b4a6234-df28-404d-aba2-afdfa0e44539', 'Scalable systems allow business growth without proportional cost increase.', 'true_false', NULL, 'True', 2, 1),
  ('3b4a6234-df28-404d-aba2-afdfa0e44539', 'What is automation used for?', 'multiple_choice', '["Making work harder", "Eliminating repetitive tasks", "Creating bottlenecks", "Increasing errors"]', 'Eliminating repetitive tasks', 3, 1),
  ('3b4a6234-df28-404d-aba2-afdfa0e44539', 'Which tool helps manage scalable systems?', 'multiple_choice', '["Paper notes only", "Project management software", "No documentation", "Random methods"]', 'Project management software', 4, 1),

  -- Super-Effective Selling Training Video (first one)
  ('7ba7925f-cd3b-4223-a70f-c2307873e038', 'Did you watch the Super-Effective Selling Training Video?', 'true_false', NULL, 'True', 1, 1),
  ('7ba7925f-cd3b-4223-a70f-c2307873e038', 'What is the first step in the sales process?', 'multiple_choice', '["Closing the deal", "Building rapport and trust", "Asking for payment", "Leaving immediately"]', 'Building rapport and trust', 2, 1),
  ('7ba7925f-cd3b-4223-a70f-c2307873e038', 'Listening to customer needs is more important than talking.', 'true_false', NULL, 'True', 3, 1),
  ('7ba7925f-cd3b-4223-a70f-c2307873e038', 'What technique helps overcome objections?', 'multiple_choice', '["Arguing with the customer", "Acknowledging concerns", "Ignoring them", "Walking away"]', 'Acknowledging concerns', 4, 1),

  -- Super-Effective Selling Training Video (second one)
  ('059a35d2-13ca-4c3f-ba20-735fe2903a55', 'Did you watch the Super-Effective Selling Training Video?', 'true_false', NULL, 'True', 1, 1),
  ('059a35d2-13ca-4c3f-ba20-735fe2903a55', 'What creates urgency in sales?', 'multiple_choice', '["Unlimited time", "Limited-time offers", "No deadlines", "Pushing too hard"]', 'Limited-time offers', 2, 1),
  ('059a35d2-13ca-4c3f-ba20-735fe2903a55', 'Following up with leads increases conversion rates.', 'true_false', NULL, 'True', 3, 1),
  ('059a35d2-13ca-4c3f-ba20-735fe2903a55', 'What is value-based selling?', 'multiple_choice', '["Focusing only on price", "Highlighting customer benefits", "Ignoring quality", "Rushing the sale"]', 'Highlighting customer benefits', 4, 1);