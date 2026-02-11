/**
 * QBPayments — Shows both received payments AND credit card transactions (Purchases)
 * from QuickBooks with interactive drill-down.
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBPayments, useQBExpenses } from "@/hooks/useQuickBooksQuery";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, ChevronRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBPayments() {
  const { data: payments, isLoading: loadingPayments, error: errorPayments } = useQBPayments();
  const { data: purchases, isLoading: loadingPurchases, error: errorPurchases } = useQBExpenses();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { openPanel } = useDrillDown();

  const isLoading = loadingPayments || loadingPurchases;
  const error = errorPayments && errorPurchases;

  // Separate credit card transactions from other purchases
  const creditCardTxns = useMemo(() => {
    if (!purchases) return [];
    return (purchases as any[]).filter(
      (p: any) => p.PaymentType === "CreditCard" || p.AccountRef?.name?.toLowerCase().includes("credit card")
    );
  }, [purchases]);

  const allTxns = useMemo(() => {
    const paymentItems = ((payments as any[]) || []).map((p: any) => ({
      id: p.Id,
      date: p.TxnDate,
      name: p.CustomerRef?.name || "Unknown Customer",
      method: p.PaymentMethodRef?.name || "Payment",
      amount: parseFloat(p.TotalAmt || "0"),
      type: "received" as const,
      raw: p,
    }));

    const ccItems = creditCardTxns.map((p: any) => {
      const vendorName =
        p.EntityRef?.name ||
        p.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name ||
        p.AccountRef?.name ||
        "Unknown Vendor";
      return {
        id: p.Id,
        date: p.TxnDate,
        name: vendorName,
        method: p.AccountRef?.name || "Credit Card",
        amount: parseFloat(p.TotalAmt || "0"),
        type: "expense" as const,
        raw: p,
      };
    });

    return [...paymentItems, ...ccItems].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [payments, creditCardTxns]);

  const filtered = useMemo(() => {
    let items = allTxns;
    if (activeTab === "received") items = items.filter((t) => t.type === "received");
    if (activeTab === "credit-card") items = items.filter((t) => t.type === "expense");
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (t) => t.name.toLowerCase().includes(term) || t.method.toLowerCase().includes(term)
    );
  }, [allTxns, searchTerm, activeTab]);

  const metrics = useMemo(() => {
    const received = allTxns.filter((t) => t.type === "received");
    const expenses = allTxns.filter((t) => t.type === "expense");
    const totalReceived = received.reduce((s, t) => s + t.amount, 0);
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
    return {
      totalReceived,
      totalSpent,
      receivedCount: received.length,
      ccCount: expenses.length,
      totalTxns: allTxns.length,
    };
  }, [allTxns]);

  const handleTxnClick = (txn: (typeof allTxns)[0]) => {
    openPanel({
      type: "qb-record",
      title: txn.type === "received"
        ? `Payment · ${txn.name}`
        : `Credit Card · ${txn.name}`,
      data: { record: txn.raw, recordType: txn.type === "received" ? "qb-payment" : "qb-expense" },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Payments &amp; Credit Card Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Customer payments received and credit card transactions from your connected accounting
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            We're having trouble syncing your payment data. Please try reconnecting or click Sync to retry.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <InteractiveMetricCard
              title="Total Received"
              value={fmt(metrics.totalReceived)}
              subtitle={`${metrics.receivedCount} payments`}
              icon={<ArrowDownLeft className="h-4 w-4 text-green-600" />}
              variant="success"
              onClick={() => setActiveTab("received")}
              breakdown={[
                { label: "Payments", value: String(metrics.receivedCount) },
                { label: "Total", value: fmt(metrics.totalReceived) },
              ]}
            />
            <InteractiveMetricCard
              title="Credit Card Spend"
              value={fmt(metrics.totalSpent)}
              subtitle={`${metrics.ccCount} transactions`}
              icon={<CreditCard className="h-4 w-4 text-red-600" />}
              variant="danger"
              onClick={() => setActiveTab("credit-card")}
              breakdown={[
                { label: "Transactions", value: String(metrics.ccCount) },
                { label: "Total", value: fmt(metrics.totalSpent) },
              ]}
            />
            <InteractiveMetricCard
              title="Net Cash Flow"
              value={fmt(metrics.totalReceived - metrics.totalSpent)}
              subtitle="Received − Spent"
              icon={<DollarSign className="h-4 w-4 text-primary" />}
              onClick={() => setActiveTab("all")}
            />
            <InteractiveMetricCard
              title="All Transactions"
              value={String(metrics.totalTxns)}
              subtitle="Combined total"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              onClick={() => setActiveTab("all")}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All ({metrics.totalTxns})</TabsTrigger>
                <TabsTrigger value="received">Received ({metrics.receivedCount})</TabsTrigger>
                <TabsTrigger value="credit-card">Credit Card ({metrics.ccCount})</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              placeholder="Search name or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Method / Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? (
                      filtered.map((t) => (
                        <TableRow
                          key={`${t.type}-${t.id}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors group"
                          onClick={() => handleTxnClick(t)}
                        >
                          <TableCell>
                            {t.type === "received" ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>{fmtDate(t.date)}</TableCell>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {t.method}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums font-medium ${
                              t.type === "received" ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {t.type === "expense" ? "-" : ""}
                            {fmt(t.amount)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <button
                      key={`${t.type}-${t.id}`}
                      className="p-3 min-h-[56px] w-full text-left hover:bg-muted/50 transition-colors"
                      onClick={() => handleTxnClick(t)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {t.type === "received" ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(t.date)} · {t.method}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-semibold text-sm tabular-nums flex-shrink-0 ${
                            t.type === "received" ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {t.type === "expense" ? "-" : ""}
                          {fmt(t.amount)}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No transactions found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
