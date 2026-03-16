import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Settings, Phone, CreditCard, Users, FileText, Briefcase, BarChart2, HelpCircle, MessageSquare, Bug, Lightbulb, ChevronRight, Star, Zap, Bot, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHelpCategories, useFeaturedArticles, useHelpSearch, useLogArticleClick } from '@/hooks/useHelpCenter';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface HelpHomeProps {
  onNavigateToArticle: (slug: string) => void;
  onNavigateToCategory: (slug: string) => void;
  onOpenChat: () => void;
  onOpenSupport: () => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'account-setup': Settings,
  'crm': Users,
  'leads': Briefcase,
  'estimates': FileText,
  'jobs': Briefcase,
  'invoices': CreditCard,
  'payments': CreditCard,
  'phone-setup': Phone,
  'quickbooks': BarChart2,
  'troubleshooting': HelpCircle,
  'default': BookOpen,
};

const quickActions = [
  { label: 'Create a Lead', route: '/dashboard?section=leads', icon: Users },
  { label: 'Write an Estimate', route: '/dashboard?section=estimates', icon: FileText },
  { label: 'Connect QuickBooks', article: 'connect-quickbooks', icon: BarChart2 },
  { label: 'Set Up Phone Number', article: 'setup-phone-number', icon: Phone },
  { label: 'Connect Bank Account', article: 'connect-bank-account', icon: CreditCard },
];

export function HelpHome({ onNavigateToArticle, onNavigateToCategory, onOpenChat, onOpenSupport }: HelpHomeProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSearched, setAiSearched] = useState(false);
  
  const { data: categories = [], isLoading: categoriesLoading } = useHelpCategories();
  const { data: featuredArticles = [], isLoading: featuredLoading } = useFeaturedArticles();
  const { data: searchResults = [], isLoading: searchLoading } = useHelpSearch(searchQuery);
  const logClick = useLogArticleClick();

  // Auto-trigger AI when article search returns few/no results
  useEffect(() => {
    if (!showSearchResults || searchQuery.length < 3 || searchLoading) return;
    if (searchResults.length <= 2 && !aiSearched && !aiLoading) {
      fetchAIAnswer(searchQuery);
    }
  }, [searchResults, searchLoading, showSearchResults, searchQuery]);

  const fetchAIAnswer = useCallback(async (query: string) => {
    setAiLoading(true);
    setAiSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('help-chatbot', {
        body: {
          message: query,
          userName: profile?.contact_name || 'Contractor',
          companyName: profile?.company_name,
          conversationHistory: [],
        },
      });
      if (!error && data?.message) {
        setAiAnswer(data.message);
      }
    } catch (e) {
      console.error('AI search error:', e);
    } finally {
      setAiLoading(false);
    }
  }, [profile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(true);
      setAiAnswer('');
      setAiSearched(false);
    }
  };

  const handleSearchResultClick = (article: any) => {
    logClick.mutate({ query: searchQuery, articleId: article.id });
    onNavigateToArticle(article.slug);
    setShowSearchResults(false);
    setSearchQuery('');
    setAiAnswer('');
    setAiSearched(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.length >= 2);
    if (value.length < 2) {
      setAiAnswer('');
      setAiSearched(false);
    }
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.article) {
      onNavigateToArticle(action.article);
    } else if (action.route) {
      navigate(action.route);
    }
  };

  const getCategoryIcon = (slug: string) => {
    return categoryIcons[slug] || categoryIcons.default;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section with Search */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How can we help you?
          </h1>
          <p className="text-muted-foreground mb-6">
            Search our knowledge base or browse categories below
          </p>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for help articles... (e.g., 'create estimate', 'connect bank')"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length >= 2);
                }}
                className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 border-primary/20 focus:border-primary"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground mb-2">No results found for "{searchQuery}"</p>
                    <Button variant="outline" size="sm" onClick={onOpenChat}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask our Help Bot
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {searchResults.map((article) => (
                      <li key={article.id}>
                        <button
                          onClick={() => handleSearchResultClick(article)}
                          className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3"
                        >
                          <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{article.title}</p>
                            {article.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {article.excerpt}
                              </p>
                            )}
                            {article.category && (
                              <Badge variant="secondary" className="mt-2">
                                {article.category.name}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => handleQuickAction(action)}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => onNavigateToArticle(article.slug)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {article.view_count} views
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse by Category */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Browse by Category
        </h2>
        {categoriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug);
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                  onClick={() => onNavigateToCategory(category.slug)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription className="line-clamp-1 mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact & Feedback Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={onOpenChat}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Chat with Help Bot</CardTitle>
                <CardDescription>Get instant answers</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={onOpenSupport}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Bug className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">Report an Issue</CardTitle>
                <CardDescription>Found a bug? Let us know</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => onOpenSupport()}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Lightbulb className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base">Request a Feature</CardTitle>
                <CardDescription>Share your ideas</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Contact Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">Need more help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team is here to help you succeed
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a href="mailto:support@myct1.com">
                  Email Support
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:+14198274285">
                  Call Us
                </a>
              </Button>
              <Button onClick={onOpenSupport}>
                Submit a Ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
