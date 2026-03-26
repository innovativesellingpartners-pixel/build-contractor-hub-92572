import { useState, useCallback, useMemo } from 'react';
import { Briefcase, FileText, Users, DollarSign, Phone, Mail, Headset, Calendar, Receipt, Settings2, RotateCcw, UserPlus, BarChart3, Eye, EyeOff, Plus, Link as LinkIcon, Shield, UsersRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContactSupport } from '@/components/ContactSupport';
import { SortableGrid, SortableItem } from '@/components/ui/sortable-grid';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import { cn } from '@/lib/utils';

interface MobileLandingPageProps {
  onNavigateToJobs: () => void;
  onNavigateToEstimates: () => void;
  onNavigateToCustomers: () => void;
  onNavigateToEmails: () => void;
  onNavigateToAccounting: () => void;
  onNavigateToCalls: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToInvoices: () => void;
  onNavigateToLeads?: () => void;
  onNavigateToReporting?: () => void;
  onNavigateToPortal?: () => void;
  onNavigateToCrews?: () => void;
  onNavigateToDocuments?: () => void;
  onNavigateToTeam?: () => void;
}

const mobileModules = [
  { 
    id: 'calendar',
    title: 'Calendar',
    description: 'Schedule & events',
    icon: Calendar,
    gradient: 'from-red-500 via-red-600 to-red-700',
  },
  { 
    id: 'jobs',
    title: 'Jobs',
    description: 'Manage active jobs',
    icon: Briefcase,
    gradient: 'from-purple-500 via-purple-600 to-purple-700',
  },
  { 
    id: 'estimates',
    title: 'Estimates',
    description: 'Create & send quotes',
    icon: FileText,
    gradient: 'from-green-500 via-green-600 to-green-700',
  },
  {
    id: 'emails',
    title: 'Emails',
    description: 'Inbox & follow-ups',
    icon: Mail,
    gradient: 'from-orange-500 via-orange-600 to-orange-700',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    description: 'Manage invoices',
    icon: Receipt,
    gradient: 'from-violet-500 via-violet-600 to-violet-700',
  },
  {
    id: 'calls',
    title: 'Calls',
    description: 'Call history & logs',
    icon: Phone,
    gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
  },
  { 
    id: 'customers',
    title: 'Customers',
    description: 'Contact management',
    icon: Users,
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
  },
  {
    id: 'accounting',
    title: 'Accounting',
    description: 'Payments & expenses',
    icon: DollarSign,
    gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
  },
  {
    id: 'leads',
    title: 'Leads',
    description: 'Track & manage leads',
    icon: UserPlus,
    gradient: 'from-teal-500 via-cyan-500 to-cyan-600',
  },
  {
    id: 'reporting',
    title: 'Reports',
    description: 'Analytics & insights',
    icon: BarChart3,
    gradient: 'from-amber-500 via-yellow-500 to-yellow-600',
  },
  {
    id: 'portal',
    title: 'Customer Portal',
    description: 'Manage customer portals',
    icon: LinkIcon,
    gradient: 'from-cyan-500 via-teal-500 to-teal-600',
  },
  {
    id: 'crews',
    title: 'Crews',
    description: 'Manage crews & members',
    icon: Shield,
    gradient: 'from-rose-500 via-pink-500 to-pink-600',
  },
  {
    id: 'team',
    title: 'Team',
    description: 'Manage your team',
    icon: UsersRound,
    gradient: 'from-indigo-500 via-blue-600 to-cyan-600',
  },
];

const defaultOrder = mobileModules.map(m => m.id);

const HIDDEN_STORAGE_KEY = 'ct1_dashboard_hidden_tiles';

