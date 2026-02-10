import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, CreditCard, Users, Store, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors, useQBPayments as useQBPaymentsData, useQBExpenses as useQBExpensesData } from "@/hooks/useQuickBooksQuery";

function getYTDRange() {
  const now = new Date();
  return { start: `${now.getFullYear()}-01-01`, end: now.toISOString().split("T")[0] };
}

function extractTotal(rows: any[], groupName: string): number {
  const group = rows?.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function AccountingDashboard() {
  const { user } = useAuth();

  // Check if QB is connected
  const { data: qbConnected } = useQuery({
    queryKey: ['qb-connected', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id')
        .eq('id', user.id)
        .single();
      return !!profile?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  // Local DB stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['accounting-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const now = new Date().toISOString();

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('contractor_id', user.id)
        .gte('payment_date', startOfMonth)
        .lte('payment_date', now);
      const incomeThisMonth = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const { data: expenses } = await supabase
        .from('plaid_transactions')
        .select('amount')
        .eq('contractor_id', user.id)
        .eq('is_expense', true)
        .gte('transaction_date', startOfMonth.split('T')[0])
        .lte('transaction_date', now.split('T')[0]);
      const expensesThisMonth = expenses?.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0) || 0;

      const { data: invoices } = await supabase
        .from('invoices')
        .select('balance_due')
        .eq('user_id', user.id)
        .neq('status', 'paid');
      const outstandingInvoices = invoices?.reduce((sum, i) => sum + Number(i.balance_due || 0), 0) || 0;

      const { data: bankAccounts } = await supabase
        .from('bank_account_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      return {
        cashBalance: 0,
        incomeThisMonth,
        expensesThisMonth,
        profitThisMonth: incomeThisMonth - expensesThisMonth,
        outstandingInvoices,
        bankAccountsLinked: bankAccounts?.length || 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('plaid_transactions')
        .select('*')
        .eq('contractor_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // QuickBooks data (only if connected)
  const dateRange = getYTDRange();
  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(dateRange, !!qbConnected);
  const { data: qbCustomers, isLoading: custLoading } = useQBCustomers(!!qbConnected);
  const { data: qbVendors, isLoading: vendLoading } = useQBVendors(!!qbConnected);
  const { data: qbPayments, isLoading: qbPayLoading } = useQBPaymentsData(!!qbConnected);
  const { data: qbExpenses, isLoading: qbExpLoading } = useQBExpensesData(!!qbConnected);

  const qbIncome = pnl ? extractTotal(pnl.rows, "Income") : 0;
  const qbExpensesTotal = pnl ? extractTotal(pnl.rows, "Expenses") : 0;
  const qbNetIncome = qbIncome - qbExpensesTotal;

  const anyLoading = isLoading || (qbConnected && (pnlLoading || custLoading || vendLoading));

  if (anyLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Use QB data if connected, otherwise fall back to local DB data
  const displayIncome = qbConnected ? qbIncome : (stats?.incomeThisMonth || 0);
  const displayExpenses = qbConnected ? qbExpensesTotal : (stats?.expensesThisMonth || 0);
  const displayNet = qbConnected ? qbNetIncome : (stats?.profitThisMonth || 0);
  const periodLabel = qbConnected ? "Year to Date" : "This Month";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Connection status */}
      {qbConnected && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span>Connected accounting data — showing live financial information</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue {periodLabel}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600">{fmt(displayIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {qbConnected ? "From connected accounting" : "From payments received"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses {periodLabel}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600">{fmt(displayExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {qbConnected ? "From connected accounting" : "From transactions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income {periodLabel}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${displayNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(displayNet)}
            </div>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{fmt(stats?.outstandingInvoices || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.bankAccountsLinked || 0} bank {stats?.bankAccountsLinked === 1 ? 'account' : 'accounts'} linked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QB Customers & Vendors (when connected) */}
      {qbConnected && (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="h-5 w-5" />
                Top Customers
              </CardTitle>
              <CardDescription>From connected accounting</CardDescription>
            </CardHeader>
            <CardContent>
              {qbCustomers && qbCustomers.length > 0 ? (
                <div className="space-y-2">
                  {qbCustomers.slice(0, 5).map((c: any) => (
                    <div key={c.Id} className="flex justify-between items-center text-sm min-h-[40px]">
                      <span className="truncate mr-3">{c.DisplayName}</span>
                      <span className="tabular-nums font-medium flex-shrink-0">
                        {fmt(parseFloat(c.Balance || "0"))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Store className="h-5 w-5" />
                Top Vendors
              </CardTitle>
              <CardDescription>From connected accounting</CardDescription>
            </CardHeader>
            <CardContent>
              {qbVendors && qbVendors.length > 0 ? (
                <div className="space-y-2">
                  {qbVendors.slice(0, 5).map((v: any) => (
                    <div key={v.Id} className="flex justify-between items-center text-sm min-h-[40px]">
                      <span className="truncate mr-3">{v.DisplayName}</span>
                      <span className="tabular-nums font-medium flex-shrink-0">
                        {fmt(parseFloat(v.Balance || "0"))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No vendor data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* QB Recent Payments (when connected) */}
      {qbConnected && !qbPayLoading && qbPayments && qbPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>Payments from connected accounting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qbPayments.slice(0, 5).map((p: any) => (
                <div key={p.Id} className="flex justify-between items-center text-sm min-h-[44px]">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium truncate">{p.CustomerRef?.name || 'Payment'}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.TxnDate ? new Date(p.TxnDate).toLocaleDateString() : 'N/A'}
                      {p.PaymentMethodRef?.name && ` · ${p.PaymentMethodRef.name}`}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums flex-shrink-0 text-green-600">
                    {fmt(parseFloat(p.TotalAmt || "0"))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QB Recent Expenses (when connected) */}
      {qbConnected && !qbExpLoading && qbExpenses && qbExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingDown className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
            <CardDescription>Purchases from connected accounting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qbExpenses.slice(0, 5).map((e: any) => (
                <div key={e.Id} className="flex justify-between items-center text-sm min-h-[44px]">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium truncate">
                      {e.EntityRef?.name || e.AccountRef?.name || 'Expense'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.TxnDate ? new Date(e.TxnDate).toLocaleDateString() : 'N/A'}
                      {e.PaymentType && ` · ${e.PaymentType}`}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums flex-shrink-0 text-red-600">
                    {fmt(parseFloat(e.TotalAmt || "0"))}
                  </p>
                </div>
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
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileText className="h-5 w-5" />
                Outstanding Invoices
              </CardTitle>
              <CardDescription>Unpaid and overdue invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold tabular-nums">{fmt(stats?.outstandingInvoices || 0)}</div>
              <p className="text-sm text-muted-foreground mt-2">Total amount waiting to be paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CreditCard className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Latest banking activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 3).map((txn) => (
                    <div key={txn.id} className="flex justify-between items-center text-sm min-h-[44px]">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium truncate">{txn.vendor || txn.description || 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`font-semibold tabular-nums flex-shrink-0 ${Number(txn.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(txn.amount) < 0 ? '-' : ''}${Math.abs(Number(txn.amount)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>No recent transactions</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt to connect when nothing is connected */}
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
    </div>
  );
}