import { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Phone, 
  Mail, 
  Menu,
  X,
  FileText,
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  BarChart2,
  LayoutTemplate,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'calendar' | 'emails' | 'estimates' | 'reporting' | 'financials' | 'more' | 'payments' | 'accounting' | 'invoices' | 'templates';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const bottomNavItems = [
  { id: 'dashboard' as Section, label: 'CRM', icon: LayoutDashboard },
  { id: 'calls' as Section, label: 'Calls', icon: Phone },
  { id: 'emails' as Section, label: 'Emails', icon: Mail },
  { id: 'leads' as Section, label: 'Leads', icon: ClipboardList },
];

// All navigation items for the slide-out menu
const allNavItems = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as Section, label: 'Leads', icon: ClipboardList },
  { id: 'jobs' as Section, label: 'Jobs', icon: Briefcase },
  { id: 'estimates' as Section, label: 'Estimates', icon: FileText },
  { id: 'emails' as Section, label: 'Emails', icon: Mail },
  { id: 'calls' as Section, label: 'Calls', icon: Phone },
  { id: 'calendar' as Section, label: 'Calendar', icon: Calendar },
  { id: 'invoices' as Section, label: 'Invoices', icon: Receipt },
  { id: 'accounting' as Section, label: 'Accounting', icon: DollarSign },
  { id: 'templates' as Section, label: 'Templates', icon: LayoutTemplate },
  { id: 'payments' as Section, label: 'Payments', icon: CreditCard },
  { id: 'reporting' as Section, label: 'Reporting', icon: BarChart2 },
  { id: 'customers' as Section, label: 'Customers', icon: Users },
];

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (section: Section) => {
    onSectionChange(section);
    setMenuOpen(false);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-[100]",
      "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
      "border-t-2 border-slate-200 dark:border-slate-700",
      "shadow-2xl shadow-slate-900/10",
      "safe-area-inset-bottom"
    )}>
      <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
        {bottomNavItems.map((item) => {
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
        
        {/* Menu Button with Sheet */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px]',
                menuOpen
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'
              )}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">CT1 CRM Navigation</SheetTitle>
            <SheetDescription className="sr-only">Navigate to different sections of the CRM</SheetDescription>
            <div className="flex flex-col h-full bg-card">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
                  <span className="font-semibold">CT1 CRM</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-1 rounded-md hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
                  {allNavItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavClick(item.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                            'hover:bg-accent',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-base">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
