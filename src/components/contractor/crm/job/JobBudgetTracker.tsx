import { useState, useMemo } from 'react';
import { useJobBudget, BudgetLineItem } from '@/hooks/useJobBudget';
import { exportBudgetReport } from '@/utils/reportExportUtils';
import { useJobCosts } from '@/hooks/useJobCosts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/hooks/useJobs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle, DollarSign,
  Gauge, Plus, Target, TrendingDown, TrendingUp, Trash2, BarChart3,
  Receipt, PieChart,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

interface JobBudgetTrackerProps {
  job: Job;
}

function BudgetStatusBadge({ consumedPct }: { consumedPct: number }) {
  if (consumedPct > 100) return <Badge className="bg-red-500/10 text-red-600 border-red-600/20" variant="outline">Over Budget</Badge>;
  if (consumedPct >= 85) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-600/20" variant="outline">At Risk</Badge>;
  if (consumedPct >= 50) return <Badge className="bg-blue-500/10 text-blue-600 border-blue-600/20" variant="outline">On Track</Badge>;
  return <Badge className="bg-green-500/10 text-green-600 border-green-600/20" variant="outline">Under Budget</Badge>;
}

function ProfitabilityIndicator({ margin }: { margin: number }) {
  if (margin > 15) return <div className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-4 w-4" /><span className="text-sm font-semibold">Profitable</span></div>;
  if (margin >= 0) return <div className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="h-4 w-4" /><span className="text-sm font-semibold">Break-even</span></div>;
  return <div className="flex items-center gap-1.5 text-red-600"><TrendingDown className="h-4 w-4" /><span className="text-sm font-semibold">Losing Money</span></div>;
}

