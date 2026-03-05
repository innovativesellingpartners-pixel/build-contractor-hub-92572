
-- Create knowledge_base_entries table
CREATE TABLE public.knowledge_base_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'faq',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraint for category values
ALTER TABLE public.knowledge_base_entries ADD CONSTRAINT knowledge_base_entries_category_check
  CHECK (category IN ('platform_howto', 'sales_training', 'objection_handling', 'scripts', 'faq', 'best_practices'));

-- Enable RLS
ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage KB entries"
  ON public.knowledge_base_entries
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Authenticated users can read active entries
CREATE POLICY "Authenticated users can read active KB entries"
  ON public.knowledge_base_entries
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create unified search function
CREATE OR REPLACE FUNCTION public.search_knowledge(search_query TEXT)
RETURNS TABLE (
  source TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  relevance INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  query_words TEXT[];
  query_lower TEXT;
BEGIN
  query_lower := lower(trim(search_query));
  query_words := string_to_array(query_lower, ' ');

  RETURN QUERY
  -- Search help_articles
  SELECT
    'help_article'::TEXT as source,
    ha.id,
    ha.title,
    ha.content,
    ha.excerpt,
    (
      CASE WHEN lower(ha.title) = query_lower THEN 100 ELSE 0 END +
      CASE WHEN lower(ha.title) ILIKE '%' || query_lower || '%' THEN 50 ELSE 0 END +
      CASE WHEN ha.content ILIKE '%' || query_lower || '%' THEN 20 ELSE 0 END +
      CASE WHEN ha.excerpt ILIKE '%' || query_lower || '%' THEN 30 ELSE 0 END +
      (SELECT COUNT(*)::INTEGER * 10 FROM unnest(query_words) w WHERE ha.title ILIKE '%' || w || '%') +
      (SELECT COUNT(*)::INTEGER * 5 FROM unnest(query_words) w WHERE ha.content ILIKE '%' || w || '%')
    )::INTEGER as relevance
  FROM public.help_articles ha
  WHERE ha.is_published = true
    AND (
      ha.title ILIKE '%' || query_lower || '%'
      OR ha.content ILIKE '%' || query_lower || '%'
      OR ha.excerpt ILIKE '%' || query_lower || '%'
      OR EXISTS (SELECT 1 FROM unnest(query_words) w WHERE ha.title ILIKE '%' || w || '%')
      OR EXISTS (SELECT 1 FROM unnest(query_words) w WHERE ha.content ILIKE '%' || w || '%')
    )

  UNION ALL

  -- Search knowledge_base_entries
  SELECT
    'knowledge_base'::TEXT as source,
    kb.id,
    kb.title,
    kb.content,
    left(kb.content, 200) as excerpt,
    (
      CASE WHEN lower(kb.title) = query_lower THEN 100 ELSE 0 END +
      CASE WHEN lower(kb.title) ILIKE '%' || query_lower || '%' THEN 50 ELSE 0 END +
      CASE WHEN kb.content ILIKE '%' || query_lower || '%' THEN 20 ELSE 0 END +
      CASE WHEN kb.keywords && query_words THEN 40 ELSE 0 END +
      (SELECT COUNT(*)::INTEGER * 10 FROM unnest(query_words) w WHERE kb.title ILIKE '%' || w || '%') +
      (SELECT COUNT(*)::INTEGER * 5 FROM unnest(query_words) w WHERE kb.content ILIKE '%' || w || '%') +
      (SELECT COUNT(*)::INTEGER * 15 FROM unnest(kb.keywords) kw WHERE kw = ANY(query_words))
    )::INTEGER as relevance
  FROM public.knowledge_base_entries kb
  WHERE kb.is_active = true
    AND (
      kb.title ILIKE '%' || query_lower || '%'
      OR kb.content ILIKE '%' || query_lower || '%'
      OR kb.keywords && query_words
      OR EXISTS (SELECT 1 FROM unnest(query_words) w WHERE kb.title ILIKE '%' || w || '%')
      OR EXISTS (SELECT 1 FROM unnest(query_words) w WHERE kb.content ILIKE '%' || w || '%')
    )

  ORDER BY relevance DESC
  LIMIT 10;
END;
$$;

-- Updated_at trigger
CREATE TRIGGER update_knowledge_base_entries_updated_at
  BEFORE UPDATE ON public.knowledge_base_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
