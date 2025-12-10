import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

interface BackNavigationProps {
  onBackToDashboard?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function BackNavigation({ 
  onBackToDashboard, 
  showBackButton = true,
  className = '' 
}: BackNavigationProps) {

  const handleBack = () => {
    // Use browser history to go back to previous page
    window.history.back();
  };

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBackButton && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      {onBackToDashboard && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBackToDashboard}
          className="gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      )}
    </div>
  );
}
