/**
 * QBExpenses — Expense/Purchase analysis with interactive drill-down.
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBExpenses } from "@/hooks/useQuickBooksQuery";
import { TrendingDown, Receipt, Store, CreditCard, ChevronRight, ArrowLeftRight } from "lucide-react";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";
import { ExpenseAssignmentDialog } from "../expense-assignment";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBExpenses() {
  const { data: expenses, isLoading, error } = useQBExpenses();
  const [searchTerm, setSearchTerm] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const { openPanel } = useDrillDown();

  const filtered = useMemo(() => {
    if (!expenses) return [];
    if (!searchTerm) return expenses as any[];
    const term = searchTerm.toLowerCase();
    return (expenses as any[]).filter((e: any) =>
      (e.EntityRef?.name || "").toLowerCase().includes(term) ||
      (e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "").toLowerCase().includes(term)
    );
  }, [expenses, searchTerm]);

  const metrics = useMemo(() => {
    if (!expenses) return { totalSpend: 0, avgTransaction: 0, topVendor: "—", topCategory: "—" };
    const all = expenses as any[];
    const totalSpend = all.reduce((s: number, e: any) => s + parseFloat(e.TotalAmt || "0"), 0);
    const avgTransaction = all.length > 0 ? totalSpend / all.length : 0;

    const vendorMap: Record<string, number> = {};
    all.forEach((e: any) => {
      const name = e.EntityRef?.name || "Unknown";
      vendorMap[name] = (vendorMap[name] || 0) + parseFloat(e.TotalAmt || "0");
    });
    const topVendor = Object.entries(vendorMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const catMap: Record<string, number> = {};
    all.forEach((e: any) => {
      const cat = e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "Uncategorized";
      catMap[cat] = (catMap[cat] || 0) + parseFloat(e.TotalAmt || "0");
    });
    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { totalSpend, avgTransaction, topVendor, topCategory };
  }, [expenses]);

  const handleExpenseClick = (e: any) => {
    openPanel({
      type: "qb-record",
      title: `Expense · ${e.EntityRef?.name || "Unknown"}`,
      data: { record: e, recordType: "qb-expense" },
    });
  };

  return (
    <div className="space-y-4">
      <ExpenseAssignmentDialog open={assignOpen} onOpenChange={setAssignOpen} />
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Expenses & Purchases</h3>
          <p className="text-sm text-muted-foreground">Spend analysis from your connected accounting</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)} className="gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Assign to Jobs
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your expense data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <InteractiveMetricCard
              title="Total Spend"
              value={fmt(metrics.totalSpend)}
              icon={<TrendingDown className="h-4 w-4 text-destructive" />}
              variant="danger"
            />
            <InteractiveMetricCard
              title="Avg Transaction"
              value={fmt(metrics.avgTransaction)}
              icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
            />
            <InteractiveMetricCard
              title="Top Vendor"
              value={metrics.topVendor}
              icon={<Store className="h-4 w-4 text-muted-foreground" />}
            />
            <InteractiveMetricCard
              title="Top Category"
              value={metrics.topCategory}
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Input placeholder="Search vendor or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:max-w-xs" />

          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Memo</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((e: any) => (
                      <TableRow key={e.Id} className="cursor-pointer hover:bg-muted/50 transition-colors group" onClick={() => handleExpenseClick(e)}>
                        <TableCell>{fmtDate(e.TxnDate)}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{e.EntityRef?.name || "Unknown"}</TableCell>
                        <TableCell className="truncate max-w-[120px]">{e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "—"}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{e.PrivateNote || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-destructive">{fmt(parseFloat(e.TotalAmt || "0"))}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((e: any) => (
                  <button key={e.Id} className="p-3 min-h-[56px] w-full text-left hover:bg-muted/50 transition-colors" onClick={() => handleExpenseClick(e)}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{e.EntityRef?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(e.TxnDate)} · {e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "—"}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums flex-shrink-0 text-destructive">{fmt(parseFloat(e.TotalAmt || "0"))}</p>
                    </div>
                  </button>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No expenses found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
