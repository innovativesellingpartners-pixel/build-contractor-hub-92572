import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart2, DollarSign, Phone, Calendar, Mail, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'estimates' | 'reporting' | 'financials' | 'calls' | 'calendar' | 'emails' | 'quickbooks';

interface MoreSectionProps {
  onSectionChange: (section: Section) => void;
}

const secondaryFeatures = [
  { id: 'estimates' as Section, label: 'Estimates', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'reporting' as Section, label: 'Reporting', icon: BarChart2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'financials' as Section, label: 'Financials', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'quickbooks' as Section, label: 'QuickBooks', icon: LinkIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'calls' as Section, label: 'Calls', icon: Phone, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'calendar' as Section, label: 'Calendar', icon: Calendar, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'emails' as Section, label: 'Emails', icon: Mail, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
];

export default function MoreSection({ onSectionChange }: MoreSectionProps) {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">More Features</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Access additional tools and features</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          {secondaryFeatures.map((feature) => (
            <Card
              key={feature.id}
              className="cursor-pointer hover:shadow-lg transition-all active:scale-95"
              onClick={() => onSectionChange(feature.id)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', feature.bgColor)}>
                  <feature.icon className={cn('h-7 w-7', feature.color)} />
                </div>
                <span className="font-semibold text-center text-sm sm:text-base">{feature.label}</span>
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
