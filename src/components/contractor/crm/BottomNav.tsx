import { LayoutDashboard, ClipboardList, Briefcase, Users, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'calendar' | 'emails' | 'estimates' | 'reporting' | 'financials' | 'quickbooks' | 'more';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems = [
  { id: 'dashboard' as Section, label: 'Home', icon: LayoutDashboard },
  { id: 'leads' as Section, label: 'Leads', icon: ClipboardList },
  { id: 'jobs' as Section, label: 'Jobs', icon: Briefcase },
  { id: 'customers' as Section, label: 'People', icon: Users },
  { id: 'more' as Section, label: 'More', icon: MoreHorizontal },
];

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                'active:scale-95 transition-transform',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
              <span className={cn('text-xs font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
