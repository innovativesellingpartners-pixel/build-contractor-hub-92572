import { Link } from 'react-router-dom';
import { Users, FileText, Briefcase, Receipt, BarChart3, RotateCcw, Play, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const modules = [
  { to: '/admin/demo/crm', icon: Users, label: 'CRM', description: 'Leads & Customers' },
  { to: '/admin/demo/estimates', icon: FileText, label: 'Estimates', description: 'Quotes & Proposals' },
  { to: '/admin/demo/jobs', icon: Briefcase, label: 'Jobs', description: 'Project Management' },
  { to: '/admin/demo/invoices', icon: Receipt, label: 'Invoices', description: 'Billing & Payments' },
  { to: '/admin/demo/reports', icon: BarChart3, label: 'Reports', description: 'Analytics & Dashboards' },
  { to: '/admin/demo/scenarios', icon: Play, label: 'Scenarios', description: 'Pre-built demo flows' },
  { to: '/admin/demo/reset', icon: RotateCcw, label: 'Reset Demo', description: 'Restore seed data' },
];

export const DemoDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demo Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Explore fully seeded modules with realistic contractor data. No production data is affected.
        </p>
      </div>

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
