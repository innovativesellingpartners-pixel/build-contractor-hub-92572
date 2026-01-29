import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileOptimizedWrapperProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
  onBackClick?: () => void;
}

export function MobileOptimizedWrapper({
  children,
  title,
  actions,
  className,
  onBackClick,
}: MobileOptimizedWrapperProps) {
  return (
    <div className={cn(
      'w-full max-w-full overflow-x-hidden bg-background pb-8',
      // Force all children to respect container bounds
      '[&_*]:max-w-full',
      className
    )}>
      {title && (
        <Card className="mb-4 overflow-hidden max-w-full">
          <CardHeader className="pb-3 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 overflow-hidden">
              <CardTitle className="text-xl sm:text-2xl truncate max-w-full">{title}</CardTitle>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {actions}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
      <div className="space-y-4 overflow-hidden">{children}</div>
    </div>
  );
}

export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn(
      'hover:shadow-lg transition-shadow w-full max-w-full overflow-hidden',
      className
    )}>
      <CardContent className="p-4 sm:p-6 overflow-hidden max-w-full">{children}</CardContent>
    </Card>
  );
}

export function MobileGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full overflow-hidden',
      className
    )}>
      {children}
    </div>
  );
}

export function MobileStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-3 w-full max-w-full overflow-hidden', className)}>{children}</div>;
}

// Horizontal row card for list views (like emails/calls)
export function MobileRowCard({ children, className, onClick }: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={cn(
        'hover:shadow-md transition-shadow w-full max-w-full overflow-hidden cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 overflow-hidden max-w-full">{children}</CardContent>
    </Card>
  );
}
