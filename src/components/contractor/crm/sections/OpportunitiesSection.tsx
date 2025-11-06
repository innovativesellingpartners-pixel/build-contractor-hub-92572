import { useState } from 'react';
import { useOpportunities, OpportunityStage } from '@/hooks/useOpportunities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddOpportunityDialog } from '../AddOpportunityDialog';
import OpportunityDetailView from '../OpportunityDetailView';
import { DollarSign, Calendar, TrendingUp, AlertCircle, LayoutGrid, LayoutList } from 'lucide-react';
import { format } from 'date-fns';

const stageConfig: Record<OpportunityStage, { label: string; color: string }> = {
  qualification: { label: 'Qualification', color: 'bg-slate-500' },
  lwe_discovery: { label: 'LWE/Discovery', color: 'bg-blue-500' },
  demo: { label: 'Demo', color: 'bg-cyan-500' },
  proposal: { label: 'Proposal', color: 'bg-yellow-500' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500' },
  close: { label: 'Close', color: 'bg-green-500' },
  psfu: { label: 'PSFU', color: 'bg-purple-500' },
};

export default function OpportunitiesSection() {
  const { opportunities, loading, addOpportunity, updateOpportunity } = useOpportunities();
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const stages: OpportunityStage[] = ['qualification', 'lwe_discovery', 'demo', 'proposal', 'negotiation', 'close', 'psfu'];

  const getStageOpportunities = (stage: OpportunityStage) =>
    opportunities.filter((opp) => opp.stage === stage);

  const getDaysInStage = (stageEnteredAt: string) => {
    const entered = new Date(stageEnteredAt);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (nextActionDate?: string) => {
    if (!nextActionDate) return false;
    return new Date(nextActionDate) < new Date();
  };

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData('opportunityId', oppId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: OpportunityStage) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('opportunityId');
    await updateOpportunity(oppId, { stage: newStage });
  };

  if (selectedOpp) {
    return <OpportunityDetailView opportunity={selectedOpp} onBack={() => setSelectedOpp(null)} />;
  }

  if (loading) {
    return <div className="p-6">Loading opportunities...</div>;
  }

  // Calculate metrics
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
  const weightedValue = opportunities.reduce(
    (sum, opp) => sum + (opp.estimated_value || 0) * (opp.probability_percent / 100),
    0
  );
  const activeCount = opportunities.filter((opp) => opp.stage !== 'close' && opp.stage !== 'psfu').length;

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Pipeline</h1>
            <p className="text-muted-foreground">Track opportunities through 7-stage sales process</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'board' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4 mr-2" />
              List
            </Button>
            <AddOpportunityDialog onAdd={addOpportunity} />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{opportunities.length} opportunities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${weightedValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Based on probability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Board View */}
        {viewMode === 'board' && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 xl:grid-cols-7">
            {stages.map((stage) => (
              <div
                key={stage}
                className="space-y-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="flex items-center justify-between sticky top-0 bg-background pb-2 z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stageConfig[stage].color}`} />
                    <h3 className="font-semibold text-sm">{stageConfig[stage].label}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getStageOpportunities(stage).length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {getStageOpportunities(stage).map((opp) => (
                    <Card
                      key={opp.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      draggable
                      onDragStart={(e) => handleDragStart(e, opp.id)}
                      onClick={() => setSelectedOpp(opp)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm line-clamp-1">{opp.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{opp.customer_name}</p>
                        </div>

                        {opp.estimated_value && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-primary">
                              ${opp.estimated_value.toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {opp.probability_percent}%
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {opp.trade_type}
                          </Badge>
                          <span>{getDaysInStage(opp.stage_entered_at)}d</span>
                        </div>

                        {isOverdue(opp.next_action_date) && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>Overdue</span>
                          </div>
                        )}

                        {opp.estimated_close_date && (
                          <div className="text-xs text-muted-foreground">
                            Close: {format(new Date(opp.estimated_close_date), 'MMM d')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Title</th>
                      <th className="text-left p-4 font-medium">Stage</th>
                      <th className="text-left p-4 font-medium">Trade</th>
                      <th className="text-right p-4 font-medium">Value</th>
                      <th className="text-center p-4 font-medium">Probability</th>
                      <th className="text-left p-4 font-medium">Close Date</th>
                      <th className="text-center p-4 font-medium">Days in Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opp) => (
                      <tr
                        key={opp.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedOpp(opp)}
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{opp.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{opp.customer_phone}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{opp.title}</span>
                            {isOverdue(opp.next_action_date) && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={stageConfig[opp.stage].color}>
                            {stageConfig[opp.stage].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{opp.trade_type}</Badge>
                        </td>
                        <td className="p-4 text-right font-semibold">
                          ${opp.estimated_value?.toLocaleString() || '0'}
                        </td>
                        <td className="p-4 text-center">{opp.probability_percent}%</td>
                        <td className="p-4">
                          {opp.estimated_close_date
                            ? format(new Date(opp.estimated_close_date), 'MMM d, yyyy')
                            : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline">{getDaysInStage(opp.stage_entered_at)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
