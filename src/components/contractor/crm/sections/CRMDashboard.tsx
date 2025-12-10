import { useLeads } from '@/hooks/useLeads';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Briefcase, Phone, Mail, DollarSign, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'emails' | 'estimates' | 'reporting' | 'accounting' | 'more' | 'calendar';

interface CRMDashboardProps {
  onSectionChange?: (section: Section) => void;
}

export default function CRMDashboard({ onSectionChange }: CRMDashboardProps) {
  const isMobile = useIsMobile();
  const { leads } = useLeads();
  const { customers } = useCustomers();

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
      id: 'emails' as Section, 
      label: 'Emails', 
      icon: Mail, 
      gradient: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-400',
      description: 'Inbox & follow-ups'
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
      id: 'calls' as Section, 
      label: 'Calls', 
      icon: Phone, 
      gradient: 'from-pink-500 to-pink-600',
      borderColor: 'border-pink-400',
      description: 'Call history'
    },
    { 
      id: 'accounting' as Section, 
      label: 'Accounting', 
      icon: DollarSign, 
      gradient: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-400',
      description: 'Payments & expenses'
    },
  ];


  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background pt-safe pt-16 sm:pt-6">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Navigate to your workspace</p>
        </div>

        {/* Main Navigation Tiles */}
        {onSectionChange && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {mainModules.map((tile) => (
              <Card
                key={tile.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 bg-gradient-to-br border-2',
                  tile.gradient, tile.borderColor,
                  'hover:shadow-2xl hover:scale-105 active:scale-95 text-white'
                )}
                onClick={() => onSectionChange(tile.id)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <tile.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-semibold text-center text-white">{tile.label}</span>
                  <p className="text-xs text-white/80 text-center">{tile.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
