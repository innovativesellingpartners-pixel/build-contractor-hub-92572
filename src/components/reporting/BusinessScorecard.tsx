import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, Briefcase, Percent, FileText, Receipt, Clock,
  TrendingUp, Users, Star, AlertTriangle, ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, startOfYear, differenceInDays } from "date-fns";

type DatePreset = "mtd" | "qtd" | "ytd" | "12m" | "custom";

function getDateRange(preset: DatePreset) {
  const now = new Date();
  switch (preset) {
    case "mtd": return { from: startOfMonth(now), to: now };
    case "qtd": return { from: startOfQuarter(now), to: now };
    case "ytd": return { from: startOfYear(now), to: now };
    case "12m":
    default: return { from: subMonths(now, 12), to: now };
  }
}

interface ScorecardProps {
  onNavigateToReport?: (section: string) => void;
}

export function BusinessScorecard({ onNavigateToReport }: ScorecardProps) {
  const [preset, setPreset] = useState<DatePreset>("ytd");
  const range = useMemo(() => getDateRange(preset), [preset]);
  const fromISO = range.from.toISOString();
  const toISO = range.to.toISOString();

  // ── Revenue from payments ──
  const { data: payments = [] } = useQuery({
    queryKey: ["scorecard-payments", fromISO, toISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("net_amount, created_at")
        .eq("status", "succeeded")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);
      return data || [];
    },
  });

  // ── Active jobs ──
  const { data: activeJobs = [] } = useQuery({
    queryKey: ["scorecard-active-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, contract_value, expenses_total, payments_collected, created_at, job_status")
        .in("job_status", ["in_progress", "scheduled", "not_started"]);
      return data || [];
    },
  });

  // ── Estimates (close rate) ──
  const { data: estimates = [] } = useQuery({
    queryKey: ["scorecard-estimates", fromISO, toISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("estimates")
        .select("id, status, total_amount, sent_at, signed_at, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);
      return data || [];
    },
  });

  // ── Invoices (receivables) ──
  const { data: invoices = [] } = useQuery({
    queryKey: ["scorecard-invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, total_amount, amount_paid, status, due_date, paid_at, created_at, invoice_number");
      return data || [];
    },
  });

  // ── Leads (12mo trend) ──
  const { data: leads = [] } = useQuery({
    queryKey: ["scorecard-leads-12m"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, created_at")
        .gte("created_at", subMonths(new Date(), 12).toISOString());
      return data || [];
    },
  });

  // ── Reviews ──
  const { data: reviews = [] } = useQuery({
    queryKey: ["scorecard-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, submitted_at")
        .not("submitted_at", "is", null);
      return data || [];
    },
  });

  // ── Review requests pending ──
  const { data: pendingReviewRequests = [] } = useQuery({
    queryKey: ["scorecard-pending-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("review_requests")
        .select("id")
        .eq("status", "pending");
      return data || [];
    },
  });

  // ── Job cost alerts ──
  const { data: marginWarnings = [] } = useQuery({
    queryKey: ["scorecard-margin-warnings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_cost_alerts")
        .select("id, job_id, message")
        .eq("is_read", false)
        .in("alert_type", ["margin_warning", "over_budget"]);
      return data || [];
    },
  });

  // ── Expiring docs ──
  const { data: expiringDocs = [] } = useQuery({
    queryKey: ["scorecard-expiring-docs"],
    queryFn: async () => {
      const sixtyDays = new Date();
      sixtyDays.setDate(sixtyDays.getDate() + 60);
      const { data } = await supabase
        .from("contractor_documents")
        .select("id, file_name, expires_at, document_category")
        .not("expires_at", "is", null)
        .lte("expires_at", sixtyDays.toISOString())
        .gte("expires_at", new Date().toISOString());
      return data || [];
    },
  });

  // ══ Computed metrics ══

  const revenue = payments.reduce((s: number, p: any) => s + Number(p.net_amount || 0), 0);

  const jobMargins = activeJobs.map((j: any) => {
    const cv = Number(j.contract_value || 0);
    const exp = Number(j.expenses_total || 0);
    return cv > 0 ? ((cv - exp) / cv) * 100 : 0;
  });
  const avgMargin = jobMargins.length ? jobMargins.reduce((a, b) => a + b, 0) / jobMargins.length : 0;

  const sentEstimates = estimates.filter((e: any) => ["sent", "signed", "approved", "accepted", "declined", "expired"].includes(e.status));
  const wonEstimates = estimates.filter((e: any) => ["signed", "approved", "accepted"].includes(e.status));
  const closeRate = sentEstimates.length > 0 ? (wonEstimates.length / sentEstimates.length) * 100 : 0;

  const unpaidInvoices = invoices.filter((i: any) => i.status !== "paid" && i.status !== "void");
  const receivables = unpaidInvoices.reduce((s: number, i: any) => s + (Number(i.total_amount || 0) - Number(i.amount_paid || 0)), 0);

  const paidInvoices = invoices.filter((i: any) => i.paid_at && i.created_at);
  const avgDaysToPayment = paidInvoices.length
    ? paidInvoices.reduce((s: number, i: any) => s + differenceInDays(new Date(i.paid_at), new Date(i.created_at)), 0) / paidInvoices.length
    : 0;

  const awaitingEstimates = estimates.filter((e: any) => e.status === "sent");
  const overdueInvoices = unpaidInvoices.filter((i: any) => i.due_date && differenceInDays(new Date(), new Date(i.due_date)) > 30);
  const overdueTotal = overdueInvoices.reduce((s: number, i: any) => s + (Number(i.total_amount || 0) - Number(i.amount_paid || 0)), 0);

  // ── Sparkline data builders ──
  function buildMonthly(items: any[], dateKey: string, valueKey?: string) {
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months[format(d, "MMM")] = 0;
    }
    items.forEach((item: any) => {
      const m = format(new Date(item[dateKey]), "MMM");
      if (m in months) months[m] += valueKey ? Number(item[valueKey] || 0) : 1;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }

  const revenueSparkline = buildMonthly(payments, "created_at", "net_amount");
  const leadSparkline = buildMonthly(leads, "created_at");
  const marginSparkline = (() => {
    // simplified: use all jobs grouped by created_at month
    const months: Record<string, { cv: number; exp: number }> = {};
    for (let i = 11; i >= 0; i--) {
      months[format(subMonths(new Date(), i), "MMM")] = { cv: 0, exp: 0 };
    }
    activeJobs.forEach((j: any) => {
      const m = format(new Date(j.created_at), "MMM");
      if (m in months) {
        months[m].cv += Number(j.contract_value || 0);
        months[m].exp += Number(j.expenses_total || 0);
      }
    });
    return Object.entries(months).map(([name, { cv, exp }]) => ({
      name,
      value: cv > 0 ? Math.round(((cv - exp) / cv) * 100) : 0,
    }));
  })();

  const reviewSparkline = (() => {
    const months: Record<string, { sum: number; count: number }> = {};
    for (let i = 11; i >= 0; i--) {
      months[format(subMonths(new Date(), i), "MMM")] = { sum: 0, count: 0 };
    }
    reviews.forEach((r: any) => {
      if (!r.submitted_at) return;
      const m = format(new Date(r.submitted_at), "MMM");
      if (m in months) { months[m].sum += r.rating; months[m].count++; }
    });
    return Object.entries(months).map(([name, { sum, count }]) => ({
      name,
      value: count > 0 ? +(sum / count).toFixed(1) : 0,
    }));
  })();

  const nav = (section: string) => onNavigateToReport?.(section);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Business Scorecard</h2>
          <p className="text-xs text-muted-foreground">Executive KPI overview</p>
        </div>
        <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="qtd">Quarter to Date</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="12m">Trailing 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ═══ TOP ROW — Key Metrics ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Revenue" value={`$${(revenue / 1000).toFixed(1)}k`} sub={preset.toUpperCase()} icon={DollarSign} color="text-green-400" onClick={() => nav("revenue")} />
        <MetricCard label="Active Jobs" value={activeJobs.length.toString()} icon={Briefcase} color="text-blue-400" onClick={() => nav("jobs")} />
        <MetricCard label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} icon={Percent} color={avgMargin >= 20 ? "text-green-400" : avgMargin >= 10 ? "text-yellow-400" : "text-red-400"} onClick={() => nav("expenses")} />
        <MetricCard label="Close Rate" value={`${closeRate.toFixed(0)}%`} sub={`${wonEstimates.length}/${sentEstimates.length}`} icon={FileText} color="text-purple-400" onClick={() => nav("sales")} />
        <MetricCard label="Receivables" value={`$${(receivables / 1000).toFixed(1)}k`} sub={`${unpaidInvoices.length} unpaid`} icon={Receipt} color="text-orange-400" onClick={() => nav("ar")} />
        <MetricCard label="Avg Days to Pay" value={Math.round(avgDaysToPayment).toString()} sub="days" icon={Clock} color="text-cyan-400" onClick={() => nav("ar")} />
      </div>

      {/* ═══ MIDDLE ROW — Sparklines ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SparklineCard title="Monthly Revenue" data={revenueSparkline} color="hsl(var(--primary))" prefix="$" onClick={() => nav("revenue")} />
        <SparklineCard title="Lead Volume" data={leadSparkline} color="#8b5cf6" onClick={() => nav("sales")} />
        <SparklineCard title="Job Margin %" data={marginSparkline} color="#22c55e" suffix="%" onClick={() => nav("expenses")} />
        <SparklineCard title="Avg Review Rating" data={reviewSparkline} color="#f59e0b" onClick={() => nav("dashboard")} />
      </div>

      {/* ═══ BOTTOM ROW — Action Items ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <ActionCard
          label="Estimates Awaiting"
          count={awaitingEstimates.length}
          icon={FileText}
          variant={awaitingEstimates.length > 0 ? "warning" : "ok"}
          onClick={() => nav("sales")}
        />
        <ActionCard
          label="Overdue > 30 Days"
          count={overdueInvoices.length}
          sub={overdueTotal > 0 ? `$${overdueTotal.toLocaleString()}` : undefined}
          icon={Receipt}
          variant={overdueInvoices.length > 0 ? "danger" : "ok"}
          onClick={() => nav("ar")}
        />
        <ActionCard
          label="Expiring Docs"
          count={expiringDocs.length}
          sub="within 60 days"
          icon={AlertTriangle}
          variant={expiringDocs.length > 0 ? "warning" : "ok"}
          onClick={() => nav("dashboard")}
        />
        <ActionCard
          label="Margin Warnings"
          count={marginWarnings.length}
          icon={TrendingUp}
          variant={marginWarnings.length > 0 ? "danger" : "ok"}
          onClick={() => nav("jobs")}
        />
        <ActionCard
          label="Pending Reviews"
          count={pendingReviewRequests.length}
          icon={Star}
          variant={pendingReviewRequests.length > 3 ? "warning" : "ok"}
          onClick={() => nav("dashboard")}
        />
      </div>
    </div>
  );
}

// ── Metric Card ──
function MetricCard({ label, value, sub, icon: Icon, color, onClick }: {
  label: string; value: string; sub?: string; icon: any; color: string; onClick?: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="text-xl font-bold tracking-tight">{value}</div>
        <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
        {sub && <div className="text-[9px] text-muted-foreground/70">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ── Sparkline Card ──
function SparklineCard({ title, data, color, prefix, suffix, onClick }: {
  title: string; data: { name: string; value: number }[]; color: string; prefix?: string; suffix?: string; onClick?: () => void;
}) {
  const latest = data[data.length - 1]?.value ?? 0;
  const prev = data[data.length - 2]?.value ?? 0;
  const trend = prev > 0 ? ((latest - prev) / prev) * 100 : 0;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${trend >= 0 ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30"}`}>
            {trend >= 0 ? "↑" : "↓"}{Math.abs(trend).toFixed(0)}%
          </Badge>
        </div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" hide />
              <Tooltip
                contentStyle={{ fontSize: 10, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                formatter={(v: number) => [`${prefix || ""}${v.toLocaleString()}${suffix || ""}`, title]}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Action Card ──
function ActionCard({ label, count, sub, icon: Icon, variant, onClick }: {
  label: string; count: number; sub?: string; icon: any; variant: "ok" | "warning" | "danger"; onClick?: () => void;
}) {
  const bg = variant === "danger" ? "border-red-500/30 bg-red-500/5" : variant === "warning" ? "border-yellow-500/30 bg-yellow-500/5" : "border-border";
  const countColor = variant === "danger" ? "text-red-400" : variant === "warning" ? "text-yellow-400" : "text-foreground";

  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${bg}`} onClick={onClick}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className={`text-lg font-bold ${countColor}`}>{count}</div>
          <div className="text-[10px] text-muted-foreground truncate">{label}</div>
          {sub && <div className="text-[9px] text-muted-foreground/70">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default BusinessScorecard;
