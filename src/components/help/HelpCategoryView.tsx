import { ArrowLeft, BookOpen, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHelpArticles, useHelpCategories } from '@/hooks/useHelpCenter';

interface HelpCategoryViewProps {
  categorySlug: string;
  onBack: () => void;
  onNavigateToArticle: (slug: string) => void;
}

export function HelpCategoryView({ categorySlug, onBack, onNavigateToArticle }: HelpCategoryViewProps) {
  const { data: categories = [] } = useHelpCategories();
  const { data: articles = [], isLoading } = useHelpArticles(categorySlug);
  
  const category = categories.find(c => c.slug === categorySlug);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 gap-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <span>/</span>
        <span className="text-foreground">{category?.name || 'Category'}</span>
      </div>

      {/* Category Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{category?.name || 'Category'}</h1>
            {category?.description && (
              <p className="text-muted-foreground">{category.description}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="mt-2">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Articles Yet</h2>
          <p className="text-muted-foreground mb-4">
            We're working on adding content to this category.
          </p>
          <Button onClick={onBack}>Browse Other Categories</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => onNavigateToArticle(article.slug)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {article.is_featured && (
                        <Badge variant="outline" className="text-xs">
                          Popular
                        </Badge>
                      )}
                      <span>{article.view_count} views</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
