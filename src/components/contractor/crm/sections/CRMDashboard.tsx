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
      color: 'text-blue-vibrant',
      bgColor: 'bg-blue-vibrant/10',
      borderColor: 'border-l-blue-vibrant',
      gradient: 'from-card to-card',
    },
    {
      title: 'Active Opportunities',
      value: opportunities.filter(o => !['close', 'psfu'].includes(o.stage)).length,
      icon: Target,
      description: `$${opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0).toLocaleString()} pipeline`,
      color: 'text-green-vibrant',
      bgColor: 'bg-green-vibrant/10',
      borderColor: 'border-l-green-vibrant',
      gradient: 'from-card to-card',
    },
    {
      title: 'Active Jobs',
      value: jobs.filter(j => ['scheduled', 'in_progress'].includes(j.status)).length,
      icon: Briefcase,
      description: `${jobs.filter(j => j.status === 'completed').length} completed`,
      color: 'text-purple-vibrant',
      bgColor: 'bg-purple-vibrant/10',
      borderColor: 'border-l-purple-vibrant',
      gradient: 'from-card to-card',
    },
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      description: `${customers.filter(c => c.customer_type === 'commercial').length} commercial`,
      color: 'text-orange-vibrant',
      bgColor: 'bg-orange-vibrant/10',
      borderColor: 'border-l-orange-vibrant',
      gradient: 'from-card to-card',
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
      gradient: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-400',
      description: 'Add a new lead'
    },
    { 
      id: 'estimates' as Section, 
      label: 'Create Estimate', 
      icon: FileText, 
      gradient: 'from-green-500 to-green-600',
      borderColor: 'border-green-400',
      description: 'Build a quote'
    },
    { 
      id: 'calendar' as Section, 
      label: 'Schedule', 
      icon: Calendar, 
      gradient: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-400',
      description: 'Book appointment'
    },
    { 
      id: 'jobs' as Section, 
      label: 'View Jobs', 
      icon: Briefcase, 
      gradient: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-400',
      description: 'Manage projects'
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        {/* Mobile Quick Actions */}
        {isMobile && onSectionChange && (
          <div className="grid grid-cols-2 gap-3 w-full">
            {quickActions.map((action) => (
              <Card
                key={action.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 bg-gradient-to-br border-2',
                  action.gradient, action.borderColor,
                  'hover:shadow-2xl hover:scale-105 active:scale-95 text-white'
                )}
                onClick={() => onSectionChange(action.id)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-semibold text-center text-white">{action.label}</span>
                  <p className="text-xs text-white/80 text-center">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overview of your business</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          {stats.map((stat, index) => (
            <Card key={index} className={cn('p-4 border-l-4', stat.borderColor)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{stat.description}</p>
                  )}
                </div>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ConversionAnalytics />
          <WinLossAnalysis />
        </div>

        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.type}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted flex-shrink-0">{activity.status}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {!isMobile && onSectionChange && (
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onSectionChange('leads')}><Plus className="h-4 w-4" />New Lead</Button>
                <Button onClick={() => onSectionChange('estimates')} variant="secondary"><FileText className="h-4 w-4" />Create Estimate</Button>
                <Button onClick={() => onSectionChange('calendar')} variant="outline"><Calendar className="h-4 w-4" />Schedule</Button>
                <Button onClick={() => onSectionChange('jobs')} variant="outline"><Briefcase className="h-4 w-4" />View Jobs</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
