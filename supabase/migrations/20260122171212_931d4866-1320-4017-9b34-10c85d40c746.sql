-- Help Center Database Schema (Fixed version)

-- Categories table
CREATE TABLE public.help_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  display_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.help_categories(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tags table
CREATE TABLE public.help_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Articles table
CREATE TABLE public.help_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES public.help_categories(id) ON DELETE SET NULL,
  author_id UUID,
  goal TEXT,
  target_role TEXT DEFAULT 'contractor',
  expected_result TEXT,
  common_errors TEXT,
  escalation_path TEXT,
  related_route TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Article Tags junction table
CREATE TABLE public.help_article_tags (
  article_id UUID NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.help_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Related Articles junction table
CREATE TABLE public.help_related_articles (
  article_id UUID NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, related_article_id),
  CHECK (article_id != related_article_id)
);

-- Article Synonyms for search
CREATE TABLE public.help_synonyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  synonyms TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert common synonyms
INSERT INTO public.help_synonyms (term, synonyms) VALUES
  ('bank', ARRAY['ach', 'account', 'banking', 'connect bank', 'link bank', 'plaid']),
  ('estimate', ARRAY['quote', 'bid', 'proposal', 'pricing']),
  ('job', ARRAY['project', 'work order', 'contract']),
  ('lead', ARRAY['prospect', 'potential customer', 'opportunity']),
  ('customer', ARRAY['client', 'homeowner', 'contact']),
  ('invoice', ARRAY['bill', 'payment request', 'receipt']),
  ('phone', ARRAY['number', 'twilio', 'call', 'voice']),
  ('quickbooks', ARRAY['qb', 'accounting', 'bookkeeping', 'intuit']);

-- Feedback table
CREATE TABLE public.help_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.help_articles(id) ON DELETE SET NULL,
  user_id UUID,
  is_helpful BOOLEAN,
  feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'bug_report', 'feature_request', 'other')),
  comment TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search logs for analytics
CREATE TABLE public.help_search_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_article_id UUID REFERENCES public.help_articles(id) ON DELETE SET NULL,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support requests from Help Center
CREATE TABLE public.help_support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  contact_email TEXT,
  contact_phone TEXT,
  chatbot_transcript TEXT,
  related_article_id UUID REFERENCES public.help_articles(id) ON DELETE SET NULL,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Article redirects for renamed articles
CREATE TABLE public.help_redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  old_slug TEXT NOT NULL UNIQUE,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_redirects ENABLE ROW LEVEL SECURITY;

-- Public read policies for published content (authenticated users only)
CREATE POLICY "Authenticated users can view published categories"
  ON public.help_categories FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Authenticated users can view tags"
  ON public.help_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view published articles"
  ON public.help_articles FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Authenticated users can view article tags"
  ON public.help_article_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view related articles"
  ON public.help_related_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view synonyms"
  ON public.help_synonyms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view redirects"
  ON public.help_redirects FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated user policies for feedback and logs
CREATE POLICY "Authenticated users can create feedback"
  ON public.help_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own feedback"
  ON public.help_feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create search logs"
  ON public.help_search_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create support requests"
  ON public.help_support_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own support requests"
  ON public.help_support_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin policies using user_roles table
CREATE POLICY "Admins can manage categories"
  ON public.help_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage tags"
  ON public.help_tags FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage articles"
  ON public.help_articles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage article tags"
  ON public.help_article_tags FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage related articles"
  ON public.help_related_articles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage synonyms"
  ON public.help_synonyms FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage feedback"
  ON public.help_feedback FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can view search logs"
  ON public.help_search_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage support requests"
  ON public.help_support_requests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage redirects"
  ON public.help_redirects FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Create update timestamp triggers
CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON public.help_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_support_requests_updated_at
  BEFORE UPDATE ON public.help_support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for search performance
CREATE INDEX idx_help_articles_title ON public.help_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_help_articles_content ON public.help_articles USING gin(to_tsvector('english', content));
CREATE INDEX idx_help_articles_category ON public.help_articles(category_id);
CREATE INDEX idx_help_articles_published ON public.help_articles(is_published);
CREATE INDEX idx_help_search_logs_query ON public.help_search_logs(query);
CREATE INDEX idx_help_search_logs_created ON public.help_search_logs(created_at);
CREATE INDEX idx_help_feedback_article ON public.help_feedback(article_id);
CREATE INDEX idx_help_feedback_status ON public.help_feedback(status);