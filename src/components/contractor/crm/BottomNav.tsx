import { LayoutDashboard, ClipboardList, Phone, Mail, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'calendar' | 'emails' | 'estimates' | 'reporting' | 'financials' | 'more' | 'payments' | 'accounting' | 'invoices';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems = [
  { id: 'dashboard' as Section, label: 'CRM', icon: LayoutDashboard },
  { id: 'calls' as Section, label: 'Calls', icon: Phone },
  { id: 'emails' as Section, label: 'Emails', icon: Mail },
  { id: 'leads' as Section, label: 'Leads', icon: ClipboardList },
  { id: 'more' as Section, label: 'More', icon: MoreHorizontal },
];

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
      "border-t-2 border-slate-200 dark:border-slate-700",
      "shadow-2xl shadow-slate-900/10",
      "safe-area-inset-bottom"
    )}>
      <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px]',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'drop-shadow-sm')} />
              <span className={cn('text-xs font-medium')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
