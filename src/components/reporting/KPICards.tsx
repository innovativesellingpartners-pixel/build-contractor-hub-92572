import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";

interface KPICardsProps {
  filters: ReportingFilters;
}

export function KPICards({ filters }: KPICardsProps) {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["reporting-kpis", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build query with filters
      let estimatesQuery = supabase
        .from("estimates")
        .select("*")
        .eq("user_id", user.id);

      let jobsQuery = supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id);

      // Apply date filters (skip for "all_time")
      if (filters.dateRange !== "all_time") {
        if (filters.dateFrom) {
          estimatesQuery = estimatesQuery.gte("created_at", filters.dateFrom);
          jobsQuery = jobsQuery.gte("created_at", filters.dateFrom);
        }
        if (filters.dateTo) {
          estimatesQuery = estimatesQuery.lte("created_at", filters.dateTo);
          jobsQuery = jobsQuery.lte("created_at", filters.dateTo);
        }
      }

      // Apply trade filter
      if (filters.tradeType && filters.tradeType !== "all") {
        estimatesQuery = estimatesQuery.eq("trade_type", filters.tradeType);
        jobsQuery = jobsQuery.eq("trade_type", filters.tradeType);
      }

      // Apply status filter
      if (filters.status && filters.status !== "all") {
        estimatesQuery = estimatesQuery.eq("status", filters.status);
      }

      const [{ data: estimates }, { data: jobs }] = await Promise.all([
        estimatesQuery,
        jobsQuery,
      ]);

      // Calculate KPIs
      const totalEstimates = estimates?.length || 0;
      const totalEstimateValue = estimates?.reduce((sum, e) => sum + (Number(e.total_amount) || 0), 0) || 0;
      const avgEstimateValue = totalEstimates > 0 ? totalEstimateValue / totalEstimates : 0;

      const soldJobs = jobs?.filter((j) => j.job_status === "completed" || j.job_status === "in_progress") || [];
      const totalJobsSold = soldJobs.length;
      const totalSoldValue = soldJobs.reduce((sum, j) => sum + (Number(j.budget_amount) || 0), 0);
      const conversionRate = totalEstimates > 0 ? (totalJobsSold / totalEstimates) * 100 : 0;

      // Get additional financial data
      const { data: jobCosts } = await supabase
        .from("job_costs")
        .select("amount")
        .eq("user_id", user.id);

      const { data: materials } = await supabase
        .from("materials")
        .select("total_cost")
        .eq("user_id", user.id);

      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount_due, amount_paid")
        .eq("user_id", user.id);

      const totalRevenue = totalSoldValue;
      const totalCOGS = soldJobs.reduce((sum, j) => sum + (Number(j.actual_cost) || 0), 0);
      const materialsCosts = materials?.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0) || 0;
      const totalDirectCosts = totalCOGS + materialsCosts;
      const grossProfit = totalRevenue - totalDirectCosts;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      const operatingExpenses = jobCosts?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;
      const operatingIncome = grossProfit - operatingExpenses;
      const operatingMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;

      const netIncome = operatingIncome;
      const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

      const totalAR = invoices?.reduce((sum, inv) => {
        const due = Number(inv.amount_due) || 0;
        const paid = Number(inv.amount_paid) || 0;
        return sum + Math.max(0, due - paid);
      }, 0) || 0;

      // Payment tracking would need invoices table - simplify for now
      const jobsFullyPaid = soldJobs.filter((j) => j.job_status === "completed").length;
      const jobsWithBalance = totalJobsSold - jobsFullyPaid;

      return {
        estimates: {
          total: totalEstimates,
          value: totalEstimateValue,
          average: avgEstimateValue,
          conversionRate,
        },
        sales: {
          totalSold: totalJobsSold,
          totalValue: totalSoldValue,
          averageValue: totalJobsSold > 0 ? totalSoldValue / totalJobsSold : 0,
        },
        profitability: {
          revenue: totalRevenue,
          cogs: totalDirectCosts,
          grossProfit,
          grossMargin,
          operatingExpenses,
          operatingIncome,
          operatingMargin,
          netIncome,
          netMargin,
        },
        financial: {
          accountsReceivable: totalAR,
        },
        payments: {
          fullyPaid: jobsFullyPaid,
          withBalance: jobsWithBalance,
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 border-l-4 border-l-green-600/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.profitability.revenue || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{kpis?.sales.totalSold || 0} jobs</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-green-600/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-green-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Gross Profit</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.profitability.grossProfit || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{formatPercent(kpis?.profitability.grossMargin || 0)}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-blue-600/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Operating Income</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.profitability.operatingIncome || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{formatPercent(kpis?.profitability.operatingMargin || 0)}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-blue-600/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-primary/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Net Income</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.profitability.netIncome || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{formatPercent(kpis?.profitability.netMargin || 0)}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-orange-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">COGS</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.profitability.cogs || 0)}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-red-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Operating Expenses</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.profitability.operatingExpenses || 0)}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-orange-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Accounts Receivable</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatCurrency(kpis?.financial.accountsReceivable || 0)}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-4 w-4 text-orange-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-purple-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Conversion Rate</p>
            <p className="text-2xl font-bold mt-1 break-words">{formatPercent(kpis?.estimates.conversionRate || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{kpis?.sales.totalSold || 0} sold</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
