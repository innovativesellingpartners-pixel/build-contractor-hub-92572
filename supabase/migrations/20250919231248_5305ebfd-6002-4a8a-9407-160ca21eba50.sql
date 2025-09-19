-- Create user lesson notes table for note-taking functionality
CREATE TABLE public.user_lesson_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_lesson_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user lesson notes
CREATE POLICY "Users can view their own lesson notes" 
ON public.user_lesson_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson notes" 
ON public.user_lesson_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson notes" 
ON public.user_lesson_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson notes" 
ON public.user_lesson_notes 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all lesson notes" 
ON public.user_lesson_notes 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_lesson_notes_updated_at
BEFORE UPDATE ON public.user_lesson_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();