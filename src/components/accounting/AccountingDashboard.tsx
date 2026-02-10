import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountingDashboard() {
  const { user } = useAuth();

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
        bankAccountsLinked: bankAccounts?.length || 0
      };
    },
    enabled: !!user?.id
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
    enabled: !!user?.id
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Metric Cards - single column on mobile, grid on desktop */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats?.cashBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.bankAccountsLinked || 0} bank {stats?.bankAccountsLinked === 1 ? 'account' : 'accounts'} linked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600">
              {formatCurrency(stats?.incomeThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses This Month</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600">
              {formatCurrency(stats?.expensesThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${(stats?.profitThisMonth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats?.profitThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Invoices & Recent Transactions - single column on mobile */}
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
            <div className="text-2xl md:text-3xl font-bold tabular-nums">{formatCurrency(stats?.outstandingInvoices || 0)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total amount waiting to be paid
            </p>
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
    </div>
  );
}
