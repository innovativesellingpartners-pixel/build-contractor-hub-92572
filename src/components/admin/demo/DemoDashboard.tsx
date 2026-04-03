import { Link } from 'react-router-dom';
import { Users, FileText, Briefcase, Receipt, BarChart3, RotateCcw, Play, Wrench, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDemoStats } from '@/hooks/useDemoData';
import { Skeleton } from '@/components/ui/skeleton';

const modules = [
  { to: '/admin/demo/crm', icon: Users, label: 'CRM', description: 'Leads & Customers' },
  { to: '/admin/demo/estimates', icon: FileText, label: 'Estimates', description: 'Quotes & Proposals' },
  { to: '/admin/demo/jobs', icon: Briefcase, label: 'Jobs', description: 'Project Management' },
  { to: '/admin/demo/invoices', icon: Receipt, label: 'Invoices', description: 'Billing & Payments' },
  { to: '/admin/demo/reports', icon: BarChart3, label: 'Reports', description: 'Analytics & Dashboards' },
  { to: '/admin/demo/scenarios', icon: Play, label: 'Guided Scenarios', description: 'Interactive demo flows' },
  { to: '/admin/demo/tools', icon: Wrench, label: 'Admin Tools', description: 'Data generation & toggles' },
  { to: '/admin/demo/reset', icon: RotateCcw, label: 'Reset Demo', description: 'Restore seed data' },
];

export const DemoDashboard = () => {
  const { data: stats, isLoading } = useDemoStats();

  const statCards = stats ? [
    { label: 'Leads', count: stats.leads.count, icon: Users },
    { label: 'Customers', count: stats.customers.count, icon: Users },
    { label: 'Estimates', count: stats.estimates.count, icon: FileText },
    { label: 'Jobs', count: stats.jobs.count, icon: Briefcase },
    { label: 'Invoices', count: stats.invoices.count, icon: Receipt },
  ] : [];

  const totalRevenue = stats?.invoices.data
    ?.filter((inv: any) => inv.status === 'paid')
    ?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;

  const totalPipeline = stats?.jobs.data
    ?.reduce((sum: number, job: any) => sum + (job.contract_value || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demo Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Explore fully seeded modules with realistic contractor data. No production data is affected.
        </p>
      </div>

      {/* Quick Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.count}</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Revenue highlights */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue Collected</p>
                <p className="text-xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-xl font-bold">${totalPipeline.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Link key={mod.to} to={mod.to}>
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <mod.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{mod.label}</CardTitle>
                  {mod.label === 'Guided Scenarios' && (
                    <Badge variant="secondary" className="text-xs ml-auto">Interactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{mod.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
