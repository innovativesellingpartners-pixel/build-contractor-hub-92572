/**
 * AccountsPayableReport — AP aging, outstanding bills (QB data primarily).
 * Shows vendor payables, aging, upcoming payments.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBAgingReport, useQBBills, useQBVendors } from "@/hooks/useQuickBooksQuery";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ReportMetricCard } from "./ReportMetricCard";
import { ReportEmptyState } from "./ReportEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Clock, AlertTriangle, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function AccountsPayableReport() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });

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

  // myCT1 expenses as a proxy for AP
  const { data: nativeAP, isLoading } = useQuery({
    queryKey: ["ap-report", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let q = supabase.from("expenses").select("id, amount, category, date, description, notes").eq("contractor_id", user.id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Accounts Payable</h2>
          <p className="text-sm text-muted-foreground">Money you owe — bills and vendor obligations</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {qbConnected && (
          <>
            <ReportMetricCard title="Outstanding Bills" value={fmt(totalBillsAmount)} subtitle={`${qbBills?.length || 0} bills`} icon={<FileText className="h-4 w-4 text-red-600" />} variant="danger" />
            <ReportMetricCard title="Vendors" value={String(qbVendors?.length || 0)} subtitle="From connected accounting" icon={<Store className="h-4 w-4 text-blue-600" />} variant="info" />
          </>
        )}
        <ReportMetricCard title="myCT1 Expenses" value={fmt(nativeAP?.total || 0)} subtitle={`${nativeAP?.expenses.length || 0} transactions`} icon={<Clock className="h-4 w-4 text-orange-500" />} variant="warning" />
      </div>

      {/* QB Bills table */}
      {qbConnected && qbBills && qbBills.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Outstanding Bills (QB)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qbBills.slice(0, 50).map((bill: any) => {
                    const isOverdue = bill.DueDate && new Date(bill.DueDate) < new Date();
                    return (
                      <TableRow key={bill.Id}>
                        <TableCell className="font-medium">{bill.VendorRef?.name || "—"}</TableCell>
                        <TableCell className={isOverdue ? "text-red-600" : ""}>{bill.DueDate ? new Date(bill.DueDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(parseFloat(bill.TotalAmt || "0"))}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(bill.Balance || "0"))}</TableCell>
                        <TableCell><Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">{isOverdue ? "Overdue" : "Open"}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : !qbConnected ? (
        <ReportEmptyState
          title="Connect accounting for AP data"
          description="Connect your accounting software to see outstanding bills and vendor obligations."
        />
      ) : (
        <ReportEmptyState title="No outstanding bills" description="All bills are paid up." />
      )}
    </div>
  );
}
