import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, CreditCard, Users, Store, BarChart3, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors, useQBPayments as useQBPaymentsData, useQBExpenses as useQBExpensesData } from "@/hooks/useQuickBooksQuery";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { DrillDownProvider } from "@/components/reporting/drilldown/DrillDownProvider";
import { DrillDownPanel } from "@/components/reporting/drilldown/DrillDownPanel";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DatePreset = "this-month" | "last-month" | "this-quarter" | "last-quarter" | "ytd" | "last-year" | "all-time" | "custom";

const presetLabels: Record<DatePreset, string> = {
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  "last-quarter": "Last Quarter",
  "ytd": "Year to Date",
  "last-year": "Last Year",
  "all-time": "All Time",
  "custom": "Custom",
};

function getPresetRange(preset: DatePreset): { start: string; end: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.toISOString().split("T")[0];

  switch (preset) {
    case "this-month":
      return { start: `${y}-${String(m + 1).padStart(2, "0")}-01`, end: today, label: "This Month" };
    case "last-month": {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      const lastDay = new Date(ly, lm + 1, 0).getDate();
      return { start: `${ly}-${String(lm + 1).padStart(2, "0")}-01`, end: `${ly}-${String(lm + 1).padStart(2, "0")}-${lastDay}`, label: "Last Month" };
    }
    case "this-quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { start: `${y}-${String(qStart + 1).padStart(2, "0")}-01`, end: today, label: "This Quarter" };
    }
    case "last-quarter": {
      let qStart = Math.floor(m / 3) * 3 - 3;
      let qy = y;
      if (qStart < 0) { qStart += 12; qy -= 1; }
      const qEnd = new Date(qy, qStart + 3, 0);
      return { start: `${qy}-${String(qStart + 1).padStart(2, "0")}-01`, end: qEnd.toISOString().split("T")[0], label: "Last Quarter" };
    }
    case "ytd":
      return { start: `${y}-01-01`, end: today, label: "Year to Date" };
    case "last-year":
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31`, label: "Last Year" };
    case "all-time":
      return { start: "2000-01-01", end: today, label: "All Time" };
    default:
      return { start: `${y}-01-01`, end: today, label: "Year to Date" };
  }
}

function extractTotal(rows: any[], groupName: string): number {
  const group = rows?.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

function DashboardContent() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [datePreset, setDatePreset] = useState<DatePreset>("ytd");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const dateRange = useMemo(() => {
    if (datePreset === "custom" && customStart && customEnd) {
      return {
        start: format(customStart, "yyyy-MM-dd"),
        end: format(customEnd, "yyyy-MM-dd"),
        label: `${format(customStart, "MMM d, yyyy")} – ${format(customEnd, "MMM d, yyyy")}`,
      };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const { data: qbConnected } = useQuery({
    queryKey: ['qb-connected', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data: profile } = await supabase.from('profiles').select('qb_realm_id').eq('id', user.id).single();
      return !!profile?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['accounting-stats', user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: payments } = await supabase.from('payments').select('amount').eq('contractor_id', user.id).gte('payment_date', dateRange.start).lte('payment_date', dateRange.end);
      const incomeThisMonth = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const { data: expenses } = await supabase.from('plaid_transactions').select('amount').eq('contractor_id', user.id).eq('is_expense', true).gte('transaction_date', dateRange.start).lte('transaction_date', dateRange.end);
      const expensesThisMonth = expenses?.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0) || 0;
      const { data: invoices } = await supabase.from('invoices').select('balance_due').eq('user_id', user.id).neq('status', 'paid');
      const outstandingInvoices = invoices?.reduce((sum, i) => sum + Number(i.balance_due || 0), 0) || 0;
      const { data: bankAccounts } = await supabase.from('bank_account_links').select('*').eq('user_id', user.id).eq('status', 'active');
      return { cashBalance: 0, incomeThisMonth, expensesThisMonth, profitThisMonth: incomeThisMonth - expensesThisMonth, outstandingInvoices, bankAccountsLinked: bankAccounts?.length || 0 };
    },
    enabled: !!user?.id,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('plaid_transactions').select('*').eq('contractor_id', user.id).order('transaction_date', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(dateRange, !!qbConnected);
  const { data: qbCustomers, isLoading: custLoading } = useQBCustomers(!!qbConnected);
  const { data: qbVendors, isLoading: vendLoading } = useQBVendors(!!qbConnected);
  const { data: qbPayments, isLoading: qbPayLoading } = useQBPaymentsData(!!qbConnected);
  const { data: qbExpenses, isLoading: qbExpLoading } = useQBExpensesData(!!qbConnected);

  const qbIncome = pnl ? extractTotal(pnl.rows, "Income") : 0;
  const qbExpensesTotal = pnl ? extractTotal(pnl.rows, "Expenses") : 0;
  const qbNetIncome = qbIncome - qbExpensesTotal;

  const anyLoading = isLoading || (qbConnected && (pnlLoading || custLoading || vendLoading));

  const periodLabel = dateRange.label;
  const displayIncome = qbConnected ? qbIncome : (stats?.incomeThisMonth || 0);
  const displayExpenses = qbConnected ? qbExpensesTotal : (stats?.expensesThisMonth || 0);
  const displayNet = qbConnected ? qbNetIncome : (stats?.profitThisMonth || 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Date range selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {(Object.keys(presetLabels) as DatePreset[]).map((key) => (
              <SelectItem key={key} value={key}>
                {presetLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("min-w-[120px] justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                  {customStart ? format(customStart, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <CalendarComponent mode="single" selected={customStart} onSelect={setCustomStart} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">–</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("min-w-[120px] justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                  {customEnd ? format(customEnd, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <CalendarComponent mode="single" selected={customEnd} onSelect={setCustomEnd} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {qbConnected && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span>Connected accounting data — showing live financial information</span>
        </div>
      )}

      {anyLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-28 w-full" />))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
            <InteractiveMetricCard
              title={`Revenue`}
              value={fmt(displayIncome)}
              subtitle={periodLabel}
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              variant="success"
              onClick={() => openPanel({ type: "category-breakdown", title: `Revenue ${periodLabel}`, data: { category: "Income", totalAmount: displayIncome, period: periodLabel } })}
            />
            <InteractiveMetricCard
              title={`Expenses`}
              value={fmt(displayExpenses)}
              subtitle={periodLabel}
              icon={<TrendingDown className="h-4 w-4 text-destructive" />}
              variant="danger"
              onClick={() => openPanel({ type: "category-breakdown", title: `Expenses ${periodLabel}`, data: { category: "Expenses", totalAmount: displayExpenses, period: periodLabel } })}
            />
            <InteractiveMetricCard
              title={`Net Income`}
              value={fmt(displayNet)}
              subtitle={periodLabel}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              variant={displayNet >= 0 ? "success" : "danger"}
            />
            <InteractiveMetricCard
              title="Outstanding Invoices"
              value={fmt(stats?.outstandingInvoices || 0)}
              subtitle={`${stats?.bankAccountsLinked || 0} bank ${stats?.bankAccountsLinked === 1 ? 'account' : 'accounts'} linked`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              variant="warning"
            />
          </div>

          {/* QB Customers & Vendors */}
          {qbConnected && (
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg"><Users className="h-5 w-5" /> Top Customers</CardTitle>
                  <CardDescription>From connected accounting</CardDescription>
                </CardHeader>
                <CardContent>
                  {qbCustomers && qbCustomers.length > 0 ? (
                    <div className="space-y-1">
                      {qbCustomers.slice(0, 5).map((c: any) => (
                        <button key={c.Id} className="flex justify-between items-center text-sm min-h-[40px] w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer text-left"
                          onClick={() => openPanel({ type: "qb-record", title: c.DisplayName, data: { record: c, recordType: "qb-customer" } })}>
                          <span className="truncate mr-3">{c.DisplayName}</span>
                          <span className="tabular-nums font-medium flex-shrink-0">{fmt(parseFloat(c.Balance || "0"))}</span>
                        </button>
                      ))}
                    </div>
                  ) : (<p className="text-sm text-muted-foreground">No customer data available</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg"><Store className="h-5 w-5" /> Top Vendors</CardTitle>
                  <CardDescription>From connected accounting</CardDescription>
                </CardHeader>
                <CardContent>
                  {qbVendors && qbVendors.length > 0 ? (
                    <div className="space-y-1">
                      {qbVendors.slice(0, 5).map((v: any) => (
                        <button key={v.Id} className="flex justify-between items-center text-sm min-h-[40px] w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer text-left"
                          onClick={() => openPanel({ type: "qb-record", title: v.DisplayName, data: { record: v, recordType: "qb-vendor" } })}>
                          <span className="truncate mr-3">{v.DisplayName}</span>
                          <span className="tabular-nums font-medium flex-shrink-0">{fmt(parseFloat(v.Balance || "0"))}</span>
                        </button>
                      ))}
                    </div>
                  ) : (<p className="text-sm text-muted-foreground">No vendor data available</p>)}
                </CardContent>
              </Card>
            </div>
          )}

          {/* QB Recent Payments */}
          {qbConnected && !qbPayLoading && qbPayments && qbPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg"><CreditCard className="h-5 w-5" /> Recent Payments</CardTitle>
                <CardDescription>Payments from connected accounting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {qbPayments.slice(0, 5).map((p: any) => (
                    <button key={p.Id} className="flex justify-between items-center text-sm min-h-[44px] w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer text-left"
                      onClick={() => openPanel({ type: "qb-record", title: `Payment · ${p.CustomerRef?.name || "Unknown"}`, data: { record: p, recordType: "qb-payment" } })}>
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium truncate">{p.CustomerRef?.name || 'Payment'}</p>
                        <p className="text-xs text-muted-foreground">{p.TxnDate ? new Date(p.TxnDate).toLocaleDateString() : 'N/A'}{p.PaymentMethodRef?.name && ` · ${p.PaymentMethodRef.name}`}</p>
                      </div>
                      <p className="font-semibold tabular-nums flex-shrink-0 text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QB Recent Expenses */}
          {qbConnected && !qbExpLoading && qbExpenses && qbExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg"><TrendingDown className="h-5 w-5" /> Recent Expenses</CardTitle>
                <CardDescription>Purchases from connected accounting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {qbExpenses.slice(0, 5).map((e: any) => (
                    <button key={e.Id} className="flex justify-between items-center text-sm min-h-[44px] w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer text-left"
                      onClick={() => openPanel({ type: "qb-record", title: `Expense · ${e.EntityRef?.name || "Unknown"}`, data: { record: e, recordType: "qb-expense" } })}>
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium truncate">{e.EntityRef?.name || e.AccountRef?.name || 'Expense'}</p>
                        <p className="text-xs text-muted-foreground">{e.TxnDate ? new Date(e.TxnDate).toLocaleDateString() : 'N/A'}{e.PaymentType && ` · ${e.PaymentType}`}</p>
                      </div>
                      <p className="font-semibold tabular-nums flex-shrink-0 text-destructive">{fmt(parseFloat(e.TotalAmt || "0"))}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Local DB cards (when QB not connected) */}
          {!qbConnected && (
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg"><FileText className="h-5 w-5" /> Outstanding Invoices</CardTitle>
                  <CardDescription>Unpaid and overdue invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold tabular-nums">{fmt(stats?.outstandingInvoices || 0)}</div>
                  <p className="text-sm text-muted-foreground mt-2">Total amount waiting to be paid</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg"><CreditCard className="h-5 w-5" /> Recent Transactions</CardTitle>
                  <CardDescription>Latest banking activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTransactions && recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 3).map((txn) => (
                        <div key={txn.id} className="flex justify-between items-center text-sm min-h-[44px]">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium truncate">{txn.vendor || txn.description || 'Transaction'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(txn.transaction_date).toLocaleDateString()}</p>
                          </div>
                          <p className={`font-semibold tabular-nums flex-shrink-0 ${Number(txn.amount) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {Number(txn.amount) < 0 ? '-' : ''}${Math.abs(Number(txn.amount)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" /><span>No recent transactions</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!qbConnected && !stats?.bankAccountsLinked && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-base font-semibold mb-1">Connect Your Accounting</p>
                <p className="text-sm text-muted-foreground text-center px-4 max-w-md">
                  Connect QuickBooks or link a bank account from the Banking tab to see your full financial picture here.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export function AccountingDashboard() {
  return (
    <DrillDownProvider>
      <DashboardContent />
      <DrillDownPanel />
    </DrillDownProvider>
  );
}
