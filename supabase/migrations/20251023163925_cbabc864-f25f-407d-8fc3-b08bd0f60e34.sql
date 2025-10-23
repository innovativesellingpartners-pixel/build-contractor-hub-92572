-- Create table for lesson quiz questions
CREATE TABLE public.lesson_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- For multiple choice questions: ["option1", "option2", "option3", "option4"]
  correct_answer TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user quiz answers
CREATE TABLE public.user_quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES public.user_course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.lesson_quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.lesson_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_quiz_questions
CREATE POLICY "Anyone can view quiz questions"
  ON public.lesson_quiz_questions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert quiz questions"
  ON public.lesson_quiz_questions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update quiz questions"
  ON public.lesson_quiz_questions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete quiz questions"
  ON public.lesson_quiz_questions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- RLS Policies for user_quiz_answers
CREATE POLICY "Users can view own quiz answers"
  ON public.user_quiz_answers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz answers"
  ON public.user_quiz_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz answers"
  ON public.user_quiz_answers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_quiz_questions_lesson_id ON public.lesson_quiz_questions(lesson_id);
CREATE INDEX idx_quiz_answers_user_id ON public.user_quiz_answers(user_id);
CREATE INDEX idx_quiz_answers_enrollment_id ON public.user_quiz_answers(enrollment_id);
CREATE INDEX idx_quiz_answers_lesson_id ON public.user_quiz_answers(lesson_id);

-- Create trigger for updated_at on lesson_quiz_questions
CREATE TRIGGER update_lesson_quiz_questions_updated_at
  BEFORE UPDATE ON public.lesson_quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();