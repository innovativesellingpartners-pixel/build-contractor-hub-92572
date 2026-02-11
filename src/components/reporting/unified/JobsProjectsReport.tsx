/**
 * JobsProjectsReport — Operational performance analytics for jobs.
 * Shows active/completed jobs, profitability, timeline analysis.
 * Reuses existing JobProfitability and JobsTable components.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ReportMetricCard } from "./ReportMetricCard";
import { JobProfitability } from "@/components/reporting/JobProfitability";
import { JobsTable } from "@/components/reporting/JobsTable";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function JobsProjectsReport() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });

  const filters = {
    dateRange: dateRange.preset === "ytd" ? "this_year" : dateRange.preset === "all_time" ? "all_time" : dateRange.preset,
    dateFrom: dateRange.start,
    dateTo: dateRange.end,
  };

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["jobs-report-metrics", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let q = supabase.from("jobs").select("id, job_status, budget_amount, actual_cost, created_at, trade_type").eq("user_id", user.id);
      if (dateRange.start) q = q.gte("created_at", dateRange.start);
      if (dateRange.end) q = q.lte("created_at", dateRange.end);
      const { data } = await q;
      const jobs = data || [];

      const active = jobs.filter(j => j.job_status === "in_progress");
      const completed = jobs.filter(j => j.job_status === "completed");
      const totalRev = jobs.reduce((s, j) => s + Number(j.budget_amount || 0), 0);
      const totalCost = jobs.reduce((s, j) => s + Number(j.actual_cost || 0), 0);
      const avgValue = jobs.length > 0 ? totalRev / jobs.length : 0;
      const margin = totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0;

      // By trade type
      const byType = jobs.reduce((acc, j) => {
        const t = j.trade_type || "Other";
        if (!acc[t]) acc[t] = { count: 0, revenue: 0, cost: 0 };
        acc[t].count++;
        acc[t].revenue += Number(j.budget_amount || 0);
        acc[t].cost += Number(j.actual_cost || 0);
        return acc;
      }, {} as Record<string, { count: number; revenue: number; cost: number }>);

      const byTypeData = Object.entries(byType).map(([name, d]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        jobs: d.count,
        revenue: d.revenue,
        margin: d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);

      return { total: jobs.length, active: active.length, completed: completed.length, totalRev, totalCost, avgValue, margin, byTypeData };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Jobs & Projects</h2>
          <p className="text-sm text-muted-foreground">Operational performance analytics</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard title="Total Jobs" value={String(metrics?.total || 0)} subtitle={`${metrics?.active || 0} active`} icon={<Briefcase className="h-4 w-4 text-blue-600" />} variant="info" />
        <ReportMetricCard title="Completed" value={String(metrics?.completed || 0)} subtitle="Jobs finished" icon={<CheckCircle className="h-4 w-4 text-green-600" />} variant="success" />
        <ReportMetricCard title="Total Revenue" value={fmt(metrics?.totalRev || 0)} subtitle={`Avg: ${fmt(metrics?.avgValue || 0)}`} icon={<TrendingUp className="h-4 w-4 text-green-600" />} variant="success" />
        <ReportMetricCard title="Gross Margin" value={`${(metrics?.margin || 0).toFixed(1)}%`} subtitle={`Cost: ${fmt(metrics?.totalCost || 0)}`} icon={<Clock className="h-4 w-4 text-primary" />} variant="default" />
      </div>

      {/* By job type chart */}
      {metrics?.byTypeData && metrics.byTypeData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Job Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.byTypeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => fmt(value)}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Profitability table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Job Profitability</h3>
        <JobProfitability filters={filters} />
      </Card>

      {/* Jobs table */}
      <JobsTable filters={filters} />
    </div>
  );
}
