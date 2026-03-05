import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

interface CrmNavHeaderProps {
  back?: boolean;
  dashboard?: boolean;
  onBack?: () => void;
  onDashboard?: () => void;
  sectionLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CrmNavHeader({
  back = true,
  dashboard = true,
  onBack,
  onDashboard,
  sectionLabel,
  className,
  children,
}: CrmNavHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      }
    }
  };

  const handleDashboard = () => {
    if (onDashboard) {
      onDashboard();
    }
  };

  if (!back && !dashboard && !children) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center justify-between gap-2 py-2 px-3 sm:px-4 overflow-hidden max-w-full',
      className
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <Link to="/home" className="flex-shrink-0">
          <img 
            src={ct1Logo} 
            alt="CT1" 
            className="h-8 w-8 rounded-full flex-shrink-0 hover:opacity-80 transition-opacity"
          />
        </Link>
        
        {back && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1 text-muted-foreground hover:text-foreground h-9 px-3 flex-shrink-0 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-medium">Back</span>
          </Button>
        )}
        
        {dashboard && onDashboard && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDashboard}
            className="gap-1 h-9 px-3 flex-shrink-0 rounded-xl"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs font-medium">Dash</span>
          </Button>
        )}
        
        {sectionLabel && (
          <span className="text-xs text-muted-foreground hidden sm:inline truncate font-medium">
            / {sectionLabel}
          </span>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-1 flex-shrink-0 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
}

export function getCrmFallbackRoute(currentSection: string): string {
  const fallbacks: Record<string, string> = {
    leads: 'leads',
    jobs: 'jobs',
    estimates: 'estimates',
    customers: 'customers',
    invoices: 'invoices',
    calendar: 'calendar',
    calls: 'calls',
    emails: 'emails',
    gc: 'gc',
    contacts: 'contacts',
    templates: 'estimates',
    payments: 'accounting',
    accounting: 'dashboard',
    reporting: 'dashboard',
  };
  
  return fallbacks[currentSection] || 'dashboard';
}

export default CrmNavHeader;
