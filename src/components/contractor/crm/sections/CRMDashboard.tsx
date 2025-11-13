import { useLeads } from '@/hooks/useLeads';
import { useCustomers } from '@/hooks/useCustomers';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Target, Briefcase, Users, DollarSign, TrendingUp, Plus, FileText, Phone, Calendar } from 'lucide-react';
import { ConversionAnalytics } from '@/components/reporting/ConversionAnalytics';
import { WinLossAnalysis } from '@/components/reporting/WinLossAnalysis';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type Section = 'leads' | 'estimates' | 'calendar' | 'jobs';

interface CRMDashboardProps {
  onSectionChange?: (section: Section) => void;
}

export default function CRMDashboard({ onSectionChange }: CRMDashboardProps) {
  const isMobile = useIsMobile();
  const { leads } = useLeads();
  const { customers } = useCustomers();
  const { opportunities } = useOpportunities();
  const { jobs } = useJobs();

  const stats = [
    {
      title: 'Total Leads',
      value: leads.length,
      icon: ClipboardList,
      description: `${leads.filter(l => l.status === 'new').length} new`,
    },
    {
      title: 'Active Opportunities',
      value: opportunities.filter(o => !['close', 'psfu'].includes(o.stage)).length,
      icon: Target,
      description: `$${opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0).toLocaleString()} pipeline`,
    },
    {
      title: 'Active Jobs',
      value: jobs.filter(j => ['scheduled', 'in_progress'].includes(j.status)).length,
      icon: Briefcase,
      description: `${jobs.filter(j => j.status === 'completed').length} completed`,
    },
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      description: `${customers.filter(c => c.customer_type === 'commercial').length} commercial`,
    },
  ];

  const recentActivity = [
    ...leads.slice(0, 3).map(l => ({
      type: 'Lead',
      name: l.name,
      status: l.status,
      date: new Date(l.created_at).toLocaleDateString(),
    })),
    ...opportunities.slice(0, 2).map(o => ({
      type: 'Opportunity',
      name: o.title,
      status: o.stage,
      date: new Date(o.created_at).toLocaleDateString(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const quickActions = [
    { 
      id: 'leads' as Section, 
      label: 'New Lead', 
      icon: Plus, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      description: 'Add a new lead'
    },
    { 
      id: 'estimates' as Section, 
      label: 'Create Estimate', 
      icon: FileText, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      description: 'Build a quote'
    },
    { 
      id: 'calendar' as Section, 
      label: 'Schedule', 
      icon: Calendar, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      description: 'Book appointment'
    },
    { 
      id: 'jobs' as Section, 
      label: 'View Jobs', 
      icon: Briefcase, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      description: 'Manage projects'
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Mobile Quick Actions - Show only on mobile */}
        {isMobile && onSectionChange && (
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.id}
                className="cursor-pointer hover:shadow-md active:scale-95 transition-all"
                onClick={() => onSectionChange(action.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2 min-h-[100px] justify-center">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', action.bgColor)}>
                    <action.icon className={cn('h-6 w-6', action.color)} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overview of your business pipeline</p>
        </div>

        {/* Conversion Analytics */}
        <ConversionAnalytics />

        {/* Win/Loss Analysis */}
        <WinLossAnalysis />

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
        </div>

        {/* Recent Activity */}
        <Card>
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 border-b pb-3 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{activity.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {activity.type} • {activity.status}
                  </p>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground shrink-0">{activity.date}</span>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
