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
      'w-full max-w-full overflow-x-hidden bg-background pb-8 pl-2 sm:pl-4',
      '[&_*]:max-w-full',
      className
    )}>
      {title && (
        <div className="mb-6 overflow-hidden max-w-full px-4 sm:px-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-hidden">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate max-w-full">{title}</h1>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              {actions}
            </div>
          </div>
        </div>
      )}
      <div className="space-y-5 overflow-x-hidden">{children}</div>
    </div>
  );
}

export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn(
      'w-full max-w-full overflow-hidden card-interactive',
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

export function MobileRowCard({ children, className, onClick }: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={cn(
        'w-full max-w-full overflow-hidden cursor-pointer card-interactive',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 overflow-hidden max-w-full">{children}</CardContent>
    </Card>
  );
}
