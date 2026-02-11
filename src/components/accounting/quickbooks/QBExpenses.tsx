/**
 * QBExpenses — Expense/Purchase analysis with metric cards and filters.
 * Fetches Purchase entities from QuickBooks API.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQBExpenses } from "@/hooks/useQuickBooksQuery";
import { TrendingDown, Receipt, Store, CreditCard } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBExpenses() {
  const { data: expenses, isLoading, error } = useQBExpenses();
  const [searchTerm, setSearchTerm] = useState("");

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

    // Top vendor
    const vendorMap: Record<string, number> = {};
    all.forEach((e: any) => {
      const name = e.EntityRef?.name || "Unknown";
      vendorMap[name] = (vendorMap[name] || 0) + parseFloat(e.TotalAmt || "0");
    });
    const topVendor = Object.entries(vendorMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    // Top category
    const catMap: Record<string, number> = {};
    all.forEach((e: any) => {
      const cat = e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "Uncategorized";
      catMap[cat] = (catMap[cat] || 0) + parseFloat(e.TotalAmt || "0");
    });
    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { totalSpend, avgTransaction, topVendor, topCategory };
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Expenses & Purchases</h3>
        <p className="text-sm text-muted-foreground">Spend analysis from your connected accounting</p>
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
          {/* Metric Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums text-destructive">{fmt(metrics.totalSpend)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{fmt(metrics.avgTransaction)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Vendor</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-base font-semibold truncate">{metrics.topVendor}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-base font-semibold truncate">{metrics.topCategory}</div></CardContent>
            </Card>
          </div>

          {/* Search filter */}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((e: any) => (
                      <TableRow key={e.Id}>
                        <TableCell>{fmtDate(e.TxnDate)}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{e.EntityRef?.name || "Unknown"}</TableCell>
                        <TableCell className="truncate max-w-[120px]">{e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "—"}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{e.PrivateNote || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-destructive">{fmt(parseFloat(e.TotalAmt || "0"))}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((e: any) => (
                  <div key={e.Id} className="p-3 min-h-[56px]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{e.EntityRef?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(e.TxnDate)} · {e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "—"}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums flex-shrink-0 text-destructive">{fmt(parseFloat(e.TotalAmt || "0"))}</p>
                    </div>
                  </div>
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
