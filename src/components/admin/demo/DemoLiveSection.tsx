/**
 * DemoLiveSection — Renders actual production components inside the demo workspace.
 * Uses the DemoAuthOverride to scope data to the demo contractor.
 * Falls back to the summary view for modules not yet wired.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoAuthOverride } from '@/contexts/DemoAuthOverride';
import { useDemoContext } from '@/contexts/DemoContext';
import { Suspense, lazy } from 'react';
import { DemoCRMView } from './DemoCRMView';
import { DemoEstimatesView } from './DemoEstimatesView';
import { DemoJobsView } from './DemoJobsView';
import { DemoInvoicesView } from './DemoInvoicesView';
import { DemoReportsView } from './DemoReportsView';

interface DemoLiveSectionProps {
  module: 'crm' | 'estimates' | 'jobs' | 'invoices' | 'reports';
}

const moduleLabels: Record<string, string> = {
  crm: 'CRM – Leads & Customers',
  estimates: 'Estimates & Proposals',
  jobs: 'Jobs & Scheduling',
  invoices: 'Invoices & Payments',
  reports: 'Reports & Analytics',
};

const SectionContent = ({ module }: { module: string }) => {
  switch (module) {
    case 'crm':
      return <DemoCRMView />;
    case 'estimates':
      return <DemoEstimatesView />;
    case 'jobs':
      return <DemoJobsView />;
    case 'invoices':
      return <DemoInvoicesView />;
    case 'reports':
      return <DemoReportsView />;
    default:
      return <p className="text-muted-foreground">Module not available.</p>;
  }
};

export const DemoLiveSection = ({ module }: DemoLiveSectionProps) => {
  const demo = useDemoContext();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">{moduleLabels[module]}</h2>
        {demo?.isDemoMode && (
          <Badge variant="outline" className="text-xs">
            Live Demo Data
          </Badge>
        )}
      </div>

      <DemoAuthOverride>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }>
          <SectionContent module={module} />
        </Suspense>
      </DemoAuthOverride>
    </div>
  );
};
