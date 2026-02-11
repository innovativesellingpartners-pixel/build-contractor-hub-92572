/**
 * UnifiedDashboard — Executive summary combining myCT1 native + QB data.
 * Shows revenue, pipeline health, project metrics, financial health, and customer insights.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors, useQBPayments } from "@/hooks/useQuickBooksQuery";
import { ReportMetricCard } from "./ReportMetricCard";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ReportEmptyState } from "./ReportEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, TrendingDown, FileText, Briefcase, Users, BarChart3,
  Target, ArrowRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "ytd", start: `${new Date().getFullYear()}-01-01`, end: new Date().toISOString().split("T")[0] });

  // Check QB connection
  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-report", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  // QB data
  const qbRange = { start: dateRange.start || `${new Date().getFullYear()}-01-01`, end: dateRange.end || new Date().toISOString().split("T")[0] };
  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(qbRange, !!qbConnected);
  const { data: qbCustomers } = useQBCustomers(!!qbConnected);
  const { data: qbVendors } = useQBVendors(!!qbConnected);

  // myCT1 native data
  const { data: nativeData, isLoading: nativeLoading } = useQuery({
    queryKey: ["unified-dashboard", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;

      let estimatesQ = supabase.from("estimates").select("id, status, total_amount, created_at").eq("user_id", user.id);
      let jobsQ = supabase.from("jobs").select("id, job_status, budget_amount, actual_cost, created_at, name").eq("user_id", user.id);
      let leadsQ = supabase.from("leads").select("id, created_at").eq("user_id", user.id);
      let customersQ = supabase.from("customers").select("id, name, created_at, lifetime_value").eq("user_id", user.id);
      let invoicesQ = supabase.from("invoices").select("id, amount_due, amount_paid, status, created_at").eq("user_id", user.id);
      let paymentsQ = supabase.from("payments").select("id, amount, payment_date").eq("contractor_id", user.id);

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
      const avgJobValue = jb.length > 0 ? totalJobRevenue / jb.length : 0;

      const myCT1Revenue = pay.reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstandingAR = inv.reduce((s, i) => s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0);

      // Status breakdown for funnel
      const estimateStatuses = est.reduce((acc, e) => {
        const s = e.status || "draft";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top customers by lifetime value
      const topCustomers = [...cust]
        .sort((a, b) => Number(b.lifetime_value || 0) - Number(a.lifetime_value || 0))
        .slice(0, 5);

      return {
        leads: ld.length,
        estimates: est.length,
        totalEstimateValue,
        conversionRate,
        activeJobs: activeJobs.length,
        completedJobs: completedJobs.length,
        totalJobs: jb.length,
        totalJobRevenue,
        avgJobValue,
        myCT1Revenue,
        outstandingAR,
        customers: cust.length,
        topCustomers,
        estimateStatuses,
        newCustomers: cust.length,
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

  // Pipeline funnel data
  const funnelData = [
    { name: "Leads", value: d?.leads || 0 },
    { name: "Estimates", value: d?.estimates || 0 },
    { name: "Customers", value: d?.customers || 0 },
    { name: "Jobs", value: d?.totalJobs || 0 },
  ];

  const COLORS = ["hsl(217,91%,60%)", "hsl(271,91%,65%)", "hsl(142,76%,36%)", "hsl(25,95%,53%)"];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Business overview from all data sources
            {qbConnected && <Badge variant="outline" className="ml-2 text-xs">QB Connected</Badge>}
          </p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Revenue metrics */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          title="Total Revenue"
          value={fmt(totalRevenue)}
          subtitle={qbConnected ? `myCT1: ${fmt(d?.myCT1Revenue || 0)} · QB: ${fmt(qbIncome)}` : "From payments"}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
          variant="success"
        />
        {qbConnected && (
          <ReportMetricCard
            title="Total Expenses"
            value={fmt(qbExpenses)}
            subtitle="From connected accounting"
            icon={<TrendingDown className="h-4 w-4 text-red-600" />}
            variant="danger"
          />
        )}
        <ReportMetricCard
          title={qbConnected ? "Net Income" : "Pipeline Value"}
          value={qbConnected ? fmt(qbNet) : fmt(d?.totalEstimateValue || 0)}
          subtitle={qbConnected ? "Revenue minus expenses" : `${d?.estimates || 0} estimates`}
          icon={qbConnected ? <TrendingUp className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-blue-600" />}
          variant={qbConnected ? (qbNet >= 0 ? "success" : "danger") : "info"}
        />
        <ReportMetricCard
          title="Outstanding AR"
          value={fmt(d?.outstandingAR || 0)}
          subtitle="Unpaid invoices"
          icon={<FileText className="h-4 w-4 text-orange-500" />}
          variant="warning"
        />
        <ReportMetricCard
          title="Conversion Rate"
          value={pct(d?.conversionRate || 0)}
          subtitle={`${d?.estimates || 0} estimates → jobs`}
          icon={<Target className="h-4 w-4 text-primary" />}
          variant="default"
        />
        <ReportMetricCard
          title="Active Jobs"
          value={String(d?.activeJobs || 0)}
          subtitle={`${d?.completedJobs || 0} completed`}
          icon={<Briefcase className="h-4 w-4 text-blue-600" />}
          variant="info"
        />
        <ReportMetricCard
          title="Avg Job Value"
          value={fmt(d?.avgJobValue || 0)}
          subtitle={`${d?.totalJobs || 0} total jobs`}
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          variant="default"
        />
        <ReportMetricCard
          title="Customers"
          value={String(d?.customers || 0)}
          subtitle="Total customers"
          icon={<Users className="h-4 w-4 text-green-600" />}
          variant="success"
        />
      </div>

      {/* Pipeline funnel + Top customers */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 py-4">
              {funnelData.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <div className="text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: COLORS[i] }}
                    >
                      {stage.value}
                    </div>
                    <p className="text-xs font-medium mt-1.5">{stage.name}</p>
                  </div>
                  {i < funnelData.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {d?.topCustomers && d.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {d.topCustomers.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center text-sm">
                    <span className="truncate mr-3">{c.name}</span>
                    <span className="tabular-nums font-medium flex-shrink-0">{fmt(Number(c.lifetime_value || 0))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No customer data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QB Customers + Vendors (if connected) */}
      {qbConnected && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> QB Customers</CardTitle></CardHeader>
            <CardContent>
              {qbCustomers?.length ? (
                <div className="space-y-2">
                  {qbCustomers.slice(0, 5).map((c: any) => (
                    <div key={c.Id} className="flex justify-between items-center text-sm">
                      <span className="truncate mr-3">{c.DisplayName}</span>
                      <span className="tabular-nums font-medium">{fmt(parseFloat(c.Balance || "0"))}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> QB Vendors</CardTitle></CardHeader>
            <CardContent>
              {qbVendors?.length ? (
                <div className="space-y-2">
                  {qbVendors.slice(0, 5).map((v: any) => (
                    <div key={v.Id} className="flex justify-between items-center text-sm">
                      <span className="truncate mr-3">{v.DisplayName}</span>
                      <span className="tabular-nums font-medium">{fmt(parseFloat(v.Balance || "0"))}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
