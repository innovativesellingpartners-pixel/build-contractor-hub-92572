import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Target, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ConversionAnalyticsProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

export function ConversionAnalytics({ filters }: ConversionAnalyticsProps) {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['conversion-analytics', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      // Build date filters
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);
      
      let opportunitiesQuery = supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id);
      
      let jobsQuery = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);

      if (filters?.dateFrom) {
        leadsQuery = leadsQuery.gte('created_at', filters.dateFrom);
        opportunitiesQuery = opportunitiesQuery.gte('created_at', filters.dateFrom);
        jobsQuery = jobsQuery.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        leadsQuery = leadsQuery.lte('created_at', filters.dateTo);
        opportunitiesQuery = opportunitiesQuery.lte('created_at', filters.dateTo);
        jobsQuery = jobsQuery.lte('created_at', filters.dateTo);
      }

      const [leadsRes, opportunitiesRes, jobsRes] = await Promise.all([
        leadsQuery,
        opportunitiesQuery,
        jobsQuery,
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (opportunitiesRes.error) throw opportunitiesRes.error;
      if (jobsRes.error) throw jobsRes.error;

      const leads = leadsRes.data || [];
      const opportunities = opportunitiesRes.data || [];
      const jobs = jobsRes.data || [];

      // Calculate conversions
      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => l.status === 'converted' || opportunities.some(o => o.lead_id === l.id)).length;
      const leadToOpportunityRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const totalOpportunities = opportunities.length;
      const wonOpportunities = opportunities.filter(o => o.stage === 'close' || jobs.some(j => j.opportunity_id === o.id)).length;
      const opportunityToJobRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;

      const totalJobs = jobs.length;
      const overallConversionRate = totalLeads > 0 ? (totalJobs / totalLeads) * 100 : 0;

      // Pipeline value by stage
      const pipelineByStage = opportunities.reduce((acc, opp) => {
        const stage = opp.stage || 'unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count++;
        acc[stage].value += Number(opp.estimated_value || 0);
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const totalPipelineValue = opportunities.reduce((sum, opp) => sum + Number(opp.estimated_value || 0), 0);
      const avgDealSize = totalOpportunities > 0 ? totalPipelineValue / totalOpportunities : 0;

      return {
        totalLeads,
        convertedLeads,
        leadToOpportunityRate,
        totalOpportunities,
        wonOpportunities,
        opportunityToJobRate,
        totalJobs,
        overallConversionRate,
        pipelineByStage,
        totalPipelineValue,
        avgDealSize,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const stageOrder = ['qualification', 'lwe_discovery', 'demo', 'proposal', 'negotiation', 'close', 'psfu'];
  const stageLabels: Record<string, string> = {
    qualification: 'Qualification',
    lwe_discovery: 'LWE Discovery',
    demo: 'Demo',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    close: 'Closed',
    psfu: 'PSFU',
  };

  return (
    <div className="space-y-6">
      {/* Key Conversion Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Lead → Opp</p>
              <p className="text-2xl font-bold mt-1 break-words">{formatPercent(metrics.leadToOpportunityRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{metrics.convertedLeads} leads</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Opp → Job</p>
              <p className="text-2xl font-bold mt-1 break-words">{formatPercent(metrics.opportunityToJobRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{metrics.wonOpportunities} won</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Overall</p>
              <p className="text-2xl font-bold mt-1 break-words">{formatPercent(metrics.overallConversionRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{metrics.totalJobs} jobs</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Avg Deal</p>
              <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(metrics.avgDealSize)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Pipeline: {formatCurrency(metrics.totalPipelineValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline by Stage */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pipeline by Stage</h3>
        <div className="space-y-4">
          {stageOrder.map((stage) => {
            const data = metrics.pipelineByStage[stage];
            if (!data || data.count === 0) return null;

            const percentage = metrics.totalOpportunities > 0 
              ? (data.count / metrics.totalOpportunities) * 100 
              : 0;

            return (
              <div key={stage}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stageLabels[stage] || stage}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(data.value)}</p>
                    <p className="text-xs text-muted-foreground">{data.count} opportunities</p>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
