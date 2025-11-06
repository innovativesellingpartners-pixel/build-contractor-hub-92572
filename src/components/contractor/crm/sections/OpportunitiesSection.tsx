import { useOpportunities } from '@/hooks/useOpportunities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddOpportunityDialog } from '../AddOpportunityDialog';

export default function OpportunitiesSection() {
  const { opportunities, loading, addOpportunity } = useOpportunities();

  const stages = [
    { id: 'qualification', label: 'Qualification' },
    { id: 'discovery', label: 'Discovery' },
    { id: 'proposal', label: 'Proposal' },
    { id: 'negotiation', label: 'Negotiation' },
    { id: 'closed_won', label: 'Closed Won' },
    { id: 'closed_lost', label: 'Closed Lost' },
  ];

  const getStageOpportunities = (stage: string) =>
    opportunities.filter((opp) => opp.stage === stage);

  if (loading) {
    return <div className="p-6">Loading opportunities...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opportunities</h1>
          <p className="text-muted-foreground">Track your sales pipeline</p>
        </div>
        <AddOpportunityDialog onAdd={addOpportunity} />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{stage.label}</h3>
              <Badge variant="secondary">
                {getStageOpportunities(stage.id).length}
              </Badge>
            </div>
            <div className="space-y-3">
              {getStageOpportunities(stage.id).map((opp) => (
                <Card key={opp.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{opp.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {opp.value && (
                      <p className="text-lg font-semibold text-primary">
                        ${opp.value.toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{opp.probability}% probability</span>
                      {opp.expected_close_date && (
                        <span>
                          {new Date(opp.expected_close_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
