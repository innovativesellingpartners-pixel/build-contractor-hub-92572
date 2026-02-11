import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

// Elegant light background wrapper with safe area for mobile browsers
export function BlueBackground({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('h-full flex flex-col bg-gradient-to-b from-muted/50 to-background', className)}>
      {children}
    </div>
  );
}

// Section header bar - elegant grey with subtle primary accent
export function SectionHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-muted text-foreground px-4 py-2 font-semibold text-xs uppercase tracking-wider border-l-4 border-primary', className)}>
      {children}
    </div>
  );
}

// White info card container
export function InfoCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card border border-border shadow-sm', className)}>
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
        'flex justify-between items-center px-4 py-3 border-b border-border/50 last:border-b-0',
        isClickable && 'cursor-pointer hover:bg-muted/50 active:bg-muted',
        className
      )}
      onClick={onClick}
    >
      <span className="text-muted-foreground font-medium text-sm">{label}</span>
      <span className={cn('text-foreground text-sm text-right max-w-[60%] truncate', valueClassName)}>
        {value || '—'}
      </span>
    </div>
  );
}

// Status/Action button - elegant styling
interface ActionButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'secondary' | 'muted' | 'destructive';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function ActionButton({ children, variant = 'primary', onClick, disabled, className, fullWidth }: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    muted: 'bg-muted hover:bg-muted/80 text-muted-foreground',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wide transition-colors shadow-sm whitespace-nowrap flex-shrink-0',
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

// Header with back button, title, logo and optional dashboard shortcut
interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onDashboard?: () => void;
  rightContent?: ReactNode;
}

export function DetailHeader({ title, subtitle, onBack, onDashboard, rightContent }: DetailHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-foreground text-background pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-[max(0.5rem,env(safe-area-inset-top))]">
      {/* Compact header with logo, nav, and actions in one row */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        {/* Left: Logo + Nav buttons */}
        <div className="flex items-center gap-2 min-w-0">
          <img 
            src={ct1Logo} 
            alt="CT1" 
            className="h-9 w-9 rounded-full flex-shrink-0"
          />
          {onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center justify-center gap-1 h-8 px-2.5 bg-white/15 hover:bg-white/25 rounded-md transition-colors text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          {onDashboard && (
            <button
              type="button"
              onClick={onDashboard}
              className="flex items-center justify-center gap-1 h-8 px-2.5 bg-primary hover:bg-primary/90 rounded-md transition-colors text-xs font-medium text-primary-foreground"
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
        </div>
        
        {/* Right: Action buttons */}
        {rightContent && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>
      
      {/* Title bar - compact */}
      <div className="px-3 pb-2 min-w-0">
        <h1 className="font-bold text-base truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-background/70 text-xs truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

// Status badge - elegant styling
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
        return 'bg-secondary text-secondary-foreground';
      case 'in_progress':
      case 'contacted':
      case 'sent':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
      case 'won':
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'on_hold':
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
      case 'lost':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded text-xs font-semibold uppercase',
      getStatusColor(status),
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// Action buttons row - contained with proper overflow handling
export function ActionButtonRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-2 px-3 py-2 bg-card border-b border-border overflow-x-auto scrollbar-hide', className)}>
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
  const activeLabel = tabs.find((t) => t.id === activeTab)?.label ?? 'Select';

  return (
    <>
      {/* Mobile: labeled dropdown */}
      <div className="sm:hidden bg-card border-b border-border px-3 py-2 flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Section</span>
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: icon + label tabs */}
      <div className="hidden sm:flex overflow-x-auto bg-card border-b border-border px-1 gap-0.5 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 flex-shrink-0',
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// Money display - elegant primary color
interface MoneyDisplayProps {
  amount: number | null | undefined;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MoneyDisplay({ amount, label, size = 'md', className }: MoneyDisplayProps) {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('text-center', className)}>
      <p className={cn('font-bold text-primary tabular-nums', sizeClasses[size])}>
        ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {label && <p className="text-xs text-muted-foreground mt-0.5">{label}</p>}
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
      className="flex justify-between items-center px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-muted/50 active:bg-muted"
      onClick={onNavigate}
    >
      <span className="text-muted-foreground font-medium text-sm">Address</span>
      <span className="text-primary text-sm text-right max-w-[60%] underline decoration-dotted">
        {address}
      </span>
    </div>
  );
}
