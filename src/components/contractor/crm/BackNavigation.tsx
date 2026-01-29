import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

interface BackNavigationProps {
  onBackToDashboard?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function BackNavigation({ 
  onBackToDashboard,
  onBack,
  showBackButton = true,
  className = '' 
}: BackNavigationProps) {

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  return (
    <div className={`flex items-center gap-2 overflow-hidden max-w-full ${className}`}>
      {/* CT1 Logo */}
      <img 
        src={ct1Logo} 
        alt="CT1" 
        className="h-8 w-8 rounded-full flex-shrink-0"
      />
      
      {showBackButton && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="gap-1 px-2 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs">Back</span>
        </Button>
      )}
      {onBackToDashboard && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBackToDashboard}
          className="gap-1 px-2 flex-shrink-0"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-xs">Dash</span>
        </Button>
      )}
    </div>
  );
}
