/**
 * DemoGuidedScenario — Interactive step-by-step walkthrough for demo flows.
 * Provides narrated steps with highlight cues for live demos.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Play, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScenarioStep {
  title: string;
  description: string;
  action: string;
  navigateTo?: string;
  tip?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  steps: ScenarioStep[];
}

const scenarios: Scenario[] = [
  {
    id: 'lead-to-job',
    title: 'Lead → Signed Job',
    description: 'Walk through the full sales pipeline: capture a lead, qualify it, create an estimate, get it signed, and convert to an active job.',
    estimatedTime: '5 min',
    steps: [
      {
        title: 'Review Leads Pipeline',
        description: 'Open the CRM section to see the lead pipeline with leads at every stage — New, Contacted, Qualified, and Proposal Sent.',
        action: 'Navigate to Demo CRM',
        navigateTo: '/admin/demo/crm',
        tip: 'Point out the stage badges and lead count per stage.',
      },
      {
        title: 'Examine Lead Details',
        description: 'Click on any lead card to see full contact info, source, notes, and activity history. Show how leads are tagged by priority.',
        action: 'Click a lead card',
        tip: 'Highlight the source tracking (website, referral, Google) and priority badges.',
      },
      {
        title: 'View Estimates',
        description: 'Navigate to Estimates to see quotes at various stages — Draft, Sent, Viewed, and Signed.',
        action: 'Navigate to Demo Estimates',
        navigateTo: '/admin/demo/estimates',
        tip: 'Show the close rate metric and how estimates progress through stages.',
      },
      {
        title: 'Show Job Conversion',
        description: 'Navigate to Jobs to see active projects. In production, signed estimates auto-convert to jobs with full customer records.',
        action: 'Navigate to Demo Jobs',
        navigateTo: '/admin/demo/jobs',
        tip: 'Point out the job statuses, contract values, and linked customer names.',
      },
    ],
  },
  {
    id: 'job-to-payment',
    title: 'Job → Invoice → Payment',
    description: 'Demonstrate the financial workflow: active job generates invoices, track payments, and monitor profitability.',
    estimatedTime: '4 min',
    steps: [
      {
        title: 'Active Jobs Overview',
        description: 'Show the Jobs section with projects in various statuses — In Progress, Completed, On Hold.',
        action: 'Navigate to Demo Jobs',
        navigateTo: '/admin/demo/jobs',
        tip: 'Highlight contract values and the mix of job statuses.',
      },
      {
        title: 'Invoice Management',
        description: 'Navigate to Invoices to see the billing pipeline — Draft, Sent, Paid, Overdue, and Partial payments.',
        action: 'Navigate to Demo Invoices',
        navigateTo: '/admin/demo/invoices',
        tip: 'Call out the overdue invoices and the total revenue collected.',
      },
      {
        title: 'Financial Summary',
        description: 'Show the Reports section for revenue analytics, payment collection rates, and job profitability.',
        action: 'Navigate to Demo Reports',
        navigateTo: '/admin/demo/reports',
        tip: 'Emphasize the lead-to-revenue conversion funnel.',
      },
    ],
  },
  {
    id: 'full-platform',
    title: 'Full Platform Tour',
    description: 'Complete walkthrough of all modules — CRM, Estimates, Jobs, Invoices, and Reports — showcasing the integrated contractor workflow.',
    estimatedTime: '8 min',
    steps: [
      {
        title: 'Dashboard Overview',
        description: 'Start at the Demo Dashboard to see the module cards and overall data summary.',
        action: 'Navigate to Demo Home',
        navigateTo: '/admin/demo',
        tip: 'Show how all modules are connected in one platform.',
      },
      {
        title: 'CRM & Lead Management',
        description: 'Demonstrate lead capture, pipeline stages, and customer management.',
        action: 'Navigate to Demo CRM',
        navigateTo: '/admin/demo/crm',
        tip: 'Show the lead pipeline breakdown and customer list.',
      },
      {
        title: 'Estimating & Proposals',
        description: 'Show professional estimates with line items, approval tracking, and e-signature flow.',
        action: 'Navigate to Demo Estimates',
        navigateTo: '/admin/demo/estimates',
        tip: 'Highlight the estimate-to-job conversion workflow.',
      },
      {
        title: 'Job Management',
        description: 'Demo project tracking, scheduling, and job costing features.',
        action: 'Navigate to Demo Jobs',
        navigateTo: '/admin/demo/jobs',
        tip: 'Show the variety of job statuses and contract values.',
      },
      {
        title: 'Invoicing & Payments',
        description: 'Walk through the billing cycle from invoice creation to payment collection.',
        action: 'Navigate to Demo Invoices',
        navigateTo: '/admin/demo/invoices',
        tip: 'Demonstrate paid vs overdue invoices and partial payments.',
      },
      {
        title: 'Reports & Analytics',
        description: 'Conclude with the analytics dashboard showing revenue, conversions, and business health metrics.',
        action: 'Navigate to Demo Reports',
        navigateTo: '/admin/demo/reports',
        tip: 'End on the strong note of data-driven business insights.',
      },
    ],
  },
];

export const DemoGuidedScenario = () => {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStartScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const handleCompleteStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (activeScenario && currentStep < activeScenario.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setActiveScenario(null);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  if (activeScenario) {
    const step = activeScenario.steps[currentStep];
    const progress = ((completedSteps.size) / activeScenario.steps.length) * 100;
    const isComplete = completedSteps.size === activeScenario.steps.length;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Scenarios
          </Button>
          <h2 className="text-xl font-semibold">{activeScenario.title}</h2>
          <Badge variant="outline" className="text-xs">
            Step {currentStep + 1} of {activeScenario.steps.length}
          </Badge>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Step indicators */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {activeScenario.steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : completedSteps.has(i)
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {completedSteps.has(i) ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="w-3 text-center">{i + 1}</span>
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Active step card */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              {step.title}
            </CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step.tip && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm text-foreground">
                  <strong className="text-primary">💡 Demo Tip:</strong> {step.tip}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {step.navigateTo && (
                <Link to={step.navigateTo}>
                  <Button variant="outline" size="sm">
                    {step.action}
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              )}

              <Button
                size="sm"
                onClick={handleCompleteStep}
                disabled={completedSteps.has(currentStep)}
              >
                {completedSteps.has(currentStep) ? (
                  <><Check className="h-3.5 w-3.5 mr-1" /> Done</>
                ) : (
                  <>Mark Complete</>
                )}
              </Button>

              {currentStep < activeScenario.steps.length - 1 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                  Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isComplete && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6 text-center">
              <Check className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-lg">Scenario Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                All {activeScenario.steps.length} steps completed. Ready for the next demo.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Back to Scenarios
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Scenario selection view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Guided Demo Scenarios</h2>
      </div>

      <p className="text-muted-foreground">
        Interactive step-by-step walkthroughs for live product demos. Each scenario includes narration cues, navigation links, and demo tips.
      </p>

      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  {scenario.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">~{scenario.estimatedTime}</Badge>
                  <Badge variant="secondary" className="text-xs">{scenario.steps.length} steps</Badge>
                </div>
              </div>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
                {scenario.steps.map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">{step.title}</span>
                    {i < scenario.steps.length - 1 && <ArrowRight className="h-3 w-3" />}
                  </span>
                ))}
              </div>
              <Button size="sm" onClick={() => handleStartScenario(scenario)}>
                <Play className="h-3.5 w-3.5 mr-1" /> Start Scenario
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
