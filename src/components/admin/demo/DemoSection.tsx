import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemoContext, DEMO_USER_ID } from '@/contexts/DemoContext';

interface DemoSectionProps {
  module: string;
}

const moduleLabels: Record<string, string> = {
  crm: 'CRM – Leads & Customers',
  estimates: 'Estimates & Proposals',
  jobs: 'Jobs & Scheduling',
  invoices: 'Invoices & Payments',
  reports: 'Reports & Analytics',
};

export const DemoSection = ({ module }: DemoSectionProps) => {
  const demo = useDemoContext();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">{moduleLabels[module] || module}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Construction className="h-5 w-5 text-warning" />
            Module Ready for Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            This demo section will render the full <strong>{moduleLabels[module] || module}</strong> UI 
            using data from the demo contractor account.
          </p>
          <p className="text-sm text-muted-foreground">
            Demo User ID: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{DEMO_USER_ID}</code>
          </p>
          {demo?.isDemoMode && (
            <p className="text-sm text-primary font-medium">
              ✓ Demo context is active — data will be scoped to the demo contractor.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Run <strong>Seed Demo Data</strong> from the Reset panel to populate this module with realistic data, 
            then the existing contractor components will render here with full functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
