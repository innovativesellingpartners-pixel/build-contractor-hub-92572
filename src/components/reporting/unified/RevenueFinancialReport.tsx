/**
 * RevenueFinancialReport — Unified revenue view combining myCT1 payments + QB invoices.
 * Shows total revenue by source, by customer, invoice status, payment trends.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBProfitAndLoss, useQBPayments } from "@/hooks/useQuickBooksQuery";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ReportMetricCard } from "./ReportMetricCard";
import { ReportEmptyState } from "./ReportEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, FileText, CreditCard } from "lucide-react";
import { RevenueProfitChart } from "@/components/reporting/RevenueProfitChart";
import { PaymentsTable } from "@/components/reporting/PaymentsTable";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

function extractTotal(rows: any[], groupName: string): number {
  const group = rows?.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

export function RevenueFinancialReport() {
  const { user } = useAuth();
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
      let payQ = supabase.from("payments").select("id, amount, payment_date, payment_method").eq("contractor_id", user.id);
      let invQ = supabase.from("invoices").select("id, amount_due, amount_paid, status, customer_id, created_at").eq("user_id", user.id);
      if (dateRange.start) { payQ = payQ.gte("payment_date", dateRange.start); invQ = invQ.gte("created_at", dateRange.start); }
      if (dateRange.end) { payQ = payQ.lte("payment_date", dateRange.end); invQ = invQ.lte("created_at", dateRange.end); }
      const [payments, invoices] = await Promise.all([payQ, invQ]);
      const pay = payments.data || [];
      const inv = invoices.data || [];
      const totalPaid = pay.reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding = inv.reduce((s, i) => s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0);
      const overdue = inv.filter(i => i.status === "overdue").reduce((s, i) => s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0);
      return { totalPaid, outstanding, overdue, invoiceCount: inv.length, paymentCount: pay.length };
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Revenue & Financial</h2>
          <p className="text-sm text-muted-foreground">Unified revenue view across all sources</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard title="Total Revenue" value={fmt(totalRevenue)} subtitle={qbConnected ? `myCT1: ${fmt(nativeRevenue?.totalPaid || 0)} · QB: ${fmt(qbIncome)}` : "From payments"} icon={<DollarSign className="h-4 w-4 text-green-600" />} variant="success" />
        <ReportMetricCard title="Outstanding" value={fmt(nativeRevenue?.outstanding || 0)} subtitle={`${nativeRevenue?.invoiceCount || 0} invoices`} icon={<FileText className="h-4 w-4 text-orange-500" />} variant="warning" />
        <ReportMetricCard title="Overdue" value={fmt(nativeRevenue?.overdue || 0)} subtitle="Past due invoices" icon={<FileText className="h-4 w-4 text-red-500" />} variant="danger" />
        <ReportMetricCard title="Payments" value={String(nativeRevenue?.paymentCount || 0)} subtitle="Transactions received" icon={<CreditCard className="h-4 w-4 text-blue-600" />} variant="info" />
      </div>

      {/* Revenue trend chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue & Profit Trend</h3>
        <RevenueProfitChart filters={filters} />
      </Card>

      {/* QB Payments */}
      {qbConnected && qbPayments && qbPayments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent QB Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qbPayments.slice(0, 10).map((p: any) => (
                <div key={p.Id} className="flex justify-between items-center text-sm">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium truncate">{p.CustomerRef?.name || "Payment"}</p>
                    <p className="text-xs text-muted-foreground">{p.TxnDate ? new Date(p.TxnDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <p className="font-semibold tabular-nums text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments table */}
      <PaymentsTable filters={filters} />
    </div>
  );
}