export default function JobBudgetTracker({ job }: JobBudgetTrackerProps) {
  const { budgetLines, isLoading, totalBudgeted, totalActual, totalVariance, variancePercent, initFromEstimate, addBudgetLine, deleteBudgetLine } = useJobBudget(job.id);
  const { costs, totalCosts } = useJobCosts(job.id);
  const [showAdd, setShowAdd] = useState(false);
  const [newLine, setNewLine] = useState({ description: '', budgeted_amount: '' });

  // Fetch estimate line items directly for display when no budget lines exist
  const { data: estimate } = useQuery({
    queryKey: ['job-estimate-budget', job.original_estimate_id],
    queryFn: async () => {
      if (!job.original_estimate_id) return null;
      const { data, error } = await supabase
        .from('estimates')
        .select('id, title, total_amount, line_items, subtotal, tax_amount')
        .eq('id', job.original_estimate_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!job.original_estimate_id,
  });

  // Parse estimate line items for display when no budget lines imported yet
  const estimateLineItems = useMemo(() => {
    if (!estimate?.line_items || !Array.isArray(estimate.line_items)) return [];
    return (estimate.line_items as any[]).map((item: any, idx: number) => {
      const amount = Number(item.total) || Number(item.amount) || (Number(item.quantity || 1) * Number(item.unit_price || item.unitPrice || 0));
      return {
        id: `est-${idx}`,
        description: item.description || item.name || `Line item ${idx + 1}`,
        category: item.category || 'General',
        budgeted_amount: amount,
        actual_amount: 0,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price || item.unitPrice) || 0,
        isEstimate: true,
      };
    });
  }, [estimate]);

  // Use budget lines if they exist, otherwise fall back to estimate line items
  const hasImportedBudget = budgetLines.length > 0;
  const displayBudgetLines = hasImportedBudget ? budgetLines : estimateLineItems;
  const displayTotalBudgeted = hasImportedBudget ? totalBudgeted : estimateLineItems.reduce((s, l) => s + l.budgeted_amount, 0);

  // Fetch invoices for actual revenue
  const { data: invoices } = useQuery({
    queryKey: ['job-invoices-budget', job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('amount_due, amount_paid, status')
        .eq('job_id', job.id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!job.id,
  });

  const budgetAmount = Number(job.budget_amount) || Number(job.contract_value) || displayTotalBudgeted || 0;
  const actualSpend = totalCosts || totalActual || Number(job.actual_cost) || 0;
  const consumedPct = budgetAmount > 0 ? (actualSpend / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - actualSpend;

  // Revenue calculations
  const budgetedRevenue = Number(job.total_contract_value) || Number(job.contract_value) || budgetAmount;
  const actualRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0) || Number(job.payments_collected) || 0;
  const budgetedMargin = budgetedRevenue > 0 ? ((budgetedRevenue - budgetAmount) / budgetedRevenue) * 100 : 0;
  const actualMargin = budgetedRevenue > 0 ? ((budgetedRevenue - actualSpend) / budgetedRevenue) * 100 : 0;

  // Forecast
  const jobProgress = job.job_status === 'completed' ? 100 : (consumedPct > 0 ? Math.min(consumedPct, 95) : 25);
  const forecastedFinalCost = jobProgress > 0 ? (actualSpend / (jobProgress / 100)) : actualSpend;
  const forecastVariance = budgetAmount - forecastedFinalCost;

  // Chart data for budget vs actual by category
  const chartData = useMemo(() => {
    if (displayBudgetLines.length === 0) return [];
    const byCategory: Record<string, { budgeted: number; actual: number }> = {};
    displayBudgetLines.forEach((line: any) => {
      const cat = line.category || 'General';
      if (!byCategory[cat]) byCategory[cat] = { budgeted: 0, actual: 0 };
      byCategory[cat].budgeted += Number(line.budgeted_amount || 0);
      byCategory[cat].actual += Number(line.actual_amount || 0);
    });
    return Object.entries(byCategory).map(([name, d]) => ({ name, ...d }));
  }, [displayBudgetLines]);

  // Costs grouped by category for Actual tab
  const costsByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    costs.forEach(cost => {
      const cat = cost.category || 'other';
      grouped[cat] = (grouped[cat] || 0) + Number(cost.amount);
    });
    return Object.entries(grouped).map(([category, amount]) => ({ category, amount }));
  }, [costs]);

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-4">
      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5" /> Budget</div>
          <p className="text-lg font-bold tabular-nums">{fmt(budgetAmount)}</p>
          <BudgetStatusBadge consumedPct={consumedPct} />
        </Card>
        <Card className="p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Spent</div>
          <p className="text-lg font-bold tabular-nums">{fmt(actualSpend)}</p>
          <p className="text-xs text-muted-foreground">{fmtPct(consumedPct)} of budget used</p>
        </Card>
        <Card className="p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {remaining >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />}
            Remaining
          </div>
          <p className={`text-lg font-bold tabular-nums ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(remaining)}</p>
          <ProfitabilityIndicator margin={actualMargin} />
        </Card>
        <Card className="p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Gauge className="h-3.5 w-3.5" /> Forecast</div>
          <p className="text-lg font-bold tabular-nums">{fmt(forecastedFinalCost)}</p>
          <p className={`text-xs ${forecastVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {forecastVariance >= 0 ? 'Under' : 'Over'} by {fmt(Math.abs(forecastVariance))}
          </p>
        </Card>
      </div>

      {/* Budget consumption bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Budget Consumption</span>
          <span className={`text-sm font-bold ${consumedPct > 100 ? 'text-red-600' : consumedPct > 85 ? 'text-amber-600' : 'text-green-600'}`}>
            {fmtPct(consumedPct)}
          </span>
        </div>
        <Progress value={Math.min(consumedPct, 100)} className="h-3" />
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>{fmt(actualSpend)} spent</span>
          <span>{fmt(budgetAmount)} budget</span>
        </div>
        {consumedPct >= 85 && consumedPct <= 100 && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-700 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Budget is {fmtPct(consumedPct)} consumed. Consider reviewing remaining scope.</span>
          </div>
        )}
        {consumedPct > 100 && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-red-500/10 text-red-700 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Budget exceeded by {fmt(Math.abs(remaining))} ({fmtPct(consumedPct - 100)} over).</span>
          </div>
        )}
      </Card>

      {/* Tabbed layout: Budget / Actual / Variance */}
      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budget" className="text-xs">Budget</TabsTrigger>
          <TabsTrigger value="actual" className="text-xs">Actual</TabsTrigger>
          <TabsTrigger value="variance" className="text-xs">Variance</TabsTrigger>
        </TabsList>

        {/* BUDGET TAB */}
        <TabsContent value="budget" className="space-y-4 mt-4">
          {/* Budget Summary */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Budget Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Budgeted Revenue</span>
                <span className="text-sm font-semibold tabular-nums">{fmt(budgetedRevenue)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Budgeted Cost</span>
                <span className="text-sm font-semibold tabular-nums">{fmt(displayTotalBudgeted || budgetAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm font-medium">Expected Margin</span>
                <span className={`text-sm font-bold tabular-nums ${budgetedMargin >= 15 ? 'text-green-600' : budgetedMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {fmtPct(budgetedMargin)}
                </span>
              </div>
            </div>
          </Card>

          {/* Line items */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Budget Line Items</h3>
              <div className="flex gap-2">
                {hasImportedBudget ? (
                  <>
                    {budgetLines.length === 0 && job.original_estimate_id && (
                      <Button size="sm" variant="outline" onClick={() => initFromEstimate(job.original_estimate_id!, job.id!)}>
                        Import from Estimate
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Line
                    </Button>
                  </>
                ) : (
                  <>
                    {job.original_estimate_id && (
                      <Button size="sm" variant="outline" onClick={() => initFromEstimate(job.original_estimate_id!, job.id!)}>
                        Lock as Budget
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Line
                    </Button>
                  </>
                )}
                {displayBudgetLines.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => exportBudgetReport(hasImportedBudget ? budgetLines : displayBudgetLines as any)}>
                    Export
                  </Button>
                )}
              </div>
            </div>

            {showAdd && (
              <div className="flex gap-2 mb-3">
                <Input placeholder="Description" value={newLine.description} onChange={(e) => setNewLine(p => ({ ...p, description: e.target.value }))} className="flex-1" />
                <Input placeholder="Amount" type="number" value={newLine.budgeted_amount} onChange={(e) => setNewLine(p => ({ ...p, budgeted_amount: e.target.value }))} className="w-28" />
                <Button size="sm" onClick={async () => {
                  if (!newLine.description || !newLine.budgeted_amount) return;
                  await addBudgetLine({
                    job_id: job.id!,
                    estimate_line_item_index: null,
                    description: newLine.description,
                    item_code: null,
                    category: 'General',
                    budgeted_quantity: 1,
                    budgeted_unit_price: Number(newLine.budgeted_amount),
                    budgeted_amount: Number(newLine.budgeted_amount),
                    actual_amount: 0,
                    notes: null,
                  });
                  setNewLine({ description: '', budgeted_amount: '' });
                  setShowAdd(false);
                }}>Add</Button>
              </div>
            )}

            {!hasImportedBudget && estimateLineItems.length > 0 && (
              <div className="mb-3 flex items-center gap-2 p-2 rounded-md bg-blue-500/10 text-blue-700 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Showing estimate line items as budget baseline. Click "Lock as Budget" to make editable.</span>
              </div>
            )}

            {displayBudgetLines.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs text-right">Budget</TableHead>
                      {hasImportedBudget && <TableHead className="w-8" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayBudgetLines.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-xs font-medium">{line.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{line.category}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{fmt(line.budgeted_amount)}</TableCell>
                        {hasImportedBudget && (
                          <TableCell>
                            <button onClick={() => deleteBudgetLine(line.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive/60 hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-semibold">
                      <TableCell className="text-xs" colSpan={2}>Total</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmt(displayTotalBudgeted)}</TableCell>
                      {hasImportedBudget && <TableCell />}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No budget line items yet.</p>
                {job.original_estimate_id ? (
                  <p className="text-xs mt-1">This job has no estimate line items. Add budget lines manually.</p>
                ) : (
                  <p className="text-xs mt-1">Add budget lines manually to track costs against plan.</p>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ACTUAL TAB */}
        <TabsContent value="actual" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Actual Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Actual Revenue (Collected)</span>
                <span className="text-sm font-semibold tabular-nums text-green-600">{fmt(actualRevenue)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Actual Cost</span>
                <span className="text-sm font-semibold tabular-nums text-red-600">{fmt(actualSpend)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm font-medium">Actual Margin</span>
                <span className={`text-sm font-bold tabular-nums ${actualMargin >= 15 ? 'text-green-600' : actualMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {fmtPct(actualMargin)}
                </span>
              </div>
            </div>
          </Card>

          {/* Cost Breakdown by Category */}
          {costsByCategory.length > 0 ? (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Cost Breakdown by Category</h3>
              <div className="space-y-2">
                {costsByCategory.map(({ category, amount }) => (
                  <div key={category} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">{fmt(amount)}</span>
                      <span className="text-xs text-muted-foreground">{totalCosts > 0 ? fmtPct((amount / totalCosts) * 100) : '0%'}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-border font-semibold">
                  <span className="text-sm">Total</span>
                  <span className="text-sm tabular-nums">{fmt(totalCosts)}</span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No actual costs recorded yet.</p>
                <p className="text-xs mt-1">Go to the P&L tab to add costs.</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* VARIANCE TAB */}
        <TabsContent value="variance" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Budget vs Actual
            </h3>
            <div className="space-y-2">
              <VarianceRow label="Revenue" budgeted={budgetedRevenue} actual={actualRevenue} isRevenue />
              <VarianceRow label="Cost" budgeted={budgetAmount} actual={actualSpend} />
              <div className="border-t border-border pt-2">
                <VarianceRow label="Margin" budgeted={budgetedMargin} actual={actualMargin} isPercent />
              </div>
            </div>
          </Card>

          {/* Budget vs Actual chart */}
          {chartData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                By Category
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="budgeted" fill="hsl(var(--primary))" name="Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="hsl(var(--destructive))" name="Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Line-item variance table */}
          {displayBudgetLines.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Line Item Variance</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs text-right">Budget</TableHead>
                      <TableHead className="text-xs text-right">Actual</TableHead>
                      <TableHead className="text-xs text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayBudgetLines.map((line: any) => {
                      const budgeted = Number(line.budgeted_amount) || 0;
                      const actual = Number(line.actual_amount) || 0;
                      const variance = budgeted - actual;
                      return (
                        <TableRow key={line.id}>
                          <TableCell className="text-xs font-medium">{line.description}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums">{fmt(budgeted)}</TableCell>
                          <TableCell className="text-xs text-right tabular-nums">{fmt(actual)}</TableCell>
                          <TableCell className={`text-xs text-right tabular-nums font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {fmt(variance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 font-semibold">
                      <TableCell className="text-xs">Total</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmt(displayTotalBudgeted)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmt(totalActual)}</TableCell>
                      <TableCell className={`text-xs text-right tabular-nums ${(displayTotalBudgeted - totalActual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(displayTotalBudgeted - totalActual)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VarianceRow({ label, budgeted, actual, isRevenue, isPercent }: {
  label: string; budgeted: number; actual: number; isRevenue?: boolean; isPercent?: boolean;
}) {
  const variance = actual - budgeted;
  const isGood = isRevenue || isPercent ? variance >= 0 : variance <= 0;
  const formatVal = isPercent ? fmtPct : fmt;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3 text-right">
        <div className="text-xs text-muted-foreground">
          <span className="block">Budget: {formatVal(budgeted)}</span>
          <span className="block">Actual: {formatVal(actual)}</span>
        </div>
        <Badge variant="outline" className={`text-[10px] py-0 tabular-nums ${isGood ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {variance >= 0 ? '+' : ''}{formatVal(variance)}
        </Badge>
      </div>
    </div>
  );
}
