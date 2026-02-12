/**
 * QBEnhancedJobData — Shows QB invoice & expense data for a specific job,
 * merged alongside native myCT1 data in the P&L tab.
 */
import { useMemo } from 'react';
import { useQBExpenses, useQBPayments } from '@/hooks/useQuickBooksQuery';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CheckCircle, AlertTriangle, TrendingDown, DollarSign, BarChart3, Target,
} from 'lucide-react';
import { format } from 'date-fns';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

interface QBEnhancedJobDataProps {
  jobName: string;
  jobBudget: number;
  nativeCosts: number;
  nativeRevenue: number;
  qbConnected: boolean;
}

export function QBEnhancedJobData({ jobName, jobBudget, nativeCosts, nativeRevenue, qbConnected }: QBEnhancedJobDataProps) {
  const { data: qbExpenses, isLoading: expLoading } = useQBExpenses(qbConnected);
  const { data: qbPayments, isLoading: payLoading } = useQBPayments(qbConnected);

  // Try to match QB data to this job by name (fuzzy)
  const matchedExpenses = useMemo(() => {
    if (!qbExpenses || !jobName) return [];
    const lower = jobName.toLowerCase();
    return qbExpenses.filter((e: any) => {
      const memo = (e.PrivateNote || e.DocNumber || '').toLowerCase();
      const vendor = (e.EntityRef?.name || '').toLowerCase();
      return memo.includes(lower) || vendor.includes(lower);
    });
  }, [qbExpenses, jobName]);

  const matchedPayments = useMemo(() => {
    if (!qbPayments || !jobName) return [];
    const lower = jobName.toLowerCase();
    return qbPayments.filter((p: any) => {
      const memo = (p.PrivateNote || '').toLowerCase();
      const customer = (p.CustomerRef?.name || '').toLowerCase();
      return memo.includes(lower) || customer.includes(lower);
    });
  }, [qbPayments, jobName]);

  const qbExpenseTotal = matchedExpenses.reduce((s: number, e: any) => s + Number(e.TotalAmt || 0), 0);
  const qbPaymentTotal = matchedPayments.reduce((s: number, p: any) => s + Number(p.TotalAmt || 0), 0);

  // Merged totals
  const totalCosts = nativeCosts + qbExpenseTotal;
  const totalRevenue = nativeRevenue + qbPaymentTotal;
  const profit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const budgetPct = jobBudget > 0 ? (totalCosts / jobBudget) * 100 : 0;

  if (!qbConnected) return null;
  if (expLoading || payLoading) return <Skeleton className="h-32 w-full" />;

  const hasQBData = matchedExpenses.length > 0 || matchedPayments.length > 0;

  // QB expense category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    matchedExpenses.forEach((e: any) => {
      const lines = e.Line || [];
      lines.forEach((l: any) => {
        if (l.DetailType === 'AccountBasedExpenseLineDetail') {
          const acct = l.AccountBasedExpenseLineDetail?.AccountRef?.name || 'Other';
          cats[acct] = (cats[acct] || 0) + Number(l.Amount || 0);
        } else if (l.DetailType === 'ItemBasedExpenseLineDetail') {
          const item = l.ItemBasedExpenseLineDetail?.ItemRef?.name || 'Other';
          cats[item] = (cats[item] || 0) + Number(l.Amount || 0);
        }
      });
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [matchedExpenses]);

  return (
    <div className="space-y-3">
      {/* Merged summary */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          Merged Financial Summary
          <Badge variant="outline" className="text-[10px]">myCT1 + QB</Badge>
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-bold tabular-nums text-green-600">{fmt(totalRevenue)}</p>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>myCT1: {fmt(nativeRevenue)}</p>
              {qbPaymentTotal > 0 && <p>QB Payments: {fmt(qbPaymentTotal)}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Costs</p>
            <p className="text-lg font-bold tabular-nums text-red-600">{fmt(totalCosts)}</p>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>myCT1: {fmt(nativeCosts)}</p>
              {qbExpenseTotal > 0 && <p>QB Expenses: {fmt(qbExpenseTotal)}</p>}
            </div>
          </div>
        </div>

        {/* Profitability status */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {margin > 15 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : margin >= 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {margin > 15 ? 'Profitable' : margin >= 0 ? 'Break-even' : 'Losing Money'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold tabular-nums ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(profit)}
            </span>
            <span className="text-xs text-muted-foreground ml-2">{margin.toFixed(1)}%</span>
          </div>
        </div>

        {/* Budget status */}
        {jobBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Budget consumption</span>
              <span className={budgetPct > 100 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>{budgetPct.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(budgetPct, 100)} className="h-2" />
            {budgetPct >= 85 && budgetPct <= 100 && (
              <p className="text-[10px] text-amber-600 mt-1">⚠️ Approaching budget limit</p>
            )}
            {budgetPct > 100 && (
              <p className="text-[10px] text-red-600 mt-1">🚨 Over budget by {fmt(totalCosts - jobBudget)}</p>
            )}
          </div>
        )}
      </Card>

      {/* QB expense categories */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            QB Expense Categories
          </h3>
          <div className="space-y-2">
            {categoryBreakdown.slice(0, 8).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[200px]">{cat}</span>
                <span className="font-semibold tabular-nums">{fmt(amt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Matched QB transactions */}
      {hasQBData && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Matched QB Transactions</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchedPayments.map((p: any, i: number) => (
                  <TableRow key={`pay-${i}`}>
                    <TableCell className="text-xs tabular-nums">{p.TxnDate ? format(new Date(p.TxnDate), 'MMM d') : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600">Payment</Badge></TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{p.CustomerRef?.name || '—'}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-green-600 font-medium">{fmt(Number(p.TotalAmt || 0))}</TableCell>
                  </TableRow>
                ))}
                {matchedExpenses.map((e: any, i: number) => (
                  <TableRow key={`exp-${i}`}>
                    <TableCell className="text-xs tabular-nums">{e.TxnDate ? format(new Date(e.TxnDate), 'MMM d') : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600">Expense</Badge></TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{e.EntityRef?.name || e.DocNumber || '—'}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-red-600 font-medium">{fmt(Number(e.TotalAmt || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!hasQBData && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No QB transactions matched to this job. Transactions are matched by job name.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
