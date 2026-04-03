import { Link } from 'react-router-dom';
import { ArrowLeft, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const scenarios = [
  {
    id: 1,
    title: 'Lead → Appointment',
    description: 'New inbound lead gets qualified, scheduled for a site visit, and assigned to sales rep.',
    steps: ['New lead arrives', 'Qualify & tag', 'Schedule appointment', 'Assign to rep'],
    status: 'coming_soon' as const,
  },
  {
    id: 2,
    title: 'Estimate → Signed Job',
    description: 'Create estimate from lead, send to customer, get signature, convert to active job.',
    steps: ['Create estimate', 'Send to customer', 'Customer signs', 'Convert to job'],
    status: 'coming_soon' as const,
  },
  {
    id: 3,
    title: 'Job → Invoice → Payment',
    description: 'Active job generates progress invoice, customer pays via portal, payment recorded.',
    steps: ['Job in progress', 'Create invoice', 'Send to customer', 'Record payment'],
    status: 'coming_soon' as const,
  },
  {
    id: 4,
    title: 'Reporting Walkthrough',
    description: 'Revenue, job profitability, lead conversion — full analytics dashboard tour.',
    steps: ['Revenue overview', 'Job profitability', 'Lead funnel', 'Export reports'],
    status: 'coming_soon' as const,
  },
  {
    id: 5,
    title: 'AI Productivity Flow',
    description: 'AI assistant generates estimate, summarizes job notes, drafts customer email.',
    steps: ['AI estimate generation', 'Job summary', 'Email draft', 'Voice transcript'],
    status: 'coming_soon' as const,
  },
];

export const DemoScenarios = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Demo Scenarios</h2>
      </div>

      <p className="text-muted-foreground">
        Pre-built guided flows for product demos. Each scenario walks through a complete user story with seeded data.
      </p>

      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  {scenario.title}
                </CardTitle>
                <Badge variant="secondary">Phase 2</Badge>
              </div>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {scenario.steps.map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">{step}</span>
                    {i < scenario.steps.length - 1 && <ArrowRight className="h-3 w-3" />}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
