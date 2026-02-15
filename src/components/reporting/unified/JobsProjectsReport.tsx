/**
 * JobsProjectsReport — Jobs report with full drill-down interactivity.
 * Clickable metrics, chart bars, and job rows open detail panels.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveTable, TableColumn } from "../drilldown/InteractiveTable";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { JobProfitability } from "@/components/reporting/JobProfitability";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DonutChart } from "../charts/DonutChart";
import { GaugeChart } from "../charts/GaugeChart";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function JobsProjectsReport() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time", start: "2000-01-01", end: new Date().toISOString().split("T")[0] });

  const filters = {
    dateRange: dateRange.preset === "ytd" ? "this_year" : dateRange.preset === "all_time" ? "all_time" : dateRange.preset,
    dateFrom: dateRange.start,
    dateTo: dateRange.end,
  };

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["jobs-report-metrics", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let q = supabase.from("jobs").select("id, job_status, budget_amount, actual_cost, created_at, trade_type, name, customer_id").eq("user_id", user.id);
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

      // Job status distribution
      const statusCounts: Record<string, number> = {};
      jobs.forEach(j => {
        const s = j.job_status || "pending";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        value,
      }));

      return { total: jobs.length, active: active.length, completed: completed.length, totalRev, totalCost, avgValue, margin, byTypeData, jobsList: jobs, statusData };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const jobColumns: TableColumn<any>[] = [
    { key: "name", label: "Job Name", render: (row) => <span className="font-medium">{row.name || "—"}</span> },
    { key: "job_status", label: "Status", render: (row) => {
      const colors: Record<string, string> = { in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" };
      return <Badge className={colors[row.job_status] || ""} variant="outline">{row.job_status || "—"}</Badge>;
    }},
    { key: "trade_type", label: "Type", render: (row) => row.trade_type || "—" },
    { key: "budget_amount", label: "Revenue", align: "right", render: (row) => fmt(Number(row.budget_amount || 0)) },
    { key: "margin", label: "Margin", align: "right", render: (row) => {
      const rev = Number(row.budget_amount || 0);
      const cost = Number(row.actual_cost || 0);
      const m = rev > 0 ? ((rev - cost) / rev) * 100 : 0;
      return <span className={m >= 20 ? "text-green-600" : m >= 10 ? "text-yellow-600" : "text-red-600"}>{m.toFixed(1)}%</span>;
    }},
  ];

  return (
    <InteractiveReportShell
      title="Jobs & Projects"
      subtitle="Operational performance analytics"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard title="Total Jobs" value={String(metrics?.total || 0)} subtitle={`${metrics?.active || 0} active`} icon={<Briefcase className="h-4 w-4 text-blue-600" />} variant="info"
          onClick={() => openPanel({ type: "category-breakdown", title: `All Jobs · ${metrics?.total || 0} total`, data: { category: "Jobs", type: "revenue", totalAmount: metrics?.totalRev || 0 } })}
          breakdown={[{ label: "Active", value: String(metrics?.active || 0) }, { label: "Completed", value: String(metrics?.completed || 0) }]}
        />
        <InteractiveMetricCard title="Completed" value={String(metrics?.completed || 0)} subtitle="Jobs finished" icon={<CheckCircle className="h-4 w-4 text-green-600" />} variant="success"
          onClick={() => {
            const completed = metrics?.jobsList?.filter((j: any) => j.job_status === "completed") || [];
            if (completed.length > 0) openPanel({ type: "job", title: completed[0].name || "Completed Job", data: completed[0] });
          }}
        />
        <InteractiveMetricCard title="Total Revenue" value={fmt(metrics?.totalRev || 0)} subtitle={`Avg: ${fmt(metrics?.avgValue || 0)}`} icon={<TrendingUp className="h-4 w-4 text-green-600" />} variant="success"
          onClick={() => openPanel({ type: "category-breakdown", title: "Job Revenue Breakdown", data: { category: "Job Revenue", type: "revenue", totalAmount: metrics?.totalRev || 0 } })}
          breakdown={[{ label: "Total Jobs", value: String(metrics?.total || 0) }, { label: "Avg Value", value: fmt(metrics?.avgValue || 0) }]}
        />
        <InteractiveMetricCard title="Gross Margin" value={`${(metrics?.margin || 0).toFixed(1)}%`} subtitle={`Cost: ${fmt(metrics?.totalCost || 0)}`} icon={<Clock className="h-4 w-4 text-primary" />} variant="default"
          onClick={() => openPanel({ type: "category-breakdown", title: "Cost Breakdown", data: { category: "All", type: "cost", totalAmount: metrics?.totalCost || 0 } })}
          breakdown={[{ label: "Revenue", value: fmt(metrics?.totalRev || 0) }, { label: "Total Cost", value: fmt(metrics?.totalCost || 0) }, { label: "Profit", value: fmt((metrics?.totalRev || 0) - (metrics?.totalCost || 0)) }]}
        />
      </div>

      {/* By job type chart — clickable bars */}
      {metrics?.byTypeData && metrics.byTypeData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1">Revenue by Job Type</h3>
          <p className="text-xs text-muted-foreground mb-4">Click a bar to filter jobs by type</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.byTypeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => fmt(value)}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} className="cursor-pointer"
                onClick={(data: any) => {
                  if (data?.name) {
                    const filtered = metrics?.jobsList?.filter((j: any) => (j.trade_type || "Other").toLowerCase() === data.name.toLowerCase()) || [];
                    if (filtered.length > 0) openPanel({ type: "category-breakdown", title: `${data.name} Jobs · ${filtered.length} total`, data: { category: data.name, type: "revenue", totalAmount: data.revenue } });
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Job Status Donut + Margin Gauge */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {metrics?.statusData && metrics.statusData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-3">Job Status Distribution</h3>
            <DonutChart
              data={metrics.statusData}
              centerValue={String(metrics.total || 0)}
              centerLabel="Total Jobs"
              height={240}
              colors={["hsl(217,91%,60%)", "hsl(142,76%,36%)", "hsl(45,93%,47%)", "hsl(0,84%,60%)", "hsl(262,83%,58%)"]}
            />
          </Card>
        )}
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-3">Gross Margin</h3>
          <div className="flex justify-center">
            <GaugeChart
              value={metrics?.margin || 0}
              target={30}
              label="Overall Gross Margin"
            />
          </div>
        </Card>
      </div>

      {/* Profitability table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Job Profitability</h3>
        <JobProfitability filters={filters} />
      </Card>

      {/* Jobs table — clickable rows */}
      {metrics?.jobsList && metrics.jobsList.length > 0 && (
        <InteractiveTable
          title="All Jobs"
          data={metrics.jobsList}
          columns={jobColumns}
          onRowClick={(row) => openPanel({
            type: "job",
            title: row.name || "Job",
            data: row,
          })}
          searchKeys={["name", "trade_type"]}
          searchPlaceholder="Search jobs..."
        />
      )}
    </InteractiveReportShell>
  );
}
