import { useState } from 'react';
import { ArrowLeft, ThumbsUp, ThumbsDown, Clock, Eye, Tag, ExternalLink, ChevronRight, MessageSquare, Share2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useHelpArticle, useSubmitFeedback } from '@/hooks/useHelpCenter';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HelpArticleViewProps {
  slug: string;
  onBack: () => void;
  onNavigateToArticle: (slug: string) => void;
  onOpenChat: () => void;
  onNavigateToFeature?: (route: string) => void;
}

export function HelpArticleView({ slug, onBack, onNavigateToArticle, onOpenChat, onNavigateToFeature }: HelpArticleViewProps) {
  const { toast } = useToast();
  const { data: article, isLoading, error } = useHelpArticle(slug);
  const submitFeedback = useSubmitFeedback();
  
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');

  const handleFeedback = async (isHelpful: boolean) => {
    if (!article) return;
    
    const feedbackType = isHelpful ? 'helpful' : 'not_helpful';
    setFeedbackGiven(feedbackType);
    
    if (!isHelpful) {
      setShowFeedbackForm(true);
    } else {
      try {
        await submitFeedback.mutateAsync({
          article_id: article.id,
          is_helpful: true,
          feedback_type: 'helpful',
        });
        toast({
          title: "Thanks for your feedback!",
          description: "We're glad this article was helpful.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmitNegativeFeedback = async () => {
    if (!article) return;
    
    try {
      await submitFeedback.mutateAsync({
        article_id: article.id,
        is_helpful: false,
        feedback_type: 'not_helpful',
        comment: feedbackComment,
      });
      setShowFeedbackForm(false);
      toast({
        title: "Thanks for your feedback!",
        description: "We'll use this to improve our help content.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: article?.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find the article you're looking for.
          </p>
          <Button onClick={onBack}>Return to Help Center</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span>/</span>
          {article.category && (
            <>
              <span className="hover:text-primary cursor-pointer">
                {article.category.name}
              </span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Article Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {article.category && (
                <Badge variant="secondary">{article.category.name}</Badge>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated {format(new Date(article.updated_at), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.view_count} views
              </span>
            </div>
          </div>

          {/* Goal Section */}
          {article.goal && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  🎯 Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{article.goal}</p>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Card>
            <CardContent className="pt-6">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert
                  prose-headings:text-foreground prose-headings:font-semibold
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground
                  prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                  prose-li:marker:text-primary
                  prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </CardContent>
          </Card>

          {/* Expected Result */}
          {article.expected_result && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                  ✅ Expected Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{article.expected_result}</p>
              </CardContent>
            </Card>
          )}

          {/* Common Errors */}
          {article.common_errors && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  ⚠️ Common Errors & Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: article.common_errors }}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigate to Feature */}
          {article.related_route && onNavigateToFeature && (
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => onNavigateToFeature(article.related_route!)}
                  className="flex items-center justify-between hover:bg-muted/50 -m-4 p-4 rounded-lg transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <span className="font-medium">Open this feature in CT1</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Feedback Section */}
          <Card className="print:hidden">
            <CardContent className="p-6">
              {!feedbackGiven ? (
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Was this article helpful?</h3>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleFeedback(true)}
                      className="gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Yes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleFeedback(false)}
                      className="gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No
                    </Button>
                  </div>
                </div>
              ) : showFeedbackForm ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Help us improve</h3>
                  <p className="text-sm text-muted-foreground">
                    What information were you looking for? How can we make this article better?
                  </p>
                  <Textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Your feedback..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitNegativeFeedback} disabled={submitFeedback.isPending}>
                      Submit Feedback
                    </Button>
                    <Button variant="ghost" onClick={() => setShowFeedbackForm(false)}>
                      Skip
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Thanks for your feedback! 🎉
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalation */}
          {article.escalation_path && (
            <Card className="bg-muted/50 print:hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Still need help?</h3>
                    <p className="text-sm text-muted-foreground">{article.escalation_path}</p>
                  </div>
                  <Button onClick={onOpenChat} className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat with Help Bot
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 print:hidden">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Article Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Helpful</span>
                <span className="font-medium text-green-600">{article.helpful_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">For</span>
                <Badge variant="outline" className="capitalize">{article.target_role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{article.version}</span>
              </div>
            </CardContent>
          </Card>

          {/* Related Articles would go here */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={onOpenChat}
              >
                <MessageSquare className="h-4 w-4" />
                Ask Help Bot
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                asChild
              >
                <a href="mailto:support@myct1.com">
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
