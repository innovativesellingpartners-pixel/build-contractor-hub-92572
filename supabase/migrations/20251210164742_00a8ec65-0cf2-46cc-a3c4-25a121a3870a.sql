-- Create estimate_templates table for storing reusable estimate templates
CREATE TABLE public.estimate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  scope_summary TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'account')),
  line_items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own private templates
CREATE POLICY "Users can view own templates"
ON public.estimate_templates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view account-wide templates (all users in system can see account templates)
CREATE POLICY "Users can view account templates"
ON public.estimate_templates
FOR SELECT
USING (visibility = 'account');

-- Users can create their own templates
CREATE POLICY "Users can create templates"
ON public.estimate_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.estimate_templates
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.estimate_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_estimate_templates_updated_at
  BEFORE UPDATE ON public.estimate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();