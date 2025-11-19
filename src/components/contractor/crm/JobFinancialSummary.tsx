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
      // Load materials
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('total_cost')
        .eq('job_id', jobId);

      if (materialsError) throw materialsError;

      // Load change orders
      const { data: changeOrders, error: changeOrdersError } = await supabase
        .from('change_orders')
        .select('additional_cost, status')
        .eq('job_id', jobId);

      if (changeOrdersError) throw changeOrdersError;

      // Load invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount_due, amount_paid, status')
        .eq('job_id', jobId);

      if (invoicesError) throw invoicesError;

      // Calculate totals
      const totalMaterialsCost = materials?.reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
      
      const approvedChangeOrders = changeOrders?.filter(co => co.status === 'approved') || [];
      const totalChangeOrdersCost = approvedChangeOrders.reduce((sum, co) => sum + (co.additional_cost || 0), 0);

      const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.amount_due || 0), 0) || 0;
      const totalPaid = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
      const totalPending = totalInvoiced - totalPaid;

      setData({
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

  const totalCosts = data.totalMaterialsCost + data.totalChangeOrdersCost + actualCost;
  const totalRevenue = data.totalPaid;
  const projectedProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (projectedProfit / totalRevenue) * 100 : 0;

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
        {/* Revenue Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Invoiced</p>
              <p className="text-lg font-bold">${data.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-lg font-bold text-green-600">${data.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

        {/* Costs Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Costs
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Estimated Budget</p>
              <p className="text-lg font-bold">${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Actual Costs</p>
              <p className="text-lg font-bold">${actualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Materials ({data.materialsCount})</p>
              <p className="text-sm font-semibold">${data.totalMaterialsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Change Orders ({data.changeOrdersCount})</p>
              <p className="text-sm font-semibold">${data.totalChangeOrdersCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground">Total Costs</p>
              <p className="text-xl font-bold text-destructive">${totalCosts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Profit Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Profit Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Projected Profit</p>
              <p className={`text-xl font-bold ${projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(projectedProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
