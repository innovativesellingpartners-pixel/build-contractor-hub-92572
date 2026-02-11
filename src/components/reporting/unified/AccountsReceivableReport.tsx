/**
 * AccountsReceivableReport — AR aging, outstanding invoices, collection metrics.
 * Combines myCT1 invoices + QB aging report data.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBAgingReport } from "@/hooks/useQuickBooksQuery";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ReportMetricCard } from "./ReportMetricCard";
import { ReportEmptyState } from "./ReportEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function AccountsReceivableReport() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });

  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-ar", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const { data: qbAging } = useQBAgingReport("AgedReceivableDetail", !!qbConnected);

  const { data: arData, isLoading } = useQuery({
    queryKey: ["ar-report", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount_due, amount_paid, status, due_date, created_at, customer_id, customers(name)")
        .eq("user_id", user.id)
        .neq("status", "paid")
        .order("due_date", { ascending: true });

      const invoices = data || [];
      const now = new Date();

      // Aging buckets
      const buckets = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      invoices.forEach((inv) => {
        const balance = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0));
        if (!inv.due_date) { buckets.current += balance; return; }
        const days = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) buckets.current += balance;
        else if (days <= 30) buckets["1-30"] += balance;
        else if (days <= 60) buckets["31-60"] += balance;
        else if (days <= 90) buckets["61-90"] += balance;
        else buckets["90+"] += balance;
      });

      const totalOutstanding = Object.values(buckets).reduce((s, v) => s + v, 0);
      const overdueAmount = buckets["1-30"] + buckets["31-60"] + buckets["61-90"] + buckets["90+"];

      return {
        invoices,
        buckets,
        totalOutstanding,
        overdueAmount,
        invoiceCount: invoices.length,
        agingChart: [
          { name: "Current", amount: buckets.current },
          { name: "1-30 Days", amount: buckets["1-30"] },
          { name: "31-60 Days", amount: buckets["31-60"] },
          { name: "61-90 Days", amount: buckets["61-90"] },
          { name: "90+ Days", amount: buckets["90+"] },
        ],
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Accounts Receivable</h2>
          <p className="text-sm text-muted-foreground">Money owed to you — aging and collection</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard title="Total Outstanding" value={fmt(arData?.totalOutstanding || 0)} subtitle={`${arData?.invoiceCount || 0} invoices`} icon={<FileText className="h-4 w-4 text-blue-600" />} variant="info" />
        <ReportMetricCard title="Overdue" value={fmt(arData?.overdueAmount || 0)} subtitle="Past due date" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} variant="danger" />
        <ReportMetricCard title="Current" value={fmt(arData?.buckets?.current || 0)} subtitle="Not yet due" icon={<Clock className="h-4 w-4 text-green-600" />} variant="success" />
        <ReportMetricCard title="90+ Days" value={fmt(arData?.buckets?.["90+"] || 0)} subtitle="Critically overdue" icon={<AlertTriangle className="h-4 w-4 text-red-700" />} variant="danger" />
      </div>

      {/* Aging chart */}
      {arData?.agingChart && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Aging Summary</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={arData.agingChart}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" name="Outstanding" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Invoice table */}
      {arData?.invoices && arData.invoices.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Outstanding Invoices</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arData.invoices.slice(0, 50).map((inv: any) => {
                    const balance = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0));
                    const isOverdue = inv.due_date && new Date(inv.due_date) < new Date();
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number || "—"}</TableCell>
                        <TableCell>{(inv.customers as any)?.name || "—"}</TableCell>
                        <TableCell className={isOverdue ? "text-red-600" : ""}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(Number(inv.amount_due || 0))}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(balance)}</TableCell>
                        <TableCell><Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">{isOverdue ? "Overdue" : inv.status || "Open"}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReportEmptyState title="No outstanding invoices" description="All invoices are paid — great work!" />
      )}
    </div>
  );
}
