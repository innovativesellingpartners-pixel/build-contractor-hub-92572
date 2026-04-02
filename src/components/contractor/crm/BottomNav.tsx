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
  Receipt,
  Building2,
  Contact,
  HelpCircle,
  Settings2,
  Check,
  RotateCcw,
  GripVertical,
  Link as LinkIcon,
  Shield,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SortableGrid, SortableListItem } from '@/components/ui/sortable-grid';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import ct1Logo from '@/assets/ct1-round-logo-new.png';
import { CRMSection } from '@/config/navigation';

interface BottomNavProps {
  activeSection: CRMSection;
  onSectionChange: (section: CRMSection) => void;
  hidden?: boolean;
}

const defaultBottomNavItems: CRMSection[] = ['dashboard', 'calls', 'emails', 'leads'];

// All navigation items for the slide-out menu
const allNavItems = [
  { id: 'dashboard' as CRMSection, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as CRMSection, label: 'Leads', icon: ClipboardList },
  { id: 'jobs' as CRMSection, label: 'Jobs', icon: Briefcase },
  { id: 'estimates' as CRMSection, label: 'Estimates', icon: FileText },
  { id: 'customers' as CRMSection, label: 'Customers', icon: Users },
  { id: 'emails' as CRMSection, label: 'Emails', icon: Mail },
  { id: 'calls' as CRMSection, label: 'Calls', icon: Phone },
  { id: 'calendar' as CRMSection, label: 'Calendar', icon: Calendar },
  { id: 'invoices' as CRMSection, label: 'Invoices', icon: Receipt },
  { id: 'accounting' as CRMSection, label: 'Accounting', icon: DollarSign },
  { id: 'templates' as CRMSection, label: 'Estimate Templates', icon: LayoutTemplate },
  { id: 'reporting' as CRMSection, label: 'Reporting', icon: BarChart2 },
  { id: 'gc' as CRMSection, label: 'General Contractors', icon: Building2 },
  { id: 'contacts' as CRMSection, label: 'Contacts', icon: Contact },
  { id: 'portal' as CRMSection, label: 'Customer Portal', icon: LinkIcon },
  { id: 'crews' as CRMSection, label: 'Crews', icon: Shield },
  { id: 'documents' as CRMSection, label: 'Documents', icon: FolderOpen },
  { id: 'network' as CRMSection, label: 'Contractor Network', icon: Users },
  { id: 'help' as CRMSection, label: 'Help Center', icon: HelpCircle },
];

export function BottomNav({ activeSection, onSectionChange, hidden = false }: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  const { order: bottomNavOrder, setOrder: setBottomNavOrder, resetToDefault: resetBottomNav } = 
    useLayoutPreferences('bottomNavOrder', defaultBottomNavItems);
  
  const { order: menuOrder, setOrder: setMenuOrder, resetToDefault: resetMenuOrder } = 
    useLayoutPreferences('menuOrder', allNavItems.map(i => i.id));

  // Get the 4 items to show in bottom nav
  const visibleNavItems = bottomNavOrder.slice(0, 4).map(id => 
    allNavItems.find(item => item.id === id)
  ).filter(Boolean) as typeof allNavItems;

  // Sort menu items by user preference
  const sortedMenuItems = [...allNavItems].sort((a, b) => {
    return menuOrder.indexOf(a.id) - menuOrder.indexOf(b.id);
  });

  const handleNavClick = (e: React.MouseEvent, section: CRMSection) => {
    e.stopPropagation();
    onSectionChange(section);
    setMenuOpen(false);
  };

  const handleCustomizeToggle = () => {
    setIsCustomizing(!isCustomizing);
  };

  const handleResetAll = () => {
    resetBottomNav();
    resetMenuOrder();
  };

  const handleMenuReorder = (newOrder: string[]) => {
    setMenuOrder(newOrder as CRMSection[]);
    // Update bottom nav to be first 4 items of menu order
    setBottomNavOrder(newOrder.slice(0, 4) as CRMSection[]);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-[9999]",
      "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
      "border-t-2 border-slate-200 dark:border-slate-700",
      "shadow-2xl shadow-slate-900/10",
      "safe-area-inset-bottom",
      "pointer-events-auto",
      "transition-transform duration-300 ease-in-out",
      hidden ? "translate-y-full" : "translate-y-0"
    )}>
      <div className="flex items-center justify-around h-12 max-w-screen-sm mx-auto px-1">
        {visibleNavItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onSectionChange(item.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[56px]',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('h-4 w-4', isActive && 'drop-shadow-sm')} />
              <span className="text-[10px] font-medium leading-tight">
                {item.label === 'Dashboard' ? 'CRM' : item.label}
              </span>
            </button>
          );
        })}
        
        {/* Menu Button with Sheet */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[56px]',
                menuOpen
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'
              )}
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-tight">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col h-full max-h-screen" hideDefaultClose>
            <SheetTitle className="sr-only">CT1 CRM Navigation</SheetTitle>
            <SheetDescription className="sr-only">Navigate to different sections of the CRM</SheetDescription>
            {/* Header - fixed at top */}
            <div className="flex items-center justify-between p-4 border-b bg-card flex-shrink-0">
              <div className="flex items-center gap-2">
                <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
                <span className="font-semibold">CT1 CRM</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1 rounded-md hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Customize Mode Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b flex-shrink-0">
              {isCustomizing ? (
                <>
                  <span className="text-sm text-muted-foreground">Drag to reorder (top 4 = nav bar)</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetAll}
                      className="h-8 px-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCustomizeToggle}
                      className="h-8"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">Quick access</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCustomizeToggle}
                    className="h-8 gap-1"
                  >
                    <Settings2 className="h-4 w-4" />
                    Customize
                  </Button>
                </>
              )}
            </div>
            
            {/* Navigation Items - scrollable */}
            <nav className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8 bg-card">
              {isCustomizing ? (
                <SortableGrid
                  items={menuOrder}
                  onReorder={handleMenuReorder}
                  strategy="vertical"
                  className="space-y-2"
                >
                  {sortedMenuItems.map((item, index) => {
                    const isInBottomNav = index < 4;
                    return (
                      <SortableListItem key={item.id} id={item.id}>
                        <div
                          className={cn(
                            'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                            'bg-muted/50 hover:bg-muted',
                            isInBottomNav && 'ring-2 ring-primary/30 bg-primary/5'
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <item.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          <span className="text-base flex-1">{item.label}</span>
                          {isInBottomNav && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Nav {index + 1}
                            </span>
                          )}
                        </div>
                      </SortableListItem>
                    );
                  })}
                </SortableGrid>
              ) : (
                <ul className="space-y-2">
                  {sortedMenuItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={(e) => handleNavClick(e, item.id)}
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
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
