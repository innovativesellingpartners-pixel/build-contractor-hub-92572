/**
 * UnifiedDashboard — Executive summary combining myCT1 native + QB data.
 * All metric cards, charts, and lists are interactive with drill-down.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { exportJobsWithQBData } from "@/utils/reportExportUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors } from "@/hooks/useQuickBooksQuery";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, TrendingDown, FileText, Briefcase, Users, BarChart3,
  Target, ArrowRight, ExternalLink, Trophy, AlertOctagon, Gauge
} from "lucide-react";
import { GaugeChart } from "../charts/GaugeChart";
import { DonutChart } from "../charts/DonutChart";
import { BulletChart } from "../charts/BulletChart";
import { ChartCard } from "../charts/ChartCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const pct = (v: number) => `${v.toFixed(1)}%`;

function extractTotal(rows: any[], groupName: string): number {
  const group = rows?.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

export function UnifiedDashboard() {
  const { user } = useAuth();
  const { openPanel, navigateToReport, pushLevel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "ytd", start: `${new Date().getFullYear()}-01-01`, end: new Date().toISOString().split("T")[0] });

  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-report", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const qbRange = { start: dateRange.start || `${new Date().getFullYear()}-01-01`, end: dateRange.end || new Date().toISOString().split("T")[0] };
  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(qbRange, !!qbConnected);
  const { data: qbCustomers } = useQBCustomers(!!qbConnected);
  const { data: qbVendors } = useQBVendors(!!qbConnected);

  const { data: nativeData, isLoading: nativeLoading } = useQuery({
    queryKey: ["unified-dashboard", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;

      let estimatesQ = supabase.from("estimates").select("id, status, total_amount, created_at, title, client_name, customer_id").eq("user_id", user.id);
      let jobsQ = supabase.from("jobs").select("id, job_status, budget_amount, actual_cost, created_at, name, customer_id, trade_type").eq("user_id", user.id);
      let leadsQ = supabase.from("leads").select("id, created_at").eq("user_id", user.id);
      let customersQ = supabase.from("customers").select("id, name, created_at, lifetime_value, email, phone, company").eq("user_id", user.id);
      let invoicesQ = supabase.from("invoices").select("id, invoice_number, amount_due, amount_paid, status, created_at, due_date, customer_id").eq("user_id", user.id);
      let paymentsQ = supabase.from("payments").select("id, amount, payment_date, payment_method").eq("contractor_id", user.id);

      if (dateRange.start) {
        estimatesQ = estimatesQ.gte("created_at", dateRange.start);
        jobsQ = jobsQ.gte("created_at", dateRange.start);
        leadsQ = leadsQ.gte("created_at", dateRange.start);
        customersQ = customersQ.gte("created_at", dateRange.start);
        invoicesQ = invoicesQ.gte("created_at", dateRange.start);
        paymentsQ = paymentsQ.gte("payment_date", dateRange.start);
      }
      if (dateRange.end) {
        estimatesQ = estimatesQ.lte("created_at", dateRange.end);
        jobsQ = jobsQ.lte("created_at", dateRange.end);
        leadsQ = leadsQ.lte("created_at", dateRange.end);
        customersQ = customersQ.lte("created_at", dateRange.end);
        invoicesQ = invoicesQ.lte("created_at", dateRange.end);
        paymentsQ = paymentsQ.lte("payment_date", dateRange.end);
      }

      const [estimates, jobs, leads, customers, invoices, payments] = await Promise.all([
        estimatesQ, jobsQ, leadsQ, customersQ, invoicesQ, paymentsQ,
      ]);

      const est = estimates.data || [];
      const jb = jobs.data || [];
      const ld = leads.data || [];
      const cust = customers.data || [];
      const inv = invoices.data || [];
      const pay = payments.data || [];

      const totalEstimateValue = est.reduce((s, e) => s + Number(e.total_amount || 0), 0);
      const acceptedEstimates = est.filter(e => e.status === "accepted" || e.status === "sold");
      const conversionRate = est.length > 0 ? (acceptedEstimates.length / est.length) * 100 : 0;

      const activeJobs = jb.filter(j => j.job_status === "in_progress");
      const completedJobs = jb.filter(j => j.job_status === "completed");
      const totalJobRevenue = jb.reduce((s, j) => s + Number(j.budget_amount || 0), 0);
      const totalJobCost = jb.reduce((s, j) => s + Number(j.actual_cost || 0), 0);
      const avgJobValue = jb.length > 0 ? totalJobRevenue / jb.length : 0;

      const myCT1Revenue = pay.reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstandingAR = inv.reduce((s, i) => s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0);

      const topCustomers = [...cust]
        .sort((a, b) => Number(b.lifetime_value || 0) - Number(a.lifetime_value || 0))
        .slice(0, 5);

      const jobRankings = jb.map(j => {
        const budget = Number(j.budget_amount || 0);
        const cost = Number(j.actual_cost || 0);
        const profit = budget - cost;
        const margin = budget > 0 ? (profit / budget) * 100 : 0;
        return { id: j.id, name: j.name || 'Unnamed', profit, margin, budget, cost, status: j.job_status };
      }).sort((a, b) => b.profit - a.profit);

      const grossMargin = totalJobRevenue > 0 ? ((totalJobRevenue - totalJobCost) / totalJobRevenue) * 100 : 0;

      const activeJobBudgets = activeJobs.reduce((s, j) => s + Number(j.budget_amount || 0), 0);
      const activeJobCosts = activeJobs.reduce((s, j) => s + Number(j.actual_cost || 0), 0);
      const burnRate = activeJobs.length > 0 ? activeJobCosts / Math.max(activeJobs.length, 1) : 0;

      const statusCounts: Record<string, number> = {};
      jb.forEach(j => {
        const s = j.job_status || "pending";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const jobStatusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        value,
      }));

      const monthlyRevenue: Record<string, number> = {};
      pay.forEach(p => {
        const month = (p.payment_date || "").substring(0, 7);
        if (month) monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount || 0);
      });
      const revenueTrend = Object.entries(monthlyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month: month.substring(5), revenue }));

      return {
        leads: ld.length,
        estimates: est.length,
        estimatesList: est,
        totalEstimateValue,
        conversionRate,
        activeJobs: activeJobs.length,
        completedJobs: completedJobs.length,
        totalJobs: jb.length,
        jobsList: jb,
        totalJobRevenue,
        totalJobCost,
        avgJobValue,
        myCT1Revenue,
        outstandingAR,
        invoicesList: inv,
        customers: cust.length,
        customersList: cust,
        topCustomers,
        newCustomers: cust.length,
        jobRankings,
        grossMargin,
        activeJobBudgets,
        activeJobCosts,
        burnRate,
        jobStatusData,
        revenueTrend,
      };
    },
    enabled: !!user?.id,
  });

  const loading = nativeLoading || (qbConnected && pnlLoading);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const qbIncome = pnl ? extractTotal(pnl.rows, "Income") : 0;
  const qbExpenses = pnl ? extractTotal(pnl.rows, "Expenses") : 0;
  const qbNet = qbIncome - qbExpenses;

  const totalRevenue = (nativeData?.myCT1Revenue || 0) + qbIncome;
  const d = nativeData;

  const funnelData = [
    { name: "Leads", value: d?.leads || 0, onClick: () => navigateToReport("sales") },
    { name: "Estimates", value: d?.estimates || 0, onClick: () => navigateToReport("sales") },
    { name: "Customers", value: d?.customers || 0, onClick: () => navigateToReport("customers") },
    { name: "Jobs", value: d?.totalJobs || 0, onClick: () => navigateToReport("jobs") },
  ];

  const COLORS = ["hsl(217,91%,60%)", "hsl(271,91%,65%)", "hsl(142,76%,36%)", "hsl(25,95%,53%)"];

  return (
    <InteractiveReportShell
      title="Executive Dashboard"
      subtitle="Business overview from all data sources"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      badge={qbConnected ? <Badge variant="outline" className="text-xs font-normal">QB Connected</Badge> : undefined}
      onExportCSV={() => {
        if (d?.jobRankings) {
          exportJobsWithQBData(d.jobRankings);
        }
      }}
    >
      {/* Revenue metrics — all clickable */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard
          title="Total Revenue"
          value={fmt(totalRevenue)}
          subtitle={qbConnected ? `myCT1: ${fmt(d?.myCT1Revenue || 0)} · QB: ${fmt(qbIncome)}` : "From payments"}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
          variant="success"
          onClick={() => navigateToReport("revenue")}
          breakdown={[
            { label: "myCT1 Payments", value: fmt(d?.myCT1Revenue || 0) },
            ...(qbConnected ? [{ label: "QB Income", value: fmt(qbIncome) }] : []),
          ]}
        />
        {qbConnected && (
          <InteractiveMetricCard
            title="Total Expenses"
            value={fmt(qbExpenses)}
            subtitle="From connected accounting"
            icon={<TrendingDown className="h-4 w-4 text-red-600" />}
            variant="danger"
            onClick={() => navigateToReport("expenses")}
          />
        )}
        <InteractiveMetricCard
          title={qbConnected ? "Net Income" : "Pipeline Value"}
          value={qbConnected ? fmt(qbNet) : fmt(d?.totalEstimateValue || 0)}
          subtitle={qbConnected ? "Revenue minus expenses" : `${d?.estimates || 0} estimates`}
          icon={qbConnected ? <TrendingUp className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-blue-600" />}
          variant={qbConnected ? (qbNet >= 0 ? "success" : "danger") : "info"}
          onClick={() => navigateToReport(qbConnected ? "expenses" : "sales")}
        />
        <InteractiveMetricCard
          title="Outstanding AR"
          value={fmt(d?.outstandingAR || 0)}
          subtitle="Unpaid invoices"
          icon={<FileText className="h-4 w-4 text-orange-500" />}
          variant="warning"
          onClick={() => navigateToReport("ar")}
        />
        <InteractiveMetricCard
          title="Conversion Rate"
          value={pct(d?.conversionRate || 0)}
          subtitle={`${d?.estimates || 0} estimates → jobs`}
          icon={<Target className="h-4 w-4 text-primary" />}
          variant="default"
          onClick={() => navigateToReport("sales")}
        />
        <InteractiveMetricCard
          title="Active Jobs"
          value={String(d?.activeJobs || 0)}
          subtitle={`${d?.completedJobs || 0} completed`}
          icon={<Briefcase className="h-4 w-4 text-blue-600" />}
          variant="info"
          onClick={() => navigateToReport("jobs")}
        />
        <InteractiveMetricCard
          title="Avg Job Value"
          value={fmt(d?.avgJobValue || 0)}
          subtitle={`${d?.totalJobs || 0} total jobs`}
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          variant="default"
          onClick={() => navigateToReport("jobs")}
        />
        <InteractiveMetricCard
          title="Customers"
          value={String(d?.customers || 0)}
          subtitle="Total customers"
          icon={<Users className="h-4 w-4 text-green-600" />}
          variant="success"
          onClick={() => navigateToReport("customers")}
        />
      </div>

      {/* Pipeline funnel — clickable stages */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("sales")}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Sales Pipeline
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 py-4">
              {funnelData.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); stage.onClick(); }}
                    className="text-center group/stage cursor-pointer"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover/stage:scale-110 transition-transform"
                      style={{ backgroundColor: COLORS[i] }}
                    >
                      {stage.value}
                    </div>
                    <p className="text-xs font-medium mt-1.5 group-hover/stage:text-primary transition-colors">{stage.name}</p>
                  </button>
                  {i < funnelData.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers — clickable rows */}
        <Card className="border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("customers")}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Top Customers
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d?.topCustomers && d.topCustomers.length > 0 ? (
              <div className="space-y-1">
                {d.topCustomers.map((c: any) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPanel({
                        type: "customer",
                        title: c.name,
                        data: c,
                      });
                    }}
                  >
                    <span className="truncate mr-3">{c.name}</span>
                    <span className="tabular-nums font-medium flex-shrink-0">{fmt(Number(c.lifetime_value || 0))}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No customer data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QB Customers + Vendors — clickable rows */}
      {qbConnected && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("customers")}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> QB Customers
                <span className="ml-auto text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qbCustomers?.length ? (
                <div className="space-y-1">
                  {qbCustomers.slice(0, 5).map((c: any) => (
                    <Button
                      key={c.Id}
                      variant="ghost"
                      className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPanel({
                          type: "customer",
                          title: c.DisplayName,
                          data: { name: c.DisplayName, email: c.PrimaryEmailAddr?.Address },
                        });
                      }}
                    >
                      <span className="truncate mr-3">{c.DisplayName}</span>
                      <span className="tabular-nums font-medium">{fmt(parseFloat(c.Balance || "0"))}</span>
                    </Button>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
          <Card className="border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("ap")}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> QB Vendors
                <span className="ml-auto text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qbVendors?.length ? (
                <div className="space-y-1">
                  {qbVendors.slice(0, 5).map((v: any) => (
                    <Button
                      key={v.Id}
                      variant="ghost"
                      className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPanel({
                          type: "vendor",
                          title: v.DisplayName,
                          data: v,
                        });
                      }}
                    >
                      <span className="truncate mr-3">{v.DisplayName}</span>
                      <span className="tabular-nums font-medium">{fmt(parseFloat(v.Balance || "0"))}</span>
                    </Button>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job Rankings + Forecasting */}
      {d?.jobRankings && d.jobRankings.length > 0 && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Gross Margin Gauge */}
          <ChartCard
            title="Gross Margin"
            subtitle={`Rev: ${fmt(d.totalJobRevenue || 0)} · Cost: ${fmt(d.totalJobCost || 0)}`}
            icon={<Gauge className="h-4 w-4" />}
            isEmpty={!d.totalJobRevenue && !d.totalJobCost}
            emptyMessage="No job data to calculate gross margin."
            onClick={() => navigateToReport("jobs")}
          >
            <div className="flex justify-center">
              <GaugeChart
                value={d.grossMargin || 0}
                target={30}
                label="Gross Margin"
                onClick={() => navigateToReport("jobs")}
              />
            </div>
          </ChartCard>

          {/* Top Profitable */}
          <Card className="border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("jobs")}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-600" /> Top 5 Profitable
                <span className="ml-auto text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {d.jobRankings.slice(0, 5).map((j: any, i: number) => (
                  <Button key={j.id} variant="ghost" className="w-full justify-between text-sm h-auto py-1.5 px-2 hover:bg-muted"
                    onClick={(e) => { e.stopPropagation(); openPanel({ type: "job", title: j.name, data: j }); }}>
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="truncate">{j.name}</span>
                    </span>
                    <span className="text-green-600 font-medium tabular-nums">{fmt(j.profit)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Least Profitable */}
          <Card className="border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("jobs")}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-red-600" /> Bottom 5 Jobs
                <span className="ml-auto text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {[...d.jobRankings].reverse().slice(0, 5).map((j: any, i: number) => (
                  <Button key={j.id} variant="ghost" className="w-full justify-between text-sm h-auto py-1.5 px-2 hover:bg-muted"
                    onClick={(e) => { e.stopPropagation(); openPanel({ type: "job", title: j.name, data: j }); }}>
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="truncate">{j.name}</span>
                    </span>
                    <span className={`font-medium tabular-nums ${j.profit >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{fmt(j.profit)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job Status Donut + Monthly Revenue Trend */}
      {d && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <ChartCard
            title="Job Status Distribution"
            isEmpty={!d.jobStatusData || d.jobStatusData.length === 0}
            emptyMessage="No jobs found for the selected period."
            onClick={() => navigateToReport("jobs")}
          >
            <DonutChart
              data={d.jobStatusData}
              centerValue={String(d.totalJobs || 0)}
              centerLabel="Total Jobs"
              height={240}
              colors={["hsl(217,91%,60%)", "hsl(142,76%,36%)", "hsl(45,93%,47%)", "hsl(0,84%,60%)", "hsl(262,83%,58%)"]}
              onSegmentClick={(entry) => {
                openPanel({
                  type: "category-breakdown",
                  title: `${entry.name} Jobs · ${entry.value} total`,
                  data: { category: entry.name, type: "job-status", totalAmount: entry.value },
                });
              }}
            />
          </ChartCard>
          <ChartCard
            title="Monthly Revenue Trend"
            isEmpty={!d.revenueTrend || d.revenueTrend.length < 2}
            emptyMessage="Not enough payment data to show revenue trend."
            onClick={() => navigateToReport("revenue")}
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={d.revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number) => [fmt(value), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Active Jobs Budget vs Spent */}
      {d && d.activeJobs > 0 && (
        <Card className="p-6 border-border/60 cursor-pointer hover:shadow-md hover:border-border transition-all group" onClick={() => navigateToReport("jobs")}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Active Jobs Budget
            <span className="ml-auto text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
          </h3>
          <div className="space-y-3">
            <BulletChart
              actual={d.activeJobCosts || 0}
              target={d.activeJobBudgets || 0}
              label="Total Spend vs Budget"
              onClick={() => navigateToReport("jobs")}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-lg font-bold tabular-nums">{fmt(d.activeJobBudgets || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-lg font-bold tabular-nums text-red-600">{fmt(d.activeJobCosts || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold tabular-nums text-green-600">{fmt((d.activeJobBudgets || 0) - (d.activeJobCosts || 0))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Cost/Job</p>
                <p className="text-lg font-bold tabular-nums">{fmt(d.burnRate || 0)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </InteractiveReportShell>
  );
}
