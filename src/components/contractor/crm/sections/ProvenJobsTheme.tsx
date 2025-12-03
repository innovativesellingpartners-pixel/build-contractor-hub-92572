import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Light blue background wrapper
export function BlueBackground({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-h-full bg-gradient-to-b from-sky-100 to-sky-50', className)}>
      {children}
    </div>
  );
}

// Blue section header bar
export function SectionHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-sky-500 text-white px-4 py-2.5 font-semibold text-sm uppercase tracking-wide', className)}>
      {children}
    </div>
  );
}

// White info card container
export function InfoCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-sky-100', className)}>
      {children}
    </div>
  );
}

// Individual info row with label/value
interface InfoRowProps {
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
  isClickable?: boolean;
  onClick?: () => void;
}

export function InfoRow({ label, value, className, valueClassName, isClickable, onClick }: InfoRowProps) {
  return (
    <div 
      className={cn(
        'flex justify-between items-center px-4 py-3 border-b border-sky-50 last:border-b-0',
        isClickable && 'cursor-pointer hover:bg-sky-50/50 active:bg-sky-100/50',
        className
      )}
      onClick={onClick}
    >
      <span className="text-sky-700 font-medium text-sm">{label}</span>
      <span className={cn('text-slate-800 text-sm text-right max-w-[60%] truncate', valueClassName)}>
        {value || '—'}
      </span>
    </div>
  );
}

// Status/Action button
interface ActionButtonProps {
  children: ReactNode;
  variant?: 'orange' | 'green' | 'blue' | 'gray' | 'red';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function ActionButton({ children, variant = 'orange', onClick, disabled, className, fullWidth }: ActionButtonProps) {
  const variantClasses = {
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    green: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    blue: 'bg-sky-500 hover:bg-sky-600 text-white',
    gray: 'bg-slate-400 hover:bg-slate-500 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors shadow-sm',
        variantClasses[variant],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

// Header with back button and title
interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function DetailHeader({ title, subtitle, onBack, rightContent }: DetailHeaderProps) {
  return (
    <div className="bg-sky-500 text-white px-4 py-4 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="p-1 hover:bg-sky-600 rounded">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-lg truncate">{title}</h1>
        {subtitle && <p className="text-sky-100 text-sm truncate">{subtitle}</p>}
      </div>
      {rightContent}
    </div>
  );
}

// Status badge
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'scheduled':
      case 'new':
      case 'draft':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'in_progress':
      case 'contacted':
      case 'sent':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed':
      case 'won':
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'on_hold':
      case 'qualified':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cancelled':
      case 'lost':
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={cn(
      'px-3 py-1 rounded-full text-xs font-semibold uppercase border',
      getStatusColor(status),
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// Action buttons row
export function ActionButtonRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-2 px-4 py-3 bg-white border-b border-sky-100', className)}>
      {children}
    </div>
  );
}

// Tab navigation for detail views
interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex overflow-x-auto bg-white border-b border-sky-100 px-2 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
            activeTab === tab.id
              ? 'text-sky-600 border-sky-500'
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Money display
interface MoneyDisplayProps {
  amount: number | null | undefined;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MoneyDisplay({ amount, label, size = 'md', className }: MoneyDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('text-center', className)}>
      <p className={cn('font-bold text-sky-600', sizeClasses[size])}>
        ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {label && <p className="text-xs text-slate-500 mt-0.5">{label}</p>}
    </div>
  );
}

// Clickable address row
interface AddressRowProps {
  address: string;
  onNavigate?: () => void;
}

export function AddressRow({ address, onNavigate }: AddressRowProps) {
  return (
    <div 
      className="flex justify-between items-center px-4 py-3 border-b border-sky-50 cursor-pointer hover:bg-sky-50/50 active:bg-sky-100/50"
      onClick={onNavigate}
    >
      <span className="text-sky-700 font-medium text-sm">Address</span>
      <span className="text-sky-600 text-sm text-right max-w-[60%] underline decoration-dotted">
        {address}
      </span>
    </div>
  );
}
