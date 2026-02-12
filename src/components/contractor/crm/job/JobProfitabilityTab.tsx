import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJobCosts, JobCost } from '@/hooks/useJobCosts';
import { Job } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { QBEnhancedJobData } from './QBEnhancedJobData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Wrench,
  HardHat,
  MoreHorizontal,
  Plus,
  ChevronDown,
  ChevronRight,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Trash2,
  PieChart,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface JobProfitabilityTabProps {
  job: Job;
}

const COST_CATEGORIES = [
  { value: 'materials', label: 'Materials', icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'labor', label: 'Labor', icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'subcontractor', label: 'Subcontractor', icon: HardHat, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'equipment', label: 'Equipment', icon: Wrench, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

const formatCurrencyPrecise = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

export default function JobProfitabilityTab({ job }: JobProfitabilityTabProps) {
  const { costs, loading: costsLoading, addCost, deleteCost, totalCosts, refreshCosts } = useJobCosts(job.id);
  const [showAddCost, setShowAddCost] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { user } = useAuth();

  // Check QB connection
  const { data: qbConnected } = useQuery({
    queryKey: ['qb-connected-job', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from('profiles').select('qb_realm_id').eq('id', user.id).maybeSingle();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  // Fetch invoices for this job
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['job-invoices-profit', job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, issue_date, amount_due, amount_paid, balance_due, status')
        .eq('job_id', job.id!)
        .order('issue_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!job.id,
  });

  // Fetch original estimate for comparison
  const { data: estimate } = useQuery({
    queryKey: ['job-estimate-profit', job.original_estimate_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimates')
        .select('id, title, total_amount, line_items, subtotal, tax_amount')
        .eq('id', job.original_estimate_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!job.original_estimate_id,
  });

  // Fetch change orders for this job
  const { data: changeOrders } = useQuery({
    queryKey: ['job-change-orders-profit', job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select('id, change_order_number, description, additional_cost, status, date_requested')
        .eq('job_id', job.id!)
        .eq('status', 'approved')
        .order('date_requested', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!job.id,
  });

  // Compute financials
  const financials = useMemo(() => {
    const revenue = Number(job.total_contract_value) || Number(job.contract_value) || Number(job.total_cost) || 0;
    const invoiceRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.amount_due) || 0), 0) || 0;
    const totalRevenue = Math.max(revenue, invoiceRevenue);
    const collected = invoices?.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0) || 0;
    const outstanding = totalRevenue - collected;
    const actualCosts = totalCosts;
    const netProfit = totalRevenue - actualCosts;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Estimate comparison
    const estimatedTotal = estimate ? Number(estimate.total_amount) || 0 : null;
    const revenueVariance = estimatedTotal !== null ? totalRevenue - estimatedTotal : null;
    const costVariance = estimatedTotal !== null ? actualCosts - (estimatedTotal * 0.65) : null; // Rough cost estimate
    const profitVariance = estimatedTotal !== null ? netProfit - (estimatedTotal * 0.35) : null;

    return { totalRevenue, collected, outstanding, actualCosts, netProfit, margin, estimatedTotal, revenueVariance };
  }, [job, invoices, totalCosts, estimate]);

  // Group costs by category
  const costsByCategory = useMemo(() => {
    const grouped: Record<string, JobCost[]> = {};
    COST_CATEGORIES.forEach(cat => { grouped[cat.value] = []; });
    costs.forEach(cost => {
      const cat = cost.category?.toLowerCase() || 'other';
      if (grouped[cat]) {
        grouped[cat].push(cost);
      } else {
        grouped['other'].push(cost);
      }
    });
    return grouped;
  }, [costs]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(costsByCategory).forEach(([cat, items]) => {
      totals[cat] = items.reduce((sum, c) => sum + Number(c.amount), 0);
    });
    return totals;
  }, [costsByCategory]);

  const isLoading = costsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(financials.totalRevenue)}
          variance={financials.revenueVariance}
          icon={<DollarSign className="h-4 w-4" />}
          positive
        />
        <MetricCard
          label="Total Costs"
          value={formatCurrency(financials.actualCosts)}
          icon={<Receipt className="h-4 w-4" />}
          negative
        />
        <MetricCard
          label="Net Profit"
          value={formatCurrency(financials.netProfit)}
          icon={financials.netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          positive={financials.netProfit >= 0}
          negative={financials.netProfit < 0}
        />
        <MetricCard
          label="Profit Margin"
          value={`${financials.margin.toFixed(1)}%`}
          icon={<PieChart className="h-4 w-4" />}
          positive={financials.margin >= 20}
          negative={financials.margin < 0}
        />
      </div>

      {/* Revenue Breakdown */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          Revenue Breakdown
        </h3>
        {invoices && invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number || 'Invoice'}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.issue_date ? format(new Date(inv.issue_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatCurrencyPrecise(Number(inv.amount_due))}</p>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-sm font-semibold">Total Invoiced</span>
              <span className="text-sm font-bold tabular-nums">{formatCurrencyPrecise(financials.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Collected</span>
              <span className="text-sm tabular-nums text-emerald-600">{formatCurrencyPrecise(financials.collected)}</span>
            </div>
            {financials.outstanding > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="text-sm tabular-nums text-amber-600">{formatCurrencyPrecise(financials.outstanding)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>No invoices yet.</p>
            <p className="text-xs mt-1">Contract value: {formatCurrency(financials.totalRevenue)}</p>
          </div>
        )}

        {/* Change Orders */}
        {changeOrders && changeOrders.length > 0 && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved Change Orders</p>
            {changeOrders.map(co => (
              <div key={co.id} className="flex items-center justify-between py-1">
                <span className="text-sm">{co.change_order_number || co.description}</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600">
                  +{formatCurrencyPrecise(Number(co.additional_cost))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cost Breakdown by Category */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-red-500" />
            Cost Breakdown
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddCost(!showAddCost)}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Cost
          </Button>
        </div>

        {/* Add Cost Form */}
        {showAddCost && (
          <AddCostForm
            jobId={job.id!}
            onAdd={async (data) => {
              await addCost(data);
              setShowAddCost(false);
            }}
            onCancel={() => setShowAddCost(false)}
          />
        )}

        {/* Category Cost Cards */}
        {totalCosts === 0 && !showAddCost ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No costs recorded yet.</p>
            <p className="text-xs mt-1">Add materials, labor, and other costs to track profitability.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {COST_CATEGORIES.map(cat => {
              const items = costsByCategory[cat.value] || [];
              const total = categoryTotals[cat.value] || 0;
              const pct = totalCosts > 0 ? (total / totalCosts) * 100 : 0;
              const Icon = cat.icon;
              const isExpanded = expandedCategory === cat.value;

              if (items.length === 0 && total === 0) return null;

              return (
                <Collapsible key={cat.value} open={isExpanded} onOpenChange={() => setExpandedCategory(isExpanded ? null : cat.value)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${cat.color} transition-colors`}>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{cat.label}</span>
                        <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold tabular-nums">{formatCurrencyPrecise(total)}</span>
                        <span className="text-xs ml-2 opacity-70">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Date</TableHead>
                            <TableHead className="text-xs">Description</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                            <TableHead className="w-8" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(cost => (
                            <TableRow key={cost.id}>
                              <TableCell className="text-xs tabular-nums">
                                {cost.cost_date ? format(new Date(cost.cost_date), 'MMM d') : '—'}
                              </TableCell>
                              <TableCell className="text-xs truncate max-w-[140px]">
                                {cost.description || '—'}
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium tabular-nums">
                                {formatCurrencyPrecise(Number(cost.amount))}
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this cost entry?')) {
                                      deleteCost(cost.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-destructive/10 rounded text-destructive/60 hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Cost Totals */}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-sm font-semibold">Total Costs</span>
              <span className="text-sm font-bold tabular-nums text-destructive">{formatCurrencyPrecise(totalCosts)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Estimate vs Actual */}
      {estimate && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Estimate vs Actual
          </h3>
          <div className="space-y-2">
            <ComparisonRow
              label="Revenue"
              estimated={Number(estimate.total_amount) || 0}
              actual={financials.totalRevenue}
              isRevenue
            />
            <ComparisonRow
              label="Total Costs"
              estimated={null}
              actual={financials.actualCosts}
            />
            <div className="border-t border-border pt-2">
              <ComparisonRow
                label="Net Profit"
                estimated={null}
                actual={financials.netProfit}
                isRevenue
              />
            </div>
          </div>
        </Card>
      )}

      {/* Profitability Insights */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Insights
        </h3>
        <div className="space-y-2 text-sm">
          {financials.margin >= 30 && (
            <InsightBadge type="positive" text={`Strong margin at ${financials.margin.toFixed(1)}% — well above industry average.`} />
          )}
          {financials.margin >= 15 && financials.margin < 30 && (
            <InsightBadge type="neutral" text={`Margin at ${financials.margin.toFixed(1)}% — healthy but room for improvement.`} />
          )}
          {financials.margin > 0 && financials.margin < 15 && (
            <InsightBadge type="warning" text={`Thin margin at ${financials.margin.toFixed(1)}% — review costs for savings.`} />
          )}
          {financials.margin <= 0 && financials.totalRevenue > 0 && (
            <InsightBadge type="negative" text={`Job is at a loss. Costs exceed revenue by ${formatCurrency(Math.abs(financials.netProfit))}.`} />
          )}
          {totalCosts > 0 && categoryTotals['materials'] > totalCosts * 0.5 && (
            <InsightBadge type="warning" text={`Materials account for ${((categoryTotals['materials'] / totalCosts) * 100).toFixed(0)}% of costs — check for savings.`} />
          )}
          {totalCosts > 0 && categoryTotals['labor'] > totalCosts * 0.4 && (
            <InsightBadge type="neutral" text={`Labor is ${((categoryTotals['labor'] / totalCosts) * 100).toFixed(0)}% of costs. Consider crew efficiency.`} />
          )}
          {financials.outstanding > 0 && (
            <InsightBadge type="warning" text={`${formatCurrency(financials.outstanding)} still outstanding — follow up on collections.`} />
          )}
          {totalCosts === 0 && financials.totalRevenue > 0 && (
            <InsightBadge type="neutral" text="No costs tracked yet. Start logging expenses for accurate profitability." />
          )}
        </div>
      </Card>

      {/* QB Enhanced Data */}
      {qbConnected && (
        <QBEnhancedJobData
          jobName={job.name}
          jobBudget={Number(job.budget_amount) || Number(job.contract_value) || 0}
          nativeCosts={totalCosts}
          nativeRevenue={financials.totalRevenue}
          qbConnected={true}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function MetricCard({ label, value, variance, icon, positive, negative }: {
  label: string;
  value: string;
  variance?: number | null;
  icon: React.ReactNode;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${negative ? 'text-destructive' : positive ? 'text-emerald-600' : ''}`}>
        {value}
      </p>
      {variance !== null && variance !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {variance >= 0 ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-destructive" />
          )}
          <span className={`text-xs tabular-nums ${variance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            {variance >= 0 ? '+' : ''}{formatCurrency(variance)} vs est
          </span>
        </div>
      )}
    </Card>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    SENT: 'bg-blue-100 text-blue-700 border-blue-200',
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    VIEWED: 'bg-amber-100 text-amber-700 border-amber-200',
    VOID: 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <Badge variant="outline" className={`text-[10px] py-0 ${variants[status] || variants.DRAFT}`}>
      {status}
    </Badge>
  );
}

function ComparisonRow({ label, estimated, actual, isRevenue }: {
  label: string;
  estimated: number | null;
  actual: number;
  isRevenue?: boolean;
}) {
  const variance = estimated !== null ? actual - estimated : null;
  const variancePct = estimated !== null && estimated !== 0 ? ((actual - estimated) / estimated) * 100 : null;
  // For revenue, positive variance is good. For costs, negative is good.
  const isGood = isRevenue ? (variance !== null && variance >= 0) : (variance !== null && variance <= 0);

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        {estimated !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">Est: {formatCurrency(estimated)}</span>
        )}
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(actual)}</span>
        {variance !== null && (
          <Badge variant="outline" className={`text-[10px] py-0 tabular-nums ${isGood ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {variance >= 0 ? '+' : ''}{variancePct?.toFixed(1)}%
          </Badge>
        )}
      </div>
    </div>
  );
}

function InsightBadge({ type, text }: { type: 'positive' | 'neutral' | 'warning' | 'negative'; text: string }) {
  const styles = {
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    neutral: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    negative: 'bg-red-50 border-red-200 text-red-800',
  };
  const icons = {
    positive: '✅',
    neutral: '📊',
    warning: '⚠️',
    negative: '🚨',
  };

  return (
    <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${styles[type]}`}>
      <span className="mr-1.5">{icons[type]}</span>
      {text}
    </div>
  );
}

function AddCostForm({ jobId, onAdd, onCancel }: {
  jobId: string;
  onAdd: (data: { category: string; description?: string; amount: number; cost_date: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState('materials');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [costDate, setCostDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({
        category,
        description: description || undefined,
        amount: Number(amount),
        cost_date: costDate,
      });
      toast.success('Cost added');
    } catch {
      // handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COST_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input
            type="date"
            value={costDate}
            onChange={(e) => setCostDate(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Amount</label>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
        <Textarea
          placeholder="e.g., Lumber from Home Depot"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting} className="flex-1">
          {submitting ? 'Saving...' : 'Save Cost'}
        </Button>
      </div>
    </div>
  );
}
