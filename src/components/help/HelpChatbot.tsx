import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Bot, User, ExternalLink, ThumbsUp, ThumbsDown, RotateCcw, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHelpSearch, useSubmitSupportRequest } from '@/hooks/useHelpCenter';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  articles?: Array<{ title: string; slug: string; excerpt?: string }>;
  actions?: Array<{ label: string; action: string; data?: any }>;
  timestamp: Date;
}

interface HelpChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToArticle: (slug: string) => void;
  onNavigateToSupport: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm the CT1 Help Bot. I can help you with:\n\n• Finding help articles\n• Navigating the CT1 Contractor Hub\n• Troubleshooting issues\n• Understanding features\n\nWhat can I help you with today?",
  timestamp: new Date(),
};

export function HelpChatbot({ 
  isOpen, 
  onClose, 
  onNavigateToArticle, 
  onNavigateToSupport,
  isMinimized = false,
  onToggleMinimize 
}: HelpChatbotProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitSupportRequest = useSubmitSupportRequest();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const generateId = () => Math.random().toString(36).substring(7);

  const searchKnowledgeBase = async (query: string) => {
    // Use unified search_knowledge function for better results
    const { data, error } = await supabase.rpc('search_knowledge', {
      search_query: query,
    });

    if (error) {
      console.error('Knowledge search error:', error);
      // Fallback to basic search
      const { data: fallback } = await supabase
        .from('help_articles')
        .select('id, title, slug, excerpt, content, related_route')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5);
      return (fallback || []).map(a => ({ ...a, source: 'help_article' }));
    }
    return data || [];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // First, search the knowledge base
      const articles = await searchKnowledgeBase(userMessage.content);
      
      // Build context for AI
      const articlesContext = articles.length > 0
        ? `\n\nRelevant help articles found:\n${articles.map(a => `- "${a.title}": ${a.excerpt || a.content.substring(0, 200)}...`).join('\n')}`
        : '\n\nNo directly matching articles found in the knowledge base.';

      // Call AI for response
      const response = await supabase.functions.invoke('help-chatbot', {
        body: {
          message: userMessage.content,
          context: articlesContext,
          userName: profile?.contact_name || 'Contractor',
          companyName: profile?.company_name,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.data?.message || "I apologize, but I couldn't process your request. Please try again or contact support.",
        articles: articles.length > 0 ? articles.map(a => ({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt || undefined,
        })) : undefined,
        actions: response.data?.suggestSupport ? [{
          label: 'Contact Support',
          action: 'support',
        }] : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback response based on search results
      const articles = await searchKnowledgeBase(userMessage.content).catch(() => []);
      
      const fallbackMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: articles.length > 0
          ? "I found some articles that might help you. Please check them out below, or let me know if you need more specific assistance."
          : "I couldn't find specific articles for your question. Would you like me to connect you with our support team?",
        articles: articles.length > 0 ? articles.map(a => ({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt || undefined,
        })) : undefined,
        actions: articles.length === 0 ? [{
          label: 'Contact Support',
          action: 'support',
        }] : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: string, data?: any) => {
    switch (action) {
      case 'support':
        onNavigateToSupport();
        break;
      case 'navigate':
        if (data?.route) {
          window.location.href = data.route;
        }
        break;
    }
  };

  const handleEscalate = async () => {
    const transcript = messages.map(m => 
      `[${m.role.toUpperCase()}] ${m.content}`
    ).join('\n\n');

    try {
      await submitSupportRequest.mutateAsync({
        subject: 'Help Bot Escalation',
        description: 'User requested escalation from Help Bot',
        chatbot_transcript: transcript,
      });
      
      toast({
        title: "Support Request Created",
        description: "Our team will review your conversation and get back to you soon.",
      });
      
      onNavigateToSupport();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create support request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">CT1 Help Bot</h3>
            <p className="text-xs text-muted-foreground">Ask me anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleReset} title="Reset conversation">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {onToggleMinimize && (
            <Button variant="ghost" size="icon" onClick={onToggleMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className={cn(
                "flex-1 max-w-[80%]",
                message.role === 'user' && "text-right"
              )}>
                <div className={cn(
                  "rounded-2xl px-4 py-2 inline-block text-left",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Related Articles */}
                {message.articles && message.articles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">Related articles:</p>
                    {message.articles.map((article, idx) => (
                      <Card
                        key={idx}
                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onNavigateToArticle(article.slug)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{article.title}</p>
                            {article.excerpt && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(action.action, action.data)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground">
            Powered by CT1 Help
          </p>
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0"
            onClick={handleEscalate}
          >
            Talk to a human
          </Button>
        </div>
      </div>
    </div>
  );
}
