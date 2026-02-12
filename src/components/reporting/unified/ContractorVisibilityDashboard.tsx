/**
 * ContractorVisibilityDashboard — Simple "Is this profitable?" view
 * for contractors to see job health at a glance.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportJobsWithQBData } from '@/utils/reportExportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { InteractiveReportShell } from '../drilldown/InteractiveReportShell';
import { DateRange } from './ReportDateRangePicker';
import {
  CheckCircle, AlertTriangle, TrendingDown, DollarSign, Target,
  BarChart3, ArrowUpRight, ArrowDownRight, Trophy, AlertOctagon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

interface JobSummary {
  id: string;
  name: string;
  budget: number;
  cost: number;
  profit: number;
  margin: number;
  budgetPct: number;
  status: string;
}

export function ContractorVisibilityDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: 'all_time',
    start: '2000-01-01',
    end: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contractor-visibility', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let q = supabase.from('jobs')
        .select('id, name, budget_amount, actual_cost, contract_value, total_contract_value, job_status, trade_type, created_at')
        .eq('user_id', user.id)
        .in('job_status', ['in_progress', 'completed', 'scheduled']);
      if (dateRange.start) q = q.gte('created_at', dateRange.start);
      if (dateRange.end) q = q.lte('created_at', dateRange.end);
      const { data: jobs } = await q;

      // Also fetch job_costs for actual spend
      const { data: allCosts } = await supabase
        .from('job_costs')
        .select('job_id, amount, category')
        .eq('user_id', user.id);

      const costsByJob: Record<string, { total: number; byCategory: Record<string, number> }> = {};
      (allCosts || []).forEach((c: any) => {
        if (!costsByJob[c.job_id]) costsByJob[c.job_id] = { total: 0, byCategory: {} };
        costsByJob[c.job_id].total += Number(c.amount || 0);
        const cat = c.category || 'Other';
        costsByJob[c.job_id].byCategory[cat] = (costsByJob[c.job_id].byCategory[cat] || 0) + Number(c.amount || 0);
      });

      const summaries: JobSummary[] = (jobs || []).map(j => {
        const budget = Number(j.budget_amount) || Number(j.contract_value) || Number(j.total_contract_value) || 0;
        const cost = costsByJob[j.id]?.total || Number(j.actual_cost) || 0;
        const profit = budget - cost;
        const margin = budget > 0 ? (profit / budget) * 100 : 0;
        const budgetPct = budget > 0 ? (cost / budget) * 100 : 0;
        return { id: j.id, name: j.name || 'Unnamed', budget, cost, profit, margin, budgetPct, status: j.job_status || '' };
      });

      const sorted = [...summaries].sort((a, b) => b.profit - a.profit);
      const profitable = summaries.filter(j => j.margin > 15);
      const breakEven = summaries.filter(j => j.margin >= 0 && j.margin <= 15);
      const losing = summaries.filter(j => j.margin < 0);
      const overBudget = summaries.filter(j => j.budgetPct > 100);

      // Aggregate cost categories
      const allCategories: Record<string, number> = {};
      Object.values(costsByJob).forEach(({ byCategory }) => {
        Object.entries(byCategory).forEach(([cat, amt]) => {
          allCategories[cat] = (allCategories[cat] || 0) + amt;
        });
      });
      const pieData = Object.entries(allCategories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      return {
        jobs: sorted,
        totals: {
          totalBudget: summaries.reduce((s, j) => s + j.budget, 0),
          totalCost: summaries.reduce((s, j) => s + j.cost, 0),
          totalProfit: summaries.reduce((s, j) => s + j.profit, 0),
        },
        counts: { profitable: profitable.length, breakEven: breakEven.length, losing: losing.length, overBudget: overBudget.length },
        top5: sorted.slice(0, 5),
        bottom5: sorted.slice(-5).reverse(),
        pieData,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!data) return null;

  const avgMargin = data.totals.totalBudget > 0 ? (data.totals.totalProfit / data.totals.totalBudget) * 100 : 0;
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <InteractiveReportShell
      title="Contractor Visibility"
      subtitle="Quick job health overview"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onExportCSV={() => {
        if (data?.jobs) {
          exportJobsWithQBData(data.jobs);
        }
      }}
    >
      {/* Quick health cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Total Profit</div>
          <p className={`text-xl font-bold tabular-nums ${data.totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(data.totals.totalProfit)}</p>
          <p className="text-xs text-muted-foreground">across {data.jobs.length} jobs</p>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5" /> Avg Margin</div>
          <p className={`text-xl font-bold tabular-nums ${avgMargin >= 20 ? 'text-green-600' : avgMargin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{avgMargin.toFixed(1)}%</p>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-green-600"><CheckCircle className="h-3.5 w-3.5" /> Profitable</div>
          <p className="text-xl font-bold">{data.counts.profitable}</p>
          <p className="text-xs text-muted-foreground">{data.counts.breakEven} break-even</p>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-red-600"><AlertOctagon className="h-3.5 w-3.5" /> At Risk</div>
          <p className="text-xl font-bold">{data.counts.losing + data.counts.overBudget}</p>
          <p className="text-xs text-muted-foreground">{data.counts.losing} losing, {data.counts.overBudget} over budget</p>
        </Card>
      </div>

      {/* Job cards - each answers "Is this profitable?" */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Job Health</h3>
        {data.jobs.map(job => (
          <Card key={job.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-sm">{job.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {job.margin > 15 ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-600/20" variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" /> Profitable
                    </Badge>
                  ) : job.margin >= 0 ? (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-600/20" variant="outline">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Break-even
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 border-red-600/20" variant="outline">
                      <TrendingDown className="h-3 w-3 mr-1" /> Losing Money
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{job.status}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold tabular-nums ${job.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(job.profit)}</p>
                <p className="text-xs text-muted-foreground">profit</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-sm font-semibold tabular-nums">{fmt(job.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-sm font-semibold tabular-nums">{fmt(job.cost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margin</p>
                <p className={`text-sm font-semibold tabular-nums ${job.margin >= 20 ? 'text-green-600' : job.margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                  {job.margin.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Budget consumption bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Budget used</span>
                <span className={job.budgetPct > 100 ? 'text-red-600 font-medium' : ''}>{job.budgetPct.toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(job.budgetPct, 100)} className="h-2" />
            </div>
          </Card>
        ))}
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-green-600" /> Top 5 Most Profitable
          </h3>
          <div className="space-y-2">
            {data.top5.map((j, i) => (
              <div key={j.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium truncate max-w-[160px]">{j.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-600 tabular-nums">{fmt(j.profit)}</span>
                  <span className="text-xs text-muted-foreground ml-2">{j.margin.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertOctagon className="h-4 w-4 text-red-600" /> Bottom 5 Least Profitable
          </h3>
          <div className="space-y-2">
            {data.bottom5.map((j, i) => (
              <div key={j.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium truncate max-w-[160px]">{j.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold tabular-nums ${j.profit >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{fmt(j.profit)}</span>
                  <span className="text-xs text-muted-foreground ml-2">{j.margin.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cost breakdown pie */}
      {data.pieData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" /> Where Is Money Going?
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={data.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {data.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {data.pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{d.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </InteractiveReportShell>
  );
}
