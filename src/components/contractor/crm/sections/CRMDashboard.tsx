import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Briefcase, Phone, Mail, DollarSign, Calendar, Headset, Receipt, Users, Settings2, RotateCcw, UserPlus, BarChart3, Eye, EyeOff, Plus, Link as LinkIcon, Shield, UsersRound } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { ContactSupport } from '@/components/ContactSupport';
import { SortableGrid, SortableItem } from '@/components/ui/sortable-grid';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import JobsFinancialOverview from './JobsFinancialOverview';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'emails' | 'estimates' | 'reporting' | 'accounting' | 'more' | 'calendar' | 'invoices' | 'portal' | 'crews' | 'documents' | 'team';

interface CRMDashboardProps {
  onSectionChange?: (section: Section) => void;
}

const mainModules = [
  { 
    id: 'calendar' as Section, 
    label: 'Calendar', 
    icon: Calendar, 
    gradient: 'from-red-500 to-red-600',
    borderColor: 'border-red-400',
    description: 'Schedule & events'
  },
  { 
    id: 'jobs' as Section, 
    label: 'Jobs', 
    icon: Briefcase, 
    gradient: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-400',
    description: 'Manage projects'
  },
  { 
    id: 'estimates' as Section, 
    label: 'Estimates', 
    icon: FileText, 
    gradient: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-400',
    description: 'View & create quotes'
  },
  { 
    id: 'emails' as Section, 
    label: 'Emails', 
    icon: Mail, 
    gradient: 'from-orange-500 to-orange-600',
    borderColor: 'border-orange-400',
    description: 'Inbox & follow-ups'
  },
  { 
    id: 'invoices' as Section, 
    label: 'Invoices', 
    icon: Receipt, 
    gradient: 'from-indigo-500 to-indigo-600',
    borderColor: 'border-indigo-400',
    description: 'Manage invoices'
  },
  { 
    id: 'calls' as Section, 
    label: 'Calls', 
    icon: Phone, 
    gradient: 'from-pink-500 to-pink-600',
    borderColor: 'border-pink-400',
    description: 'Call history'
  },
  { 
    id: 'customers' as Section, 
    label: 'Customers', 
    icon: Users, 
    gradient: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-400',
    description: 'Contact management'
  },
  { 
    id: 'accounting' as Section, 
    label: 'Accounting', 
    icon: DollarSign, 
    gradient: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-400',
    description: 'Payments & expenses'
  },
  { 
    id: 'leads' as Section, 
    label: 'Leads', 
    icon: UserPlus, 
    gradient: 'from-teal-500 to-cyan-600',
    borderColor: 'border-teal-400',
    description: 'Track & manage leads'
  },
  { 
    id: 'reporting' as Section, 
    label: 'Reports', 
    icon: BarChart3, 
    gradient: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-400',
    description: 'Analytics & insights'
  },
  { 
    id: 'portal' as Section, 
    label: 'Customer Portal', 
    icon: LinkIcon, 
    gradient: 'from-cyan-500 to-teal-600',
    borderColor: 'border-cyan-400',
    description: 'Manage customer portals'
  },
  { 
    id: 'crews' as Section, 
    label: 'Crews', 
    icon: Shield, 
    gradient: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-400',
    description: 'Manage crews & members'
  },
];

const defaultOrder = mainModules.map(m => m.id);

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

export default function CRMDashboard({ onSectionChange }: CRMDashboardProps) {
  const isMobile = useIsMobile();
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { order, setOrder, resetToDefault } = useLayoutPreferences('dashboardOrder', defaultOrder);
  const { hidden, toggle: toggleHidden, resetHidden } = useHiddenTiles();

  // Sort modules by user preference, filter hidden when not editing
  const sortedModules = [...mainModules].sort((a, b) => {
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  const visibleModules = isEditMode ? sortedModules : sortedModules.filter(m => !hidden.includes(m.id));
  const hiddenModules = mainModules.filter(m => hidden.includes(m.id));

  const handleReorder = (newOrder: string[]) => {
    setOrder(newOrder as Section[]);
  };

  const handleReset = () => {
    resetToDefault();
    resetHidden();
  };

  return (
    <div className="w-full pb-20 bg-background pt-safe pt-16 sm:pt-6">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditMode ? 'Drag to reorder · Click eye to show/hide' : 'Navigate to your workspace'}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
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
                <span className="hidden sm:inline">Customize</span>
              </Button>
            )}
          </div>
        </div>

        {/* Financial Overview */}
        <JobsFinancialOverview onNavigateToJobs={onSectionChange ? () => onSectionChange('jobs') : undefined} />

        {/* Main Navigation Tiles */}
        {onSectionChange && (
          <SortableGrid
            items={order}
            onReorder={handleReorder}
            disabled={!isEditMode}
            strategy="grid"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full"
          >
            {visibleModules.map((tile) => (
              <SortableItem 
                key={tile.id} 
                id={tile.id}
                disabled={!isEditMode}
                showHandle={isEditMode}
              >
                <Card
                  className={cn(
                    'cursor-pointer transition-all duration-200 relative overflow-hidden',
                    'bg-card border border-border/40',
                    'hover:border-border hover:shadow-md active:scale-[0.97]',
                    isEditMode && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
                    isEditMode && hidden.includes(tile.id) && 'opacity-40'
                  )}
                  onClick={() => !isEditMode && onSectionChange(tile.id)}
                >
                  {/* Gradient accent strip */}
                  <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', tile.gradient, 'opacity-70')} />
                  
                  {isEditMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHidden(tile.id); }}
                      className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      {hidden.includes(tile.id) ? (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  )}
                  <CardContent className="p-5 pt-6 flex flex-col items-center justify-center gap-3 min-h-[130px]">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', tile.gradient)}>
                      <tile.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm text-center text-foreground">{tile.label}</span>
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">{tile.description}</p>
                  </CardContent>
                </Card>
              </SortableItem>
            ))}
          </SortableGrid>
        )}

        {/* Hidden modules panel - show in edit mode when there are hidden tiles */}
        {isEditMode && hiddenModules.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Hidden Modules</h3>
            <div className="flex flex-wrap gap-2">
              {hiddenModules.map((tile) => (
                <Button
                  key={tile.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleHidden(tile.id)}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <tile.icon className="h-3.5 w-3.5" />
                  {tile.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support Button */}
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setContactSupportOpen(true)}
            className="gap-2"
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
