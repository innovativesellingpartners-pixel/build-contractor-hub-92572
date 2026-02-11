/**
 * QBPayments — Payment analysis with metric cards and search.
 * Fetches Payment entities from QuickBooks API.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBPayments } from "@/hooks/useQuickBooksQuery";
import { TrendingUp, DollarSign, CreditCard, Users } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBPayments() {
  const { data: payments, isLoading, error } = useQBPayments();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!payments) return [];
    if (!searchTerm) return payments as any[];
    const term = searchTerm.toLowerCase();
    return (payments as any[]).filter((p: any) =>
      (p.CustomerRef?.name || "").toLowerCase().includes(term) ||
      (p.PaymentMethodRef?.name || "").toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  const metrics = useMemo(() => {
    if (!payments) return { totalReceived: 0, count: 0, avgPayment: 0, topCustomer: "—" };
    const all = payments as any[];
    const totalReceived = all.reduce((s: number, p: any) => s + parseFloat(p.TotalAmt || "0"), 0);
    const avgPayment = all.length > 0 ? totalReceived / all.length : 0;

    const custMap: Record<string, number> = {};
    all.forEach((p: any) => {
      const name = p.CustomerRef?.name || "Unknown";
      custMap[name] = (custMap[name] || 0) + parseFloat(p.TotalAmt || "0");
    });
    const topCustomer = Object.entries(custMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { totalReceived, count: all.length, avgPayment, topCustomer };
  }, [payments]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Payments Received</h3>
        <p className="text-sm text-muted-foreground">Customer payments from your connected accounting</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your payment data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums text-green-600">{fmt(metrics.totalReceived)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Count</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{metrics.count}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{fmt(metrics.avgPayment)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-base font-semibold truncate">{metrics.topCustomer}</div></CardContent>
            </Card>
          </div>

          {/* Search */}
          <Input placeholder="Search customer or method..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:max-w-xs" />

          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((p: any) => (
                      <TableRow key={p.Id}>
                        <TableCell>{fmtDate(p.TxnDate)}</TableCell>
                        <TableCell>{p.CustomerRef?.name || "Unknown"}</TableCell>
                        <TableCell><Badge variant="outline">{p.PaymentMethodRef?.name || "Other"}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((p: any) => (
                  <div key={p.Id} className="p-3 min-h-[56px]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{p.CustomerRef?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(p.TxnDate)} · {p.PaymentMethodRef?.name || "Other"}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums flex-shrink-0 text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No payments found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
