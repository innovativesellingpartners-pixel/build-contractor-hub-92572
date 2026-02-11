/**
 * AccountsPayableReport — AP report with full drill-down interactivity.
 * Clickable metric cards, vendor rows, and bill rows open detail panels.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBAgingReport, useQBBills, useQBVendors } from "@/hooks/useQuickBooksQuery";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveTable, TableColumn } from "../drilldown/InteractiveTable";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { ReportEmptyState } from "./ReportEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Clock, AlertTriangle, FileText } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function AccountsPayableReport() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time", start: "2000-01-01", end: new Date().toISOString().split("T")[0] });

  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-ap", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const { data: qbBills, isLoading: billsLoading } = useQBBills(!!qbConnected);
  const { data: qbVendors } = useQBVendors(!!qbConnected);
  const { data: qbAging } = useQBAgingReport("AgedPayableDetail", !!qbConnected);

  const { data: nativeAP, isLoading } = useQuery({
    queryKey: ["ap-report", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let q = supabase.from("expenses").select("id, amount, category, date, description, notes, job_id").eq("contractor_id", user.id);
      if (dateRange.start) q = q.gte("date", dateRange.start);
      if (dateRange.end) q = q.lte("date", dateRange.end);
      q = q.order("date", { ascending: false });
      const { data } = await q;
      const total = (data || []).reduce((s, e) => s + Number(e.amount || 0), 0);
      return { expenses: data || [], total };
    },
    enabled: !!user?.id,
  });

  const loading = isLoading || (qbConnected && billsLoading);
  if (loading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const totalBillsAmount = qbBills?.reduce((s: number, b: any) => s + parseFloat(b.Balance || b.TotalAmt || "0"), 0) || 0;

  const billColumns: TableColumn<any>[] = [
    { key: "VendorRef", label: "Vendor", render: (row) => (
      <Button
        variant="link"
        className="p-0 h-auto text-sm text-primary"
        onClick={(e) => {
          e.stopPropagation();
          openPanel({ type: "vendor", title: row.VendorRef?.name || "Vendor", data: { name: row.VendorRef?.name, DisplayName: row.VendorRef?.name } });
        }}
      >
        {row.VendorRef?.name || "—"}
      </Button>
    )},
    { key: "DueDate", label: "Due Date", render: (row) => {
      const isOverdue = row.DueDate && new Date(row.DueDate) < new Date();
      return <span className={isOverdue ? "text-red-600" : ""}>{row.DueDate ? new Date(row.DueDate).toLocaleDateString() : "—"}</span>;
    }},
    { key: "TotalAmt", label: "Amount", align: "right", render: (row) => fmt(parseFloat(row.TotalAmt || "0")) },
    { key: "Balance", label: "Balance", align: "right", render: (row) => <span className="font-medium">{fmt(parseFloat(row.Balance || "0"))}</span> },
    { key: "status", label: "Status", render: (row) => {
      const isOverdue = row.DueDate && new Date(row.DueDate) < new Date();
      return <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">{isOverdue ? "Overdue" : "Open"}</Badge>;
    }},
  ];

  const expenseColumns: TableColumn<any>[] = [
    { key: "description", label: "Description", render: (row) => <span className="font-medium">{row.description || row.category || "—"}</span> },
    { key: "category", label: "Category", render: (row) => <Badge variant="outline" className="text-xs">{row.category}</Badge> },
    { key: "date", label: "Date", render: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—" },
    { key: "amount", label: "Amount", align: "right", render: (row) => <span className="font-medium tabular-nums text-red-600">{fmt(Number(row.amount || 0))}</span> },
  ];

  return (
    <InteractiveReportShell
      title="Accounts Payable"
      subtitle="Money you owe — bills and vendor obligations"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {qbConnected && (
          <>
            <InteractiveMetricCard title="Outstanding Bills" value={fmt(totalBillsAmount)} subtitle={`${qbBills?.length || 0} bills`} icon={<FileText className="h-4 w-4 text-red-600" />} variant="danger"
              onClick={() => { const first = qbBills?.[0]; if (first) openPanel({ type: "expense", title: `Bill - ${first.VendorRef?.name || "Vendor"}`, data: { amount: parseFloat(first.TotalAmt || "0"), date: first.DueDate, description: first.VendorRef?.name, category: "Bill" } }); }}
              breakdown={[{ label: "Bills", value: String(qbBills?.length || 0) }, { label: "Total", value: fmt(totalBillsAmount) }]}
            />
            <InteractiveMetricCard
              title="Vendors"
              value={String(qbVendors?.length || 0)}
              subtitle="From connected accounting"
              icon={<Store className="h-4 w-4 text-blue-600" />}
              variant="info"
              onClick={() => { const first = qbVendors?.[0]; if (first) openPanel({ type: "vendor", title: first.DisplayName, data: first }); }}
            />
          </>
        )}
        <InteractiveMetricCard
          title="myCT1 Expenses"
          value={fmt(nativeAP?.total || 0)}
          subtitle={`${nativeAP?.expenses.length || 0} transactions`}
          icon={<Clock className="h-4 w-4 text-orange-500" />}
          variant="warning"
          onClick={() => openPanel({ type: "category-breakdown", title: "All Expenses", data: { category: "All", type: "expense", totalAmount: nativeAP?.total } })}
        />
      </div>

      {/* QB Bills — clickable rows */}
      {qbConnected && qbBills && qbBills.length > 0 ? (
        <InteractiveTable
          title="Outstanding Bills (QB)"
          data={qbBills.slice(0, 50)}
          columns={billColumns}
          onRowClick={(row) => openPanel({
            type: "expense",
            title: `Bill - ${row.VendorRef?.name || "Vendor"}`,
            data: { amount: parseFloat(row.TotalAmt || "0"), date: row.DueDate, description: row.VendorRef?.name, category: "Bill" },
          })}
          searchKeys={["VendorRef"]}
        />
      ) : !qbConnected ? (
        <ReportEmptyState
          title="Connect accounting for AP data"
          description="Connect your accounting software to see outstanding bills and vendor obligations."
        />
      ) : (
        <ReportEmptyState title="No outstanding bills" description="All bills are paid up." />
      )}

      {/* myCT1 Expenses — clickable rows */}
      {nativeAP?.expenses && nativeAP.expenses.length > 0 && (
        <InteractiveTable
          title="myCT1 Expenses"
          data={nativeAP.expenses.slice(0, 50)}
          columns={expenseColumns}
          onRowClick={(row) => openPanel({ type: "expense", title: "Expense Details", data: row })}
          searchKeys={["description", "category"]}
          searchPlaceholder="Search expenses..."
        />
      )}
    </InteractiveReportShell>
  );
}
