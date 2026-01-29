import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CrmNavHeaderProps {
  /** Show Back button */
  back?: boolean;
  /** Show Dashboard button */
  dashboard?: boolean;
  /** Custom back handler - defaults to window.history.back() */
  onBack?: () => void;
  /** Custom dashboard handler */
  onDashboard?: () => void;
  /** Section label for context (e.g., "Leads", "Jobs") */
  sectionLabel?: string;
  /** Additional className for the container */
  className?: string;
  /** Children to render on the right side of the header */
  children?: React.ReactNode;
}

/**
 * Consistent navigation header for all CRM pages.
 * Provides Back and Dashboard buttons with reliable fallback behavior.
 * 
 * Usage:
 * <CrmNavHeader 
 *   back 
 *   dashboard 
 *   onBack={() => handleBack()} 
 *   onDashboard={() => onSectionChange?.('dashboard')} 
 * />
 */
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
      // Fallback: use browser history
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

  // Don't render if nothing to show
  if (!back && !dashboard && !children) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center justify-between gap-2 py-2 px-4 sm:px-0',
      className
    )}>
      <div className="flex items-center gap-2">
        {back && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        )}
        
        {dashboard && onDashboard && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDashboard}
            className="gap-1.5 h-8 px-2 sm:px-3"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        )}
        
        {sectionLabel && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            / {sectionLabel}
          </span>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage CRM navigation context.
 * Provides fallback routes for deep links.
 */
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
