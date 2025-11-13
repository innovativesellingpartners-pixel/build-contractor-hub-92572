import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart2, DollarSign, Phone, Calendar, Mail, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'estimates' | 'reporting' | 'financials' | 'calls' | 'calendar' | 'emails' | 'quickbooks';

interface MoreSectionProps {
  onSectionChange: (section: Section) => void;
}

const secondaryFeatures = [
  { 
    id: 'estimates' as Section, 
    label: 'Estimates', 
    icon: FileText, 
    gradient: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-400',
    description: 'Create quotes'
  },
  { 
    id: 'reporting' as Section, 
    label: 'Reporting', 
    icon: BarChart2, 
    gradient: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-400',
    description: 'View insights'
  },
  { 
    id: 'financials' as Section, 
    label: 'Financials', 
    icon: DollarSign, 
    gradient: 'from-green-500 to-green-600',
    borderColor: 'border-green-400',
    description: 'Track money'
  },
  { 
    id: 'quickbooks' as Section, 
    label: 'QuickBooks', 
    icon: LinkIcon, 
    gradient: 'from-indigo-500 to-indigo-600',
    borderColor: 'border-indigo-400',
    description: 'Sync data'
  },
  { 
    id: 'calls' as Section, 
    label: 'Calls', 
    icon: Phone, 
    gradient: 'from-orange-500 to-orange-600',
    borderColor: 'border-orange-400',
    description: 'Call history'
  },
  { 
    id: 'calendar' as Section, 
    label: 'Calendar', 
    icon: Calendar, 
    gradient: 'from-red-500 to-red-600',
    borderColor: 'border-red-400',
    description: 'Schedule'
  },
  { 
    id: 'emails' as Section, 
    label: 'Emails', 
    icon: Mail, 
    gradient: 'from-cyan-500 to-cyan-600',
    borderColor: 'border-cyan-400',
    description: 'Messages'
  },
];

export default function MoreSection({ onSectionChange }: MoreSectionProps) {
  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">More Features</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Access additional tools and features</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 w-full">
          {secondaryFeatures.map((feature) => (
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Use Estimates to create and send quotes to customers</p>
            <p>• Reporting provides insights into your business performance</p>
            <p>• Financials helps track income, expenses, and profitability</p>
            <p>• QuickBooks integration syncs your financial data</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
