import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, RefreshCw, Bell } from 'lucide-react';
import { useJobBudget } from '@/hooks/useJobBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useJobCosts } from '@/hooks/useJobCosts';
import { useJobCostAlerts, JobCostAlert } from '@/hooks/useJobCostAlerts';
import { Job } from '@/hooks/useJobs';
import { format } from 'date-fns';

interface JobCostTrackerProps {
  job: Job;
}

export default function JobCostTracker({ job }: JobCostTrackerProps) {
  const { budgetLines, isLoading: budgetLoading, totalBudgeted } = useJobBudget(job.id);
  const { expenses, isLoading: expensesLoading } = useExpenses(job.id);
  const { costs, loading: costsLoading } = useJobCosts(job.id);
  const { alerts, isLoading: alertsLoading, markAsRead, checkMargins, isChecking } = useJobCostAlerts(job.id);

  const estimatedBudget = Number(job.budget_amount || job.contract_value || totalBudgeted || 0);

  const totalSpent = useMemo(() => {
    const expenseTotal = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    const costTotal = (costs || []).reduce((s, c) => s + Number(c.amount || 0), 0);
    return expenseTotal + costTotal;
  }, [expenses, costs]);

  const marginPercent = estimatedBudget > 0 ? ((estimatedBudget - totalSpent) / estimatedBudget) * 100 : 100;
  const spentPercent = estimatedBudget > 0 ? Math.min((totalSpent / estimatedBudget) * 100, 100) : 0;

  // Completion percentage from job
  const completionPercent = Number(job.completion_percentage || 0);
  const projectedFinalCost = completionPercent > 0 ? (totalSpent / completionPercent) * 100 : totalSpent;

  const getGaugeColor = () => {
    if (marginPercent >= 20) return 'bg-green-500';
    if (marginPercent >= 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = () => {
    if (marginPercent >= 20) return <Badge className="bg-green-500/10 text-green-600 border-green-600/20"><CheckCircle className="w-3 h-3 mr-1" /> On Track</Badge>;
    if (marginPercent >= 10) return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-600/20"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-600/20"><TrendingDown className="w-3 h-3 mr-1" /> Over Budget</Badge>;
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

  const isLoading = budgetLoading || expensesLoading || costsLoading;

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  // Build line-item comparison
  const lineComparison = budgetLines.map(line => {
    // Find matching expenses/costs by category
    const categoryExpenses = (expenses || [])
      .filter(e => e.category?.toLowerCase() === line.category?.toLowerCase())
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const categoryCosts = (costs || [])
      .filter(c => c.category?.toLowerCase() === line.category?.toLowerCase())
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    const actual = Number(line.actual_amount || 0) + categoryExpenses + categoryCosts;
    const budgeted = Number(line.budgeted_amount || 0);
    const variance = budgeted - actual;
    const variancePct = budgeted > 0 ? (variance / budgeted) * 100 : 0;
    return { ...line, actualTotal: actual, variance, variancePct };
  });

  return (
    <div className="space-y-4">
      {/* Budget Gauge */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Budget Health</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button variant="outline" size="sm" onClick={() => checkMargins()} disabled={isChecking}>
                <RefreshCw className={`w-3 h-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                Check
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-medium">{formatCurrency(totalSpent)} / {formatCurrency(estimatedBudget)}</span>
            </div>
            <div className="relative h-4 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getGaugeColor()}`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              />
              {spentPercent > 100 && (
                <div className="absolute inset-0 bg-red-500/20 animate-pulse rounded-full" />
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{spentPercent.toFixed(0)}% used</span>
              <span>Margin: {marginPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={`text-lg font-bold ${(estimatedBudget - totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(estimatedBudget - totalSpent)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Projected Final</p>
              <p className="text-lg font-bold flex items-center gap-1">
                {formatCurrency(projectedFinalCost)}
                {projectedFinalCost > estimatedBudget ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Item Comparison */}
      {lineComparison.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Line Item Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineComparison.map(line => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium text-sm">{line.description}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(Number(line.budgeted_amount))}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(line.actualTotal)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-medium ${line.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {line.variance >= 0 ? '+' : ''}{formatCurrency(line.variance)}
                          <span className="text-xs text-muted-foreground ml-1">({line.variancePct.toFixed(0)}%)</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert History */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alert History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert: JobCostAlert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg text-sm border ${alert.is_read ? 'bg-muted/30 border-border' : 'bg-destructive/5 border-destructive/20'}`}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                >
                  <div className="flex justify-between items-start">
                    <p className={alert.is_read ? 'text-muted-foreground' : 'font-medium'}>{alert.message}</p>
                    {!alert.is_read && (
                      <div className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1.5 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
