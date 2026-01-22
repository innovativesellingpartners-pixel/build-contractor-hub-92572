import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  display_order: number;
  parent_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category_id: string | null;
  author_id: string | null;
  goal: string | null;
  target_role: string;
  expected_result: string | null;
  common_errors: string | null;
  escalation_path: string | null;
  related_route: string | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category?: HelpCategory;
}

export interface HelpTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface HelpFeedback {
  id: string;
  article_id: string | null;
  user_id: string | null;
  is_helpful: boolean | null;
  feedback_type: 'helpful' | 'not_helpful' | 'bug_report' | 'feature_request' | 'other';
  comment: string | null;
  contact_email: string | null;
  status: 'new' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface HelpSupportRequest {
  id: string;
  user_id: string | null;
  subject: string;
  description: string;
  category: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  contact_email: string | null;
  contact_phone: string | null;
  chatbot_transcript: string | null;
  related_article_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelpSearchLog {
  id: string;
  user_id: string | null;
  query: string;
  results_count: number;
  clicked_article_id: string | null;
  filters: Record<string, any> | null;
  created_at: string;
}

// Fetch all published categories
export function useHelpCategories() {
  return useQuery({
    queryKey: ['help-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as HelpCategory[];
    },
  });
}

// Fetch all published articles
export function useHelpArticles(categorySlug?: string) {
  return useQuery({
    queryKey: ['help-articles', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('help_articles')
        .select(`
          *,
          category:help_categories(*)
        `)
        .eq('is_published', true)
        .order('title', { ascending: true });
      
      if (categorySlug) {
        const { data: category } = await supabase
          .from('help_categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as HelpArticle[];
    },
  });
}

// Fetch featured articles
export function useFeaturedArticles() {
  return useQuery({
    queryKey: ['help-articles-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select(`
          *,
          category:help_categories(*)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as HelpArticle[];
    },
  });
}

// Fetch a single article by slug
export function useHelpArticle(slug: string) {
  return useQuery({
    queryKey: ['help-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select(`
          *,
          category:help_categories(*)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      
      // Increment view count
      await supabase
        .from('help_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
      
      return data as HelpArticle;
    },
    enabled: !!slug,
  });
}

// Search articles
export function useHelpSearch(query: string, filters?: { category?: string; role?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['help-search', query, filters],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      // First, get synonyms to expand search
      const { data: synonymsData } = await supabase
        .from('help_synonyms')
        .select('term, synonyms');
      
      const synonyms = synonymsData || [];
      let expandedTerms = [query.toLowerCase()];
      
      // Check if query matches any synonym
      synonyms.forEach(s => {
        if (s.term.toLowerCase() === query.toLowerCase() || 
            s.synonyms.some((syn: string) => syn.toLowerCase() === query.toLowerCase())) {
          expandedTerms.push(s.term);
          expandedTerms.push(...s.synonyms);
        }
      });
      
      // Remove duplicates
      expandedTerms = [...new Set(expandedTerms)];
      
      // Build search query
      const searchPattern = expandedTerms.map(t => `%${t}%`);
      
      let dbQuery = supabase
        .from('help_articles')
        .select(`
          *,
          category:help_categories(*)
        `)
        .eq('is_published', true);
      
      // Search in title and content
      const orConditions = searchPattern.map(p => `title.ilike.${p},content.ilike.${p},excerpt.ilike.${p}`).join(',');
      dbQuery = dbQuery.or(orConditions);
      
      if (filters?.category) {
        const { data: category } = await supabase
          .from('help_categories')
          .select('id')
          .eq('slug', filters.category)
          .single();
        
        if (category) {
          dbQuery = dbQuery.eq('category_id', category.id);
        }
      }
      
      if (filters?.role) {
        dbQuery = dbQuery.eq('target_role', filters.role);
      }
      
      const { data, error } = await dbQuery.order('view_count', { ascending: false }).limit(20);
      
      if (error) throw error;
      
      // Log search
      if (user) {
        await supabase.from('help_search_logs').insert({
          user_id: user.id,
          query,
          results_count: data?.length || 0,
          filters: filters || null,
        });
      }
      
      return data as HelpArticle[];
    },
    enabled: query.length >= 2,
  });
}

// Submit feedback
export function useSubmitFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (feedback: {
      article_id?: string;
      is_helpful?: boolean;
      feedback_type: 'helpful' | 'not_helpful' | 'bug_report' | 'feature_request' | 'other';
      comment?: string;
      contact_email?: string;
    }) => {
      const { data, error } = await supabase
        .from('help_feedback')
        .insert({
          ...feedback,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update article helpful/not helpful counts
      if (feedback.article_id && feedback.is_helpful !== undefined) {
        const field = feedback.is_helpful ? 'helpful_count' : 'not_helpful_count';
        // Increment the count directly
        const { data: article } = await supabase
          .from('help_articles')
          .select(field)
          .eq('id', feedback.article_id)
          .single();
        
        if (article) {
          const currentCount = (article as any)[field] || 0;
          await supabase
            .from('help_articles')
            .update({ [field]: currentCount + 1 })
            .eq('id', feedback.article_id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
    },
  });
}

// Submit support request
export function useSubmitSupportRequest() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (request: {
      subject: string;
      description: string;
      category?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      contact_email?: string;
      contact_phone?: string;
      chatbot_transcript?: string;
      related_article_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('help_support_requests')
        .insert({
          ...request,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}

// Log article click from search
export function useLogArticleClick() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ query, articleId }: { query: string; articleId: string }) => {
      if (!user) return;
      
      // Find the most recent search log for this query and update it
      const { data: logs } = await supabase
        .from('help_search_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('query', query)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (logs && logs.length > 0) {
        await supabase
          .from('help_search_logs')
          .update({ clicked_article_id: articleId })
          .eq('id', logs[0].id);
      }
    },
  });
}
