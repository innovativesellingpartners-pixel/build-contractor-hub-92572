import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, TrendingUp, MessageSquare, AlertCircle, FileText, BarChart3, BookOpen, Upload } from 'lucide-react';
import type { HelpArticle, HelpCategory, HelpFeedback, HelpSupportRequest, HelpSearchLog } from '@/hooks/useHelpCenter';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';

export function HelpAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('articles');
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HelpCategory | null>(null);

  // Fetch all articles (including unpublished)
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['admin-help-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*, category:help_categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as HelpArticle[];
    },
  });

  // Fetch all categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-help-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as HelpCategory[];
    },
  });

  // Fetch feedback
  const { data: feedback = [] } = useQuery({
    queryKey: ['admin-help-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_feedback')
        .select('*, article:help_articles(title)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch support requests
  const { data: supportRequests = [] } = useQuery({
    queryKey: ['admin-help-support-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_support_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as HelpSupportRequest[];
    },
  });

  // Fetch search logs for analytics
  const { data: searchLogs = [] } = useQuery({
    queryKey: ['admin-help-search-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_search_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as HelpSearchLog[];
    },
  });

  // Calculate analytics
  const analytics = {
    topSearches: Object.entries(
      searchLogs.reduce((acc, log) => {
        acc[log.query] = (acc[log.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    zeroResultSearches: searchLogs
      .filter(log => log.results_count === 0)
      .reduce((acc, log) => {
        acc[log.query] = (acc[log.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    mostViewed: [...articles].sort((a, b) => b.view_count - a.view_count).slice(0, 10),
    lowestRated: [...articles]
      .filter(a => a.helpful_count + a.not_helpful_count > 0)
      .sort((a, b) => {
        const aRatio = a.helpful_count / (a.helpful_count + a.not_helpful_count);
        const bRatio = b.helpful_count / (b.helpful_count + b.not_helpful_count);
        return aRatio - bRatio;
      })
      .slice(0, 10),
  };

  // Mutations
  const saveArticle = useMutation({
    mutationFn: async (article: Partial<HelpArticle> & { id?: string }) => {
      if (article.id) {
        const { data, error } = await supabase
          .from('help_articles')
          .update({
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            category_id: article.category_id,
            goal: article.goal,
            target_role: article.target_role,
            expected_result: article.expected_result,
            common_errors: article.common_errors,
            escalation_path: article.escalation_path,
            related_route: article.related_route,
            is_published: article.is_published,
            is_featured: article.is_featured,
            version: (article.version || 1) + 1,
            published_at: article.is_published ? new Date().toISOString() : null,
          })
          .eq('id', article.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('help_articles')
          .insert({
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            category_id: article.category_id,
            goal: article.goal,
            target_role: article.target_role || 'all',
            expected_result: article.expected_result,
            common_errors: article.common_errors,
            escalation_path: article.escalation_path,
            related_route: article.related_route,
            is_published: article.is_published || false,
            is_featured: article.is_featured || false,
            published_at: article.is_published ? new Date().toISOString() : null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
      setIsArticleDialogOpen(false);
      setEditingArticle(null);
      toast({ title: 'Article saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving article', description: error.message, variant: 'destructive' });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('help_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
      toast({ title: 'Article deleted' });
    },
  });

  const toggleArticlePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('help_articles')
        .update({ 
          is_published, 
          published_at: is_published ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
    },
  });

  const saveCategory = useMutation({
    mutationFn: async (category: Partial<HelpCategory> & { id?: string }) => {
      if (category.id) {
        const { error } = await supabase
          .from('help_categories')
          .update({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            display_order: category.display_order,
            is_published: category.is_published,
          })
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('help_categories')
          .insert({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon || 'FileText',
            display_order: category.display_order || categories.length + 1,
            is_published: category.is_published ?? true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-categories'] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({ title: 'Category saved successfully' });
    },
  });

  const updateFeedbackStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('help_feedback')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-feedback'] });
    },
  });

  const updateSupportRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('help_support_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-support-requests'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help Center Admin</h1>
          <p className="text-muted-foreground">Manage articles, categories, and view analytics</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge-base">
          <KnowledgeBaseManager />
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingArticle(null); setIsArticleDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>{article.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>
                        <Badge variant={article.is_published ? 'default' : 'secondary'}>
                          {article.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {article.is_featured && (
                          <Badge variant="outline" className="ml-1">Featured</Badge>
                        )}
                      </TableCell>
                      <TableCell>{article.view_count}</TableCell>
                      <TableCell>
                        {article.helpful_count + article.not_helpful_count > 0 ? (
                          <span className="text-sm">
                            {Math.round((article.helpful_count / (article.helpful_count + article.not_helpful_count)) * 100)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No ratings</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleArticlePublish.mutate({ 
                              id: article.id, 
                              is_published: !article.is_published 
                            })}
                          >
                            {article.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingArticle(article); setIsArticleDialogOpen(true); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteArticle.mutate(article.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {articles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No articles yet. Click "New Article" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCategory(null); setIsCategoryDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant={category.is_published ? 'default' : 'secondary'}>
                      {category.is_published ? 'Published' : 'Hidden'}
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Order: {category.display_order}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingCategory(category); setIsCategoryDialogOpen(true); }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.topSearches.map(([query, count], idx) => (
                    <div key={query} className="flex items-center justify-between">
                      <span className="text-sm">
                        {idx + 1}. {query}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  {analytics.topSearches.length === 0 && (
                    <p className="text-muted-foreground text-sm">No search data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Zero Result Searches
                </CardTitle>
                <CardDescription>Searches that found no articles - content gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.zeroResultSearches)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([query, count]) => (
                      <div key={query} className="flex items-center justify-between">
                        <span className="text-sm">{query}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(analytics.zeroResultSearches).length === 0 && (
                    <p className="text-muted-foreground text-sm">No zero-result searches</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Viewed Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.mostViewed.map((article, idx) => (
                    <div key={article.id} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">
                        {idx + 1}. {article.title}
                      </span>
                      <Badge variant="secondary">{article.view_count} views</Badge>
                    </div>
                  ))}
                  {analytics.mostViewed.length === 0 && (
                    <p className="text-muted-foreground text-sm">No article views yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lowest Rated Articles</CardTitle>
                <CardDescription>Articles that need improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.lowestRated.map((article) => {
                    const total = article.helpful_count + article.not_helpful_count;
                    const ratio = Math.round((article.helpful_count / total) * 100);
                    return (
                      <div key={article.id} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{article.title}</span>
                        <Badge variant={ratio < 50 ? 'destructive' : 'secondary'}>
                          {ratio}% helpful
                        </Badge>
                      </div>
                    );
                  })}
                  {analytics.lowestRated.length === 0 && (
                    <p className="text-muted-foreground text-sm">No rated articles yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={item.is_helpful ? 'default' : item.is_helpful === false ? 'destructive' : 'secondary'}>
                          {item.feedback_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.article?.title || 'General'}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.comment || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={item.status}
                          onValueChange={(status) => updateFeedbackStatus.mutate({ id: item.id, status })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {feedback.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No feedback yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Requests Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium max-w-xs truncate">{request.subject}</TableCell>
                      <TableCell>{request.category || 'General'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.priority === 'urgent' ? 'destructive' :
                          request.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={request.status}
                          onValueChange={(status) => updateSupportRequestStatus.mutate({ id: request.id, status })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="waiting">Waiting</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {supportRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No support requests yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Article Dialog */}
      <ArticleDialog
        isOpen={isArticleDialogOpen}
        onClose={() => { setIsArticleDialogOpen(false); setEditingArticle(null); }}
        article={editingArticle}
        categories={categories}
        onSave={(article) => saveArticle.mutate(article)}
        isSaving={saveArticle.isPending}
      />

      {/* Category Dialog */}
      <CategoryDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => { setIsCategoryDialogOpen(false); setEditingCategory(null); }}
        category={editingCategory}
        onSave={(category) => saveCategory.mutate(category)}
        isSaving={saveCategory.isPending}
      />
    </div>
  );
}

// Article Dialog Component
function ArticleDialog({
  isOpen,
  onClose,
  article,
  categories,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  article: HelpArticle | null;
  categories: HelpCategory[];
  onSave: (article: Partial<HelpArticle>) => void;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  const emptyForm: Partial<HelpArticle> = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: undefined,
    goal: '',
    target_role: 'all',
    expected_result: '',
    common_errors: '',
    escalation_path: '',
    related_route: '',
    is_published: false,
    is_featured: false,
  };

  const [formData, setFormData] = useState<Partial<HelpArticle>>(emptyForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Populate form whenever article prop changes or dialog opens
  React.useEffect(() => {
    if (isOpen) {
      if (article) {
        setFormData({ ...article });
        setSlugManuallyEdited(true); // existing article already has slug
      } else {
        setFormData({ ...emptyForm });
        setSlugManuallyEdited(false);
      }
    }
  }, [isOpen, article]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    const updates: Partial<HelpArticle> = { ...formData, title };
    if (!slugManuallyEdited) {
      updates.slug = generateSlug(title);
    }
    setFormData(updates);
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData({ ...formData, slug });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const text = await file.text();
      setFormData(prev => ({
        ...prev,
        content: prev.content ? prev.content + '\n\n' + text : text,
        title: prev.title || file.name.replace(/\.(md|txt)$/, '').replace(/[-_]/g, ' '),
        slug: prev.slug || generateSlug(file.name.replace(/\.(md|txt)$/, '')),
      }));
      toast({ title: 'Document content imported' });
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const text = await file.text();
      setFormData(prev => ({
        ...prev,
        content: prev.content ? prev.content + '\n\n' + text : text,
      }));
      toast({ title: 'CSV content imported' });
    } else {
      toast({ title: 'Unsupported file type', description: 'Please upload .txt, .md, or .csv files', variant: 'destructive' });
    }
    e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{article ? `Edit: ${article.title}` : 'New Article'}</DialogTitle>
          <DialogDescription>
            {article ? 'Edit this article\'s details below.' : 'Fill in the article details. Use the template fields for structured content.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Document Upload */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              <Label className="flex items-center gap-2 cursor-pointer justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Upload className="h-4 w-4" />
                <span>Upload a document (.txt, .md, .csv) to import content</span>
                <input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" className="hidden" onChange={handleFileUpload} />
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="How to create an estimate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug (auto-generated, editable)</Label>
                <Input
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="create-estimate"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_role">Target Role</Label>
                <Select
                  value={formData.target_role || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, target_role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="contractor">Contractors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Short Description)</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="A brief description of what this article covers..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                value={formData.goal || ''}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="What will the user accomplish after reading this?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="## Steps&#10;1. First step...&#10;2. Second step..."
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_result">Expected Result</Label>
              <Textarea
                id="expected_result"
                value={formData.expected_result || ''}
                onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                placeholder="What should the user see/experience after completing this?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="common_errors">Common Errors & Fixes</Label>
              <Textarea
                id="common_errors"
                value={formData.common_errors || ''}
                onChange={(e) => setFormData({ ...formData, common_errors: e.target.value })}
                placeholder="List common issues and their solutions..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="related_route">Related App Route</Label>
                <Input
                  id="related_route"
                  value={formData.related_route || ''}
                  onChange={(e) => setFormData({ ...formData, related_route: e.target.value })}
                  placeholder="/dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escalation_path">Escalation Path</Label>
                <Input
                  id="escalation_path"
                  value={formData.escalation_path || ''}
                  onChange={(e) => setFormData({ ...formData, escalation_path: e.target.value })}
                  placeholder="Contact support at..."
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...formData, id: article?.id })} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Article'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Category Dialog Component
function CategoryDialog({
  isOpen,
  onClose,
  category,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: HelpCategory | null;
  onSave: (category: Partial<HelpCategory>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<HelpCategory>>({});

  const handleOpen = () => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: 'FileText',
        display_order: 1,
        is_published: true,
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); else handleOpen(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                name: e.target.value,
                slug: formData.slug || generateSlug(e.target.value)
              })}
              placeholder="Account Setup"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="account-setup"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Help articles about setting up your account..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon (Lucide icon name)</Label>
              <Input
                id="cat-icon"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="User"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display Order</Label>
              <Input
                id="cat-order"
                type="number"
                value={formData.display_order || 1}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="cat-published"
              checked={formData.is_published ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
            <Label htmlFor="cat-published">Published</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...formData, id: category?.id })} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