function useHiddenTiles() {
  const [hidden, setHiddenState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(HIDDEN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const setHidden = useCallback((ids: string[]) => {
    setHiddenState(ids);
    localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const toggle = useCallback((id: string) => {
    setHidden(hidden.includes(id) ? hidden.filter(h => h !== id) : [...hidden, id]);
  }, [hidden, setHidden]);

  const resetHidden = useCallback(() => {
    setHiddenState([]);
    localStorage.removeItem(HIDDEN_STORAGE_KEY);
  }, []);

  return { hidden, toggle, resetHidden };
}

export function MobileLandingPage({ 
  onNavigateToJobs, 
  onNavigateToEstimates, 
  onNavigateToCustomers,
  onNavigateToEmails,
  onNavigateToAccounting,
  onNavigateToCalls,
  onNavigateToCalendar,
  onNavigateToInvoices,
  onNavigateToLeads,
  onNavigateToReporting,
  onNavigateToPortal,
  onNavigateToCrews,
  onNavigateToDocuments,
  onNavigateToTeam,
}: MobileLandingPageProps) {
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { order, setOrder, resetToDefault } = useLayoutPreferences('dashboardOrder', defaultOrder);
  const { hidden, toggle: toggleHidden, resetHidden } = useHiddenTiles();
  const moduleIds = useMemo(() => mobileModules.map((module) => module.id), []);

  const normalizedOrder = useMemo(
    () => [
      ...order.filter((id) => moduleIds.includes(id)),
      ...moduleIds.filter((id) => !order.includes(id)),
    ],
    [order, moduleIds]
  );

  const sortedModules = [...mobileModules].sort((a, b) => {
    return normalizedOrder.indexOf(a.id) - normalizedOrder.indexOf(b.id);
  });

  const visibleModules = isEditMode ? sortedModules : sortedModules.filter(m => !hidden.includes(m.id));
  const hiddenModules = mobileModules.filter(m => hidden.includes(m.id));
  
  const handleModuleClick = (id: string) => {
    if (isEditMode) return;
    
    switch (id) {
      case 'jobs': onNavigateToJobs(); break;
      case 'estimates': onNavigateToEstimates(); break;
      case 'customers': onNavigateToCustomers(); break;
      case 'accounting': onNavigateToAccounting(); break;
      case 'calls': onNavigateToCalls(); break;
      case 'emails': onNavigateToEmails(); break;
      case 'calendar': onNavigateToCalendar(); break;
      case 'invoices': onNavigateToInvoices(); break;
      case 'leads': onNavigateToLeads?.(); break;
      case 'reporting': onNavigateToReporting?.(); break;
      case 'portal': onNavigateToPortal?.(); break;
      case 'crews': onNavigateToCrews?.(); break;
      case 'documents': onNavigateToDocuments?.(); break;
      case 'team': onNavigateToTeam?.(); break;
    }
  };

  const handleReorder = (newOrder: string[]) => {
    setOrder(newOrder);
  };

  const handleReset = () => {
    resetToDefault();
    resetHidden();
  };

  return (
    <div className="w-full pb-20 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="p-4 sm:p-6 pt-4 w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MyCT1 Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? 'Drag to reorder · Tap eye to show/hide' : 'Navigate to your workspace'}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 w-9 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                >
                  Done
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="gap-1.5"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Grid of Module Cards */}
        <SortableGrid
          items={normalizedOrder}
          onReorder={handleReorder}
          disabled={!isEditMode}
          strategy="grid"
          className="grid grid-cols-2 gap-3 sm:gap-4 w-full"
        >
          {visibleModules.map((module) => (
            <SortableItem
              key={module.id}
              id={module.id}
              disabled={!isEditMode}
              showHandle={isEditMode}
            >
              <Card 
                onClick={() => handleModuleClick(module.id)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center gap-2 sm:gap-3',
                  'p-3 sm:p-4 cursor-pointer',
                  'hover:scale-105 active:scale-95',
                  'transition-all duration-200',
                  `bg-gradient-to-br ${module.gradient}`,
                  'text-white border-0 shadow-xl hover:shadow-2xl',
                  'relative overflow-hidden',
                  isEditMode && 'ring-2 ring-white/30 ring-offset-2 ring-offset-background',
                  isEditMode && hidden.includes(module.id) && 'opacity-40'
                )}
              >
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-white rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10" />
                  <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8" />
                </div>

                {/* Visibility toggle in edit mode */}
                {isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHidden(module.id); }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/30 backdrop-blur flex items-center justify-center hover:bg-black/50 transition-colors"
                  >
                    {hidden.includes(module.id) ? (
                      <EyeOff className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>
                )}
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
                  <module.icon className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-lg" strokeWidth={2} />
                  <div className="text-center">
                    <h3 className="font-bold text-sm sm:text-base leading-tight mb-0.5 sm:mb-1">
                      {module.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs opacity-90 font-medium">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Card>
            </SortableItem>
          ))}
        </SortableGrid>

        {/* Hidden modules panel */}
        {isEditMode && hiddenModules.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Hidden Modules</h3>
            <div className="flex flex-wrap gap-2">
              {hiddenModules.map((module) => (
                <Button
                  key={module.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleHidden(module.id)}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <module.icon className="h-3.5 w-3.5" />
                  {module.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support Button */}
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setContactSupportOpen(true)}
            className="gap-2 w-full"
          >
            <Headset className="h-5 w-5" />
            Contact Support
          </Button>
        </div>
      </div>

      {/* Contact Support Dialog */}
      <ContactSupport 
        open={contactSupportOpen} 
        onOpenChange={setContactSupportOpen} 
      />
    </div>
  );
}
