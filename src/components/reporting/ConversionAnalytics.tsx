import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Target, DollarSign, ArrowRight, FileText, UserCheck, Briefcase, ClipboardCheck } from 'lucide-react';
import { GaugeChart } from './charts/GaugeChart';
import { ChartCard } from './charts/ChartCard';
import { useAuth } from '@/contexts/AuthContext';
import { ReportingFilters } from '@/pages/Reporting';

interface ConversionAnalyticsProps {
  filters?: ReportingFilters;
}

export function ConversionAnalytics({ filters }: ConversionAnalyticsProps) {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['conversion-analytics', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      // Build date filters for the linear flow: Lead → Estimate → Customer → Job → PSFU
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);
      
      let estimatesQuery = supabase
        .from('estimates')
        .select('*')
        .eq('user_id', user.id);
      
      let customersQuery = supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);
      
      let jobsQuery = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);

      // Apply date filters
      if (filters?.dateFrom) {
        leadsQuery = leadsQuery.gte('created_at', filters.dateFrom);
        estimatesQuery = estimatesQuery.gte('created_at', filters.dateFrom);
        customersQuery = customersQuery.gte('created_at', filters.dateFrom);
        jobsQuery = jobsQuery.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        leadsQuery = leadsQuery.lte('created_at', filters.dateTo);
        estimatesQuery = estimatesQuery.lte('created_at', filters.dateTo);
        customersQuery = customersQuery.lte('created_at', filters.dateTo);
        jobsQuery = jobsQuery.lte('created_at', filters.dateTo);
      }

      const [leadsRes, estimatesRes, customersRes, jobsRes] = await Promise.all([
        leadsQuery,
        estimatesQuery,
        customersQuery,
        jobsQuery,
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (estimatesRes.error) throw estimatesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (jobsRes.error) throw jobsRes.error;

      const leads = leadsRes.data || [];
      const estimates = estimatesRes.data || [];
      const customers = customersRes.data || [];
      const jobs = jobsRes.data || [];

      // Calculate conversions for the linear flow
      const totalLeads = leads.length;
      const totalEstimates = estimates.length;
      const totalCustomers = customers.length;
      const totalJobs = jobs.length;

      // Lead → Estimate: leads that have an estimate linked
      const leadsWithEstimates = leads.filter(l => 
        estimates.some(e => e.lead_id === l.id)
      ).length;
      const leadToEstimateRate = totalLeads > 0 ? (leadsWithEstimates / totalLeads) * 100 : 0;

      // Estimate → Customer: estimates that have been converted to customers
      const estimatesConverted = estimates.filter(e => 
        e.status === 'accepted' || e.status === 'sold' || customers.some(c => c.estimate_id === e.id)
      ).length;
      const estimateToCustomerRate = totalEstimates > 0 ? (estimatesConverted / totalEstimates) * 100 : 0;

      // Customer → Job: customers that have jobs
      const customersWithJobs = customers.filter(c => 
        jobs.some(j => j.customer_id === c.id)
      ).length;
      const customerToJobRate = totalCustomers > 0 ? (customersWithJobs / totalCustomers) * 100 : 0;

      // Overall conversion: leads that became jobs
      const overallConversionRate = totalLeads > 0 ? (totalJobs / totalLeads) * 100 : 0;

      // Financial metrics
      const totalEstimateValue = estimates.reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
      const avgEstimateValue = totalEstimates > 0 ? totalEstimateValue / totalEstimates : 0;
      
      const totalJobValue = jobs.reduce((sum, j) => sum + Number(j.budget_amount || j.contract_value || 0), 0);
      const avgJobValue = totalJobs > 0 ? totalJobValue / totalJobs : 0;

      // Estimate status breakdown
      const estimatesByStatus = estimates.reduce((acc, e) => {
        const status = e.status || 'draft';
        if (!acc[status]) acc[status] = { count: 0, value: 0 };
        acc[status].count++;
        acc[status].value += Number(e.total_amount || 0);
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      // Job status breakdown
      const jobsByStatus = jobs.reduce((acc, j) => {
        const status = j.job_status || j.status || 'pending';
        if (!acc[status]) acc[status] = { count: 0, value: 0 };
        acc[status].count++;
        acc[status].value += Number(j.budget_amount || j.contract_value || 0);
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      return {
        // Counts
        totalLeads,
        totalEstimates,
        totalCustomers,
        totalJobs,
        // Conversions
        leadsWithEstimates,
        leadToEstimateRate,
        estimatesConverted,
        estimateToCustomerRate,
        customersWithJobs,
        customerToJobRate,
        overallConversionRate,
        // Financial
        totalEstimateValue,
        avgEstimateValue,
        totalJobValue,
        avgJobValue,
        // Breakdowns
        estimatesByStatus,
        jobsByStatus,
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
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    sold: 'Sold',
    rejected: 'Rejected',
    expired: 'Expired',
    pending: 'Pending',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  };

  return (
    <div className="space-y-6">
      {/* Stage Counts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-blue-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Leads</p>
              <p className="text-2xl font-bold mt-1">{metrics.totalLeads}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Total in pipeline</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Estimates</p>
              <p className="text-2xl font-bold mt-1">{metrics.totalEstimates}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{formatCurrency(metrics.totalEstimateValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Customers</p>
              <p className="text-2xl font-bold mt-1">{metrics.totalCustomers}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Converted</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Jobs</p>
              <p className="text-2xl font-bold mt-1">{metrics.totalJobs}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{formatCurrency(metrics.totalJobValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Conversion Rates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Lead → Estimate</p>
              <p className="text-2xl font-bold mt-1">{formatPercent(metrics.leadToEstimateRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{metrics.leadsWithEstimates} converted</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Estimate → Customer</p>
              <p className="text-2xl font-bold mt-1">{formatPercent(metrics.estimateToCustomerRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{metrics.estimatesConverted} accepted</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Customer → Job</p>
              <p className="text-2xl font-bold mt-1">{formatPercent(metrics.customerToJobRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{metrics.customersWithJobs} with jobs</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Overall</p>
              <p className="text-2xl font-bold mt-1">{formatPercent(metrics.overallConversionRate)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Lead to Job</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Funnel + Overall Conversion Gauge */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Pipeline Funnel</h3>
          <div className="space-y-3">
            {[
              { label: 'Leads', count: metrics.totalLeads, color: 'hsl(217,91%,60%)', width: 100 },
              { label: 'Estimates', count: metrics.totalEstimates, color: 'hsl(262,83%,58%)', width: metrics.totalLeads > 0 ? Math.min((metrics.totalEstimates / metrics.totalLeads) * 100, 100) : 80 },
              { label: 'Customers', count: metrics.totalCustomers, color: 'hsl(142,76%,36%)', width: metrics.totalLeads > 0 ? Math.min((metrics.totalCustomers / metrics.totalLeads) * 100, 100) : 60 },
              { label: 'Jobs', count: metrics.totalJobs, color: 'hsl(24,95%,53%)', width: metrics.totalLeads > 0 ? Math.min((metrics.totalJobs / metrics.totalLeads) * 100, 100) : 40 },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 text-right text-muted-foreground">{stage.label}</span>
                <div className="flex-1 relative overflow-hidden">
                  <div
                    className="h-8 rounded-md flex items-center justify-center transition-all"
                    style={{ width: `${Math.max(stage.width, 15)}%`, backgroundColor: stage.color }}
                  >
                    <span className="text-white text-sm font-bold">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <ChartCard
          title="Overall Conversion"
          isEmpty={!metrics.totalLeads}
          emptyMessage="No leads to calculate conversion rate."
        >
          <div className="flex justify-center">
            <GaugeChart
              value={metrics.overallConversionRate}
              target={25}
              label="Lead → Job"
              thresholds={{ low: 10, mid: 20 }}
            />
          </div>
        </ChartCard>
      </div>

      {/* Status Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estimates by Status</h3>
          <div className="space-y-3">
            {Object.entries(metrics.estimatesByStatus).map(([status, data]) => {
              const percentage = metrics.totalEstimates > 0 
                ? (data.count / metrics.totalEstimates) * 100 
                : 0;

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{statusLabels[status] || status}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{data.count}</span>
                      <span className="text-xs text-muted-foreground ml-2">({formatCurrency(data.value)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Jobs by Status</h3>
          <div className="space-y-3">
            {Object.entries(metrics.jobsByStatus).map(([status, data]) => {
              const percentage = metrics.totalJobs > 0 
                ? (data.count / metrics.totalJobs) * 100 
                : 0;

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{statusLabels[status] || status}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{data.count}</span>
                      <span className="text-xs text-muted-foreground ml-2">({formatCurrency(data.value)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}