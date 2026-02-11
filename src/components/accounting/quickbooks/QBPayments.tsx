/**
 * QBPayments — Payment analysis with interactive drill-down.
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBPayments } from "@/hooks/useQuickBooksQuery";
import { TrendingUp, DollarSign, CreditCard, Users, ChevronRight } from "lucide-react";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBPayments() {
  const { data: payments, isLoading, error } = useQBPayments();
  const [searchTerm, setSearchTerm] = useState("");
  const { openPanel } = useDrillDown();

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

  const handlePaymentClick = (p: any) => {
    openPanel({
      type: "qb-record",
      title: `Payment · ${p.CustomerRef?.name || "Unknown"}`,
      data: { record: p, recordType: "qb-payment" },
    });
  };

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
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <InteractiveMetricCard
              title="Total Received"
              value={fmt(metrics.totalReceived)}
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              variant="success"
            />
            <InteractiveMetricCard
              title="Payment Count"
              value={String(metrics.count)}
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            />
            <InteractiveMetricCard
              title="Avg Payment"
              value={fmt(metrics.avgPayment)}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <InteractiveMetricCard
              title="Top Customer"
              value={metrics.topCustomer}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

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
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((p: any) => (
                      <TableRow key={p.Id} className="cursor-pointer hover:bg-muted/50 transition-colors group" onClick={() => handlePaymentClick(p)}>
                        <TableCell>{fmtDate(p.TxnDate)}</TableCell>
                        <TableCell>{p.CustomerRef?.name || "Unknown"}</TableCell>
                        <TableCell><Badge variant="outline">{p.PaymentMethodRef?.name || "Other"}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((p: any) => (
                  <button key={p.Id} className="p-3 min-h-[56px] w-full text-left hover:bg-muted/50 transition-colors" onClick={() => handlePaymentClick(p)}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{p.CustomerRef?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(p.TxnDate)} · {p.PaymentMethodRef?.name || "Other"}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums flex-shrink-0 text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</p>
                    </div>
                  </button>
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
