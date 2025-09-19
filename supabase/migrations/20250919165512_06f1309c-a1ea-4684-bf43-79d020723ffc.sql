-- Create storage buckets for training content
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('training-videos', 'training-videos', false),
  ('training-pdfs', 'training-pdfs', false),
  ('certificates', 'certificates', true);

-- Create course modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course lessons table
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'text' CHECK (lesson_type IN ('text', 'video', 'pdf', 'quiz')),
  video_url TEXT,
  pdf_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user course enrollments table
CREATE TABLE public.user_course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Create user lesson progress table
CREATE TABLE public.user_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES user_course_enrollments(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  video_progress_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, lesson_id)
);

-- Create user certificates table
CREATE TABLE public.user_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES user_course_enrollments(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_modules
CREATE POLICY "Anyone can view published course modules" 
ON public.course_modules FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM training_courses 
    WHERE id = course_modules.course_id AND is_published = true
  )
);

CREATE POLICY "Admins can manage course modules" 
ON public.course_modules FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for course_lessons
CREATE POLICY "Anyone can view lessons from published courses" 
ON public.course_lessons FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM course_modules 
    JOIN training_courses ON course_modules.course_id = training_courses.id
    WHERE course_modules.id = course_lessons.module_id 
    AND training_courses.is_published = true
  )
);

CREATE POLICY "Admins can manage course lessons" 
ON public.course_lessons FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for user_course_enrollments
CREATE POLICY "Users can view their own enrollments" 
ON public.user_course_enrollments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" 
ON public.user_course_enrollments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" 
ON public.user_course_enrollments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" 
ON public.user_course_enrollments FOR SELECT 
USING (is_admin(auth.uid()));

-- RLS Policies for user_lesson_progress
CREATE POLICY "Users can manage their own lesson progress" 
ON public.user_lesson_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all lesson progress" 
ON public.user_lesson_progress FOR SELECT 
USING (is_admin(auth.uid()));

-- RLS Policies for user_certificates
CREATE POLICY "Users can view their own certificates" 
ON public.user_certificates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates" 
ON public.user_certificates FOR ALL 
USING (is_admin(auth.uid()));

-- Storage policies for training-videos bucket
CREATE POLICY "Authenticated users can view training videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'training-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage training videos" 
ON storage.objects FOR ALL 
USING (bucket_id = 'training-videos' AND is_admin(auth.uid()));

-- Storage policies for training-pdfs bucket
CREATE POLICY "Authenticated users can view training PDFs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'training-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage training PDFs" 
ON storage.objects FOR ALL 
USING (bucket_id = 'training-pdfs' AND is_admin(auth.uid()));

-- Storage policies for certificates bucket (public for verification)
CREATE POLICY "Anyone can view certificates" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "System can manage certificates" 
ON storage.objects FOR ALL 
USING (bucket_id = 'certificates');

-- Create triggers for updated_at columns
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX idx_course_modules_order ON course_modules(course_id, order_index);
CREATE INDEX idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX idx_course_lessons_order ON course_lessons(module_id, order_index);
CREATE INDEX idx_user_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX idx_user_enrollments_course_id ON user_course_enrollments(course_id);
CREATE INDEX idx_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX idx_certificates_user_id ON user_certificates(user_id);
CREATE INDEX idx_certificates_verification ON user_certificates(verification_code);