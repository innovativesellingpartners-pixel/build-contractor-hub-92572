/**
 * AccountsReceivableReport — AR aging with full drill-down interactivity.
 * Clickable aging buckets, interactive chart bars, and clickable invoice rows.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBAgingReport } from "@/hooks/useQuickBooksQuery";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveTable, TableColumn } from "../drilldown/InteractiveTable";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { ReportEmptyState } from "./ReportEmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function AccountsReceivableReport() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time", start: "2000-01-01", end: new Date().toISOString().split("T")[0] });

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
          { name: "Current", amount: buckets.current, minDays: undefined, maxDays: 0 },
          { name: "1-30 Days", amount: buckets["1-30"], minDays: 1, maxDays: 30 },
          { name: "31-60 Days", amount: buckets["31-60"], minDays: 31, maxDays: 60 },
          { name: "61-90 Days", amount: buckets["61-90"], minDays: 61, maxDays: 90 },
          { name: "90+ Days", amount: buckets["90+"], minDays: 91, maxDays: undefined },
        ],
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const AGING_COLORS = ["hsl(142,76%,36%)", "hsl(217,91%,60%)", "hsl(38,92%,50%)", "hsl(25,95%,53%)", "hsl(0,84%,60%)"];

  const handleBucketClick = (bucket: any) => {
    openPanel({
      type: "ar-aging",
      title: `${bucket.name} Invoices`,
      data: { bucket: bucket.name, minDays: bucket.minDays, maxDays: bucket.maxDays, totalAmount: bucket.amount },
    });
  };

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
    { key: "due_date", label: "Due Date", render: (row) => {
      const isOverdue = row.due_date && new Date(row.due_date) < new Date();
      return <span className={isOverdue ? "text-red-600" : ""}>{row.due_date ? new Date(row.due_date).toLocaleDateString() : "—"}</span>;
    }},
    { key: "amount_due", label: "Amount", align: "right", render: (row) => fmt(Number(row.amount_due || 0)) },
    { key: "balance", label: "Balance", align: "right", render: (row) => {
      const bal = Math.max(0, Number(row.amount_due || 0) - Number(row.amount_paid || 0));
      return <span className="font-medium">{fmt(bal)}</span>;
    }},
    { key: "status", label: "Status", render: (row) => {
      const isOverdue = row.due_date && new Date(row.due_date) < new Date();
      return <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">{isOverdue ? "Overdue" : row.status || "Open"}</Badge>;
    }},
  ];

  return (
    <InteractiveReportShell
      title="Accounts Receivable"
      subtitle="Money owed to you — aging and collection"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard
          title="Total Outstanding"
          value={fmt(arData?.totalOutstanding || 0)}
          subtitle={`${arData?.invoiceCount || 0} invoices`}
          icon={<FileText className="h-4 w-4 text-blue-600" />}
          variant="info"
          onClick={() => openPanel({ type: "ar-aging", title: "All Outstanding", data: { bucket: "All Outstanding", minDays: 0 } })}
        />
        <InteractiveMetricCard
          title="Overdue"
          value={fmt(arData?.overdueAmount || 0)}
          subtitle="Past due date"
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          variant="danger"
          onClick={() => openPanel({ type: "ar-aging", title: "Overdue Invoices", data: { bucket: "Overdue", minDays: 1 } })}
        />
        <InteractiveMetricCard
          title="Current"
          value={fmt(arData?.buckets?.current || 0)}
          subtitle="Not yet due"
          icon={<Clock className="h-4 w-4 text-green-600" />}
          variant="success"
          onClick={() => openPanel({ type: "ar-aging", title: "Current Invoices", data: { bucket: "Current", maxDays: 0 } })}
        />
        <InteractiveMetricCard
          title="90+ Days"
          value={fmt(arData?.buckets?.["90+"] || 0)}
          subtitle="Critically overdue"
          icon={<AlertTriangle className="h-4 w-4 text-red-700" />}
          variant="danger"
          onClick={() => openPanel({ type: "ar-aging", title: "90+ Day Invoices", data: { bucket: "90+ Days", minDays: 91 } })}
        />
      </div>

      {/* Aging chart — clickable bars */}
      {arData?.agingChart && (
        <Card className="p-6 border-border">
          <h3 className="text-sm font-semibold mb-1">Aging Summary</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Click any bar to see invoices in that bucket</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={arData.agingChart} onClick={(e) => {
              if (e?.activePayload?.[0]?.payload) handleBucketClick(e.activePayload[0].payload);
            }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                formatter={(v: number) => fmt(v)}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }}
              />
              <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]} className="cursor-pointer">
                {arData.agingChart.map((_, i) => (
                  <Cell key={i} fill={AGING_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Invoice table — clickable rows with deep-link cells */}
      {arData?.invoices && arData.invoices.length > 0 ? (
        <InteractiveTable
          title="Outstanding Invoices"
          data={arData.invoices}
          columns={invoiceColumns}
          onRowClick={(row) => openPanel({
            type: "invoice",
            title: `Invoice ${row.invoice_number || "#—"}`,
            data: { ...row, customer_name: (row.customers as any)?.name },
          })}
          searchKeys={["invoice_number"]}
          searchPlaceholder="Search invoices..."
        />
      ) : (
        <ReportEmptyState title="No outstanding invoices" description="All invoices are paid — great work!" />
      )}
    </InteractiveReportShell>
  );
}
