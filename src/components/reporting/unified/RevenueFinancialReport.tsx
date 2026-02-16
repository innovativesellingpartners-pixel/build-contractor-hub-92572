/**
 * RevenueFinancialReport — Unified revenue view with full drill-down interactivity.
 * All metrics, charts, and lists support click → detail panel.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBProfitAndLoss, useQBPayments } from "@/hooks/useQuickBooksQuery";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveTable, TableColumn } from "../drilldown/InteractiveTable";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, FileText, CreditCard } from "lucide-react";
import { RevenueProfitChart } from "@/components/reporting/RevenueProfitChart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "../charts/ChartCard";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

function extractTotal(rows: any[], groupName: string): number {
  const group = rows?.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

export function RevenueFinancialReport() {
  const { user } = useAuth();
  const { openPanel, pushLevel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "ytd", start: `${new Date().getFullYear()}-01-01`, end: new Date().toISOString().split("T")[0] });

  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-rev", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const qbRange = { start: dateRange.start || `${new Date().getFullYear()}-01-01`, end: dateRange.end || new Date().toISOString().split("T")[0] };
  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(qbRange, !!qbConnected);
  const { data: qbPayments } = useQBPayments(!!qbConnected);

  const { data: nativeRevenue, isLoading } = useQuery({
    queryKey: ["revenue-report", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let payQ = supabase.from("payments").select("id, amount, payment_date, payment_method, invoice_id, job_id").eq("contractor_id", user.id);
      let invQ = supabase.from("invoices").select("id, invoice_number, amount_due, amount_paid, status, customer_id, created_at, due_date, customers(name)").eq("user_id", user.id);
      if (dateRange.start) { payQ = payQ.gte("payment_date", dateRange.start); invQ = invQ.gte("created_at", dateRange.start); }
      if (dateRange.end) { payQ = payQ.lte("payment_date", dateRange.end); invQ = invQ.lte("created_at", dateRange.end); }
      const [payments, invoices] = await Promise.all([payQ, invQ]);
      const pay = payments.data || [];
      const inv = invoices.data || [];
      const totalPaid = pay.reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding = inv.reduce((s, i) => s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0);
      const overdue = inv.filter(i => i.status === "overdue" || (i.due_date && new Date(i.due_date) < new Date() && i.status !== "paid"))
        .reduce((s, i) => s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0);
      // Monthly revenue trend
      const monthlyRev: Record<string, number> = {};
      pay.forEach(p => {
        const month = (p.payment_date || "").substring(0, 7);
        if (month) monthlyRev[month] = (monthlyRev[month] || 0) + Number(p.amount || 0);
      });
      const revenueTrend = Object.entries(monthlyRev)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month: month.substring(5), revenue }));

      return { totalPaid, outstanding, overdue, invoiceCount: inv.length, paymentCount: pay.length, invoices: inv, payments: pay, revenueTrend };
    },
    enabled: !!user?.id,
  });

  const filters = {
    dateRange: dateRange.preset === "ytd" ? "this_year" : dateRange.preset === "all_time" ? "all_time" : dateRange.preset,
    dateFrom: dateRange.start,
    dateTo: dateRange.end,
  };

  const qbIncome = pnl ? extractTotal(pnl.rows, "Income") : 0;
  const loading = isLoading || (qbConnected && pnlLoading);

  if (loading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const totalRevenue = (nativeRevenue?.totalPaid || 0) + qbIncome;

  const invoiceColumns: TableColumn<any>[] = [
    { key: "invoice_number", label: "Invoice #", render: (row) => <span className="font-medium">{row.invoice_number || "—"}</span> },
    { key: "customer_name", label: "Customer", render: (row) => (
      <Button
        variant="link"
        className="p-0 h-auto text-sm text-primary"
        onClick={(e) => {
          e.stopPropagation();
          if (row.customer_id) openPanel({ type: "customer", title: (row.customers as any)?.name || "Customer", data: { id: row.customer_id, name: (row.customers as any)?.name } });
        }}
      >
        {(row.customers as any)?.name || "—"}
      </Button>
    )},
    { key: "amount_due", label: "Amount", align: "right", render: (row) => fmt(Number(row.amount_due || 0)) },
    { key: "balance", label: "Balance", align: "right", render: (row) => {
      const bal = Math.max(0, Number(row.amount_due || 0) - Number(row.amount_paid || 0));
      return <span className={bal > 0 ? "text-red-600 font-medium" : "text-green-600"}>{fmt(bal)}</span>;
    }},
    { key: "status", label: "Status", render: (row) => {
      const isOverdue = row.due_date && new Date(row.due_date) < new Date() && row.status !== "paid";
      return <Badge variant={isOverdue ? "destructive" : row.status === "paid" ? "default" : "outline"} className="text-xs">{isOverdue ? "Overdue" : row.status || "Open"}</Badge>;
    }},
  ];

  return (
    <InteractiveReportShell
      title="Revenue & Financial"
      subtitle="Unified revenue view across all sources"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard
          title="Total Revenue"
          value={fmt(totalRevenue)}
          subtitle={qbConnected ? `myCT1: ${fmt(nativeRevenue?.totalPaid || 0)} · QB: ${fmt(qbIncome)}` : "From payments"}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
          variant="success"
          onClick={() => openPanel({ type: "category-breakdown", title: "Revenue Breakdown", data: { category: "Revenue", type: "revenue", totalAmount: totalRevenue } })}
          breakdown={[
            { label: "myCT1 Payments", value: fmt(nativeRevenue?.totalPaid || 0) },
            ...(qbConnected ? [{ label: "QB Income", value: fmt(qbIncome) }] : []),
          ]}
        />
        <InteractiveMetricCard
          title="Outstanding"
          value={fmt(nativeRevenue?.outstanding || 0)}
          subtitle={`${nativeRevenue?.invoiceCount || 0} invoices`}
          icon={<FileText className="h-4 w-4 text-orange-500" />}
          variant="warning"
          onClick={() => openPanel({ type: "ar-aging", title: "Outstanding Invoices", data: { bucket: "All Outstanding", minDays: 0 } })}
        />
        <InteractiveMetricCard
          title="Overdue"
          value={fmt(nativeRevenue?.overdue || 0)}
          subtitle="Past due invoices"
          icon={<FileText className="h-4 w-4 text-red-500" />}
          variant="danger"
          onClick={() => openPanel({ type: "ar-aging", title: "Overdue Invoices", data: { bucket: "Overdue", minDays: 1 } })}
        />
        <InteractiveMetricCard
          title="Payments"
          value={String(nativeRevenue?.paymentCount || 0)}
          subtitle="Transactions received"
          icon={<CreditCard className="h-4 w-4 text-blue-600" />}
          variant="info"
          onClick={() => {
            const firstPayment = nativeRevenue?.payments?.[0];
            if (firstPayment) openPanel({ type: "payment", title: "Payment Details", data: firstPayment });
          }}
          breakdown={[{ label: "Total Received", value: fmt(nativeRevenue?.totalPaid || 0) }, { label: "Count", value: String(nativeRevenue?.paymentCount || 0) }]}
        />
      </div>

      {/* Revenue trend charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Revenue & Profit Trend" emptyMessage="No revenue data for the selected period.">
          <RevenueProfitChart filters={filters} />
        </ChartCard>
        <ChartCard
          title="Monthly Revenue"
          isEmpty={!nativeRevenue?.revenueTrend || nativeRevenue.revenueTrend.length < 2}
          emptyMessage="Not enough payment data to chart monthly revenue."
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={nativeRevenue?.revenueTrend || []}>
              <defs>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" fill="url(#revAreaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* QB Payments — clickable */}
      {qbConnected && qbPayments && qbPayments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent QB Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {qbPayments.slice(0, 10).map((p: any) => (
                <Button
                  key={p.Id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                  onClick={() => openPanel({ type: "payment", title: "Payment Details", data: { amount: parseFloat(p.TotalAmt || "0"), payment_date: p.TxnDate, payment_method: "QB Payment" } })}
                >
                  <div className="min-w-0 flex-1 mr-3 text-left">
                    <p className="font-medium truncate">{p.CustomerRef?.name || "Payment"}</p>
                    <p className="text-xs text-muted-foreground">{p.TxnDate ? new Date(p.TxnDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <p className="font-semibold tabular-nums text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice table — clickable rows */}
      {nativeRevenue?.invoices && nativeRevenue.invoices.length > 0 && (
        <InteractiveTable
          title="Invoices"
          data={nativeRevenue.invoices}
          columns={invoiceColumns}
          onRowClick={(row) => openPanel({
            type: "invoice",
            title: `Invoice ${row.invoice_number || "#—"}`,
            data: { ...row, customer_name: (row.customers as any)?.name },
          })}
          searchKeys={["invoice_number"]}
          searchPlaceholder="Search invoices..."
        />
      )}
    </InteractiveReportShell>
  );
}
