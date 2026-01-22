import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Users, BarChart2, CreditCard, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'estimates' | 'reporting' | 'financials' | 'calls' | 'calendar' | 'emails' | 'payments' | 'accounting' | 'help';

interface MoreSectionProps {
  onSectionChange: (section: Section) => void;
}

const moreFeatures = [
  { 
    id: 'leads' as Section, 
    label: 'Leads', 
    icon: ClipboardList, 
    gradient: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-400',
    description: 'New opportunities'
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
    id: 'reporting' as Section, 
    label: 'Reporting', 
    icon: BarChart2, 
    gradient: 'from-violet-500 to-violet-600',
    borderColor: 'border-violet-400',
    description: 'View insights'
  },
  { 
    id: 'payments' as Section, 
    label: 'Payments', 
    icon: CreditCard, 
    gradient: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-400',
    description: 'Stripe & Banking'
  },
  { 
    id: 'help' as Section, 
    label: 'Help Center', 
    icon: HelpCircle, 
    gradient: 'from-primary to-primary/80',
    borderColor: 'border-primary/40',
    description: 'Get support'
  },
];

export default function MoreSection({ onSectionChange }: MoreSectionProps) {
  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">More</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Additional tools and features</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 w-full">
          {moreFeatures.map((feature) => (
            <Card
              key={feature.id}
              className={cn(
                'cursor-pointer transition-all duration-200',
                'bg-gradient-to-br',
                feature.gradient,
                'border-2',
                feature.borderColor,
                'hover:shadow-2xl hover:scale-105',
                'active:scale-95',
                'text-white'
              )}
              onClick={() => onSectionChange(feature.id)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <span className="font-semibold text-center text-white">{feature.label}</span>
                <p className="text-xs text-white/80 text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
