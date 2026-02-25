import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { HelpHome } from './HelpHome';
import { HelpArticleView } from './HelpArticleView';
import { HelpCategoryView } from './HelpCategoryView';
import { HelpSupportForm } from './HelpSupportForm';
import { HelpChatbot } from './HelpChatbot';
import { PublicFooter } from '@/components/PublicFooter';

type HelpView = 'home' | 'article' | 'category' | 'support';

interface HelpCenterProps {
  onBack?: () => void;
  onNavigateToSection?: (section: string) => void;
  showChatbot?: boolean;
}

export default function HelpCenter({ onBack, onNavigateToSection, showChatbot = true }: HelpCenterProps) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<HelpView>('home');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<HelpView[]>([]);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotTranscript, setChatbotTranscript] = useState<string>('');

  const navigateTo = (view: HelpView, slug?: string) => {
    setNavigationHistory(prev => [...prev, currentView]);
    setCurrentView(view);
    if (view === 'article' && slug) {
      setSelectedArticleSlug(slug);
    } else if (view === 'category' && slug) {
      setSelectedCategorySlug(slug);
    }
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
    } else if (onBack) {
      onBack();
    }
  };

  const handleArticleClick = (slug: string) => {
    navigateTo('article', slug);
  };

  const handleCategoryClick = (slug: string) => {
    navigateTo('category', slug);
  };

  const handleContactSupport = () => {
    navigateTo('support');
  };

  const handleOpenChat = () => {
    setChatbotOpen(true);
  };

  const handleBackToHome = () => {
    setNavigationHistory([]);
    setCurrentView('home');
    setSelectedArticleSlug(null);
    setSelectedCategorySlug(null);
  };

  const handleNavigateToFeature = (route: string) => {
    // Parse the route to extract section parameter
    const url = new URL(route, window.location.origin);
    const section = url.searchParams.get('section');
    
    if (section && onNavigateToSection) {
      // Use the callback to change section within the Dashboard
      onNavigateToSection(section);
    } else {
      // Fallback: navigate using router
      navigate(route);
    }
  };

  return (
    <div className="min-h-full bg-background relative">
      {/* Header with back navigation */}
      {(currentView !== 'home' || onBack) && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-6 pb-24">
        {currentView === 'home' && (
          <HelpHome
            onNavigateToArticle={handleArticleClick}
            onNavigateToCategory={handleCategoryClick}
            onOpenChat={handleOpenChat}
            onOpenSupport={handleContactSupport}
          />
        )}

        {currentView === 'article' && selectedArticleSlug && (
          <HelpArticleView
            slug={selectedArticleSlug}
            onBack={goBack}
            onNavigateToArticle={handleArticleClick}
            onOpenChat={handleOpenChat}
            onNavigateToFeature={handleNavigateToFeature}
          />
        )}

        {currentView === 'category' && selectedCategorySlug && (
          <HelpCategoryView
            categorySlug={selectedCategorySlug}
            onBack={goBack}
            onNavigateToArticle={handleArticleClick}
          />
        )}

        {currentView === 'support' && (
          <HelpSupportForm
            onBack={goBack}
            chatbotTranscript={chatbotTranscript}
          />
        )}
      </div>

      {/* Footer */}
      <PublicFooter />

      {/* Floating Chat Button */}
      {showChatbot && !chatbotOpen && (
        <Button
          onClick={handleOpenChat}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chatbot */}
      {showChatbot && (
        <HelpChatbot
          isOpen={chatbotOpen}
          onClose={() => setChatbotOpen(false)}
          onNavigateToArticle={(slug) => {
            setChatbotOpen(false);
            handleArticleClick(slug);
          }}
          onNavigateToSupport={() => {
            setChatbotOpen(false);
            handleContactSupport();
          }}
        />
      )}
    </div>
  );
}
