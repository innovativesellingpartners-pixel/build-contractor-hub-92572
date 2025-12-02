import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, TrendingDown, Calculator, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobFinancialSummaryProps {
  jobId: string;
  estimatedCost?: number;
  actualCost?: number;
}

interface FinancialData {
  // Job-level aggregates (from database triggers)
  paymentsCollected: number;
  expensesTotal: number;
  profit: number;
  contractValue: number;
  changeOrdersTotal: number;
  totalContractValue: number;
  // Detailed breakdowns
  totalMaterialsCost: number;
  totalChangeOrdersCost: number;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  materialsCount: number;
  changeOrdersCount: number;
  invoicesCount: number;
}

export function JobFinancialSummary({ jobId, estimatedCost = 0, actualCost = 0 }: JobFinancialSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialData>({
    paymentsCollected: 0,
    expensesTotal: 0,
    profit: 0,
    contractValue: 0,
    changeOrdersTotal: 0,
    totalContractValue: 0,
    totalMaterialsCost: 0,
    totalChangeOrdersCost: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    materialsCount: 0,
    changeOrdersCount: 0,
    invoicesCount: 0,
  });

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // Load job-level financial data (maintained by database triggers)
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('contract_value, change_orders_total, total_contract_value, payments_collected, expenses_total, profit')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Load materials for detailed breakdown
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('total_cost')
        .eq('job_id', jobId);

      if (materialsError) throw materialsError;

      // Load change orders for detailed breakdown
      const { data: changeOrders, error: changeOrdersError } = await supabase
        .from('change_orders')
        .select('additional_cost, status')
        .eq('job_id', jobId);

      if (changeOrdersError) throw changeOrdersError;

      // Load invoices for detailed breakdown
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount_due, amount_paid, status')
        .eq('job_id', jobId);

      if (invoicesError) throw invoicesError;

      // Calculate detailed totals
      const totalMaterialsCost = materials?.reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
      
      const approvedChangeOrders = changeOrders?.filter(co => co.status === 'approved') || [];
      const totalChangeOrdersCost = approvedChangeOrders.reduce((sum, co) => sum + (co.additional_cost || 0), 0);

      const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.amount_due || 0), 0) || 0;
      const totalPaid = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
      const totalPending = totalInvoiced - totalPaid;

      setData({
        // Job-level aggregates from triggers
        paymentsCollected: job?.payments_collected || 0,
        expensesTotal: job?.expenses_total || 0,
        profit: job?.profit || 0,
        contractValue: job?.contract_value || 0,
        changeOrdersTotal: job?.change_orders_total || 0,
        totalContractValue: job?.total_contract_value || 0,
        // Detailed breakdowns
        totalMaterialsCost,
        totalChangeOrdersCost,
        totalInvoiced,
        totalPaid,
        totalPending,
        materialsCount: materials?.length || 0,
        changeOrdersCount: approvedChangeOrders.length,
        invoicesCount: invoices?.length || 0,
      });
    } catch (error: any) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [jobId]);

  // Use job-level aggregates (maintained by triggers) for primary display
  const totalCosts = data.expensesTotal || (data.totalMaterialsCost + data.totalChangeOrdersCost + actualCost);
  const totalRevenue = data.paymentsCollected || data.totalPaid;
  const jobProfit = data.profit || (totalRevenue - totalCosts);
  const profitMargin = totalRevenue > 0 ? (jobProfit / totalRevenue) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading financial data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Summary
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Value Section */}
        {data.totalContractValue > 0 && (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Contract Value
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Original Contract</p>
                  <p className="text-lg font-bold">${data.contractValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Change Orders</p>
                  <p className="text-lg font-bold text-blue-600">+${data.changeOrdersTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground">Total Contract Value</p>
                  <p className="text-xl font-bold text-primary">${data.totalContractValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Revenue Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Payments Collected
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-xl font-bold text-green-600">${data.paymentsCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Invoiced</p>
              <p className="text-lg font-bold">${data.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-orange-600">${data.totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Invoices</p>
              <Badge variant="secondary">{data.invoicesCount}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Costs/Expenses Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Expenses
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-destructive">${data.expensesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Estimated Budget</p>
              <p className="text-lg font-bold">${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Materials ({data.materialsCount})</p>
              <p className="text-sm font-semibold">${data.totalMaterialsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Change Orders ({data.changeOrdersCount})</p>
              <p className="text-sm font-semibold">${data.totalChangeOrdersCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Profit Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Profit
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Job Profit</p>
              <p className={`text-xl font-bold ${jobProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {jobProfit < 0 ? '-' : ''}${Math.abs(jobProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Profit Margin</p>
              <p className={`text-xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {estimatedCost > 0 && totalCosts > estimatedCost && (
            <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
              <p className="text-xs text-orange-600 font-medium">
                ⚠️ Over budget by ${(totalCosts - estimatedCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
