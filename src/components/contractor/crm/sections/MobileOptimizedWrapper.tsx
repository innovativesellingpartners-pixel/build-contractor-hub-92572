import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileOptimizedWrapperProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
}

export function MobileOptimizedWrapper({
  children,
  title,
  actions,
  className,
}: MobileOptimizedWrapperProps) {
  return (
    <div className={cn('w-full max-w-full overflow-x-hidden', className)}>
      {title && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </CardHeader>
        </Card>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow w-full max-w-full', className)}>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}

export function MobileGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
}

export function MobileStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}
