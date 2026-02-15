import { ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface HorizontalRowCardProps {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function HorizontalRowCard({ children, onClick, className }: HorizontalRowCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/60 bg-card',
        'hover:shadow-md hover:border-primary/20 transition-all duration-200',
        'overflow-hidden max-w-full w-full',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface RowAvatarProps {
  initials: string;
  icon?: ReactNode;
  className?: string;
}

export function RowAvatar({ initials, icon, className }: RowAvatarProps) {
  return (
    <Avatar className={cn('h-10 w-10 flex-shrink-0', className)}>
      <AvatarFallback className="bg-primary/8 text-primary font-semibold text-xs rounded-xl">
        {icon || initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface RowContentProps {
  children: ReactNode;
  className?: string;
}

export function RowContent({ children, className }: RowContentProps) {
  return (
    <div className={cn('flex-1 min-w-0 overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface RowTitleLineProps {
  children: ReactNode;
  className?: string;
}

export function RowTitleLine({ children, className }: RowTitleLineProps) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0 max-w-full overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface RowMetaLineProps {
  children: ReactNode;
  className?: string;
}

export function RowMetaLine({ children, className }: RowMetaLineProps) {
  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground mt-0.5 max-w-full overflow-hidden flex-wrap', className)}>
      {children}
    </div>
  );
}

interface RowBadgeGroupProps {
  children: ReactNode;
  className?: string;
}

export function RowBadgeGroup({ children, className }: RowBadgeGroupProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap mt-1', className)}>
      {children}
    </div>
  );
}

interface RowAmountProps {
  amount: number | null | undefined;
  label?: string;
  badge?: ReactNode;
  className?: string;
}

export function RowAmount({ amount, label, badge, className }: RowAmountProps) {
  return (
    <div className={cn('text-right flex-shrink-0', className)}>
      <p className="text-sm font-bold text-primary whitespace-nowrap tabular-nums tracking-tight">
        ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
      </p>
      {label && <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>}
      {badge && <div className="mt-1">{badge}</div>}
    </div>
  );
}

interface RowActionsProps {
  children: ReactNode;
  className?: string;
}

export function RowActions({ children, className }: RowActionsProps) {
  return (
    <div className={cn('hidden sm:flex items-center gap-1 flex-shrink-0', className)}>
      {children}
    </div>
  );
}
