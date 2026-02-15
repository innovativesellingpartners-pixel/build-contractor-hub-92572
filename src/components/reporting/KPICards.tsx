import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  filters: ReportingFilters;
}

const variantAccent: Record<string, string> = {
  green: "bg-green-500/8 text-green-600 dark:text-green-400",
  blue: "bg-blue-500/8 text-blue-600 dark:text-blue-400",
  orange: "bg-orange-500/8 text-orange-600 dark:text-orange-400",
  red: "bg-red-500/8 text-red-600 dark:text-red-400",
  purple: "bg-purple-500/8 text-purple-600 dark:text-purple-400",
  primary: "bg-primary/8 text-primary",
};

function MetricCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight break-words">{value}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", variantAccent[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
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
          <Card key={i} className="p-5">
            <Skeleton className="h-20 w-full rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total Revenue" value={formatCurrency(kpis?.profitability.revenue || 0)} sub={`${kpis?.sales.totalSold || 0} jobs`} icon={<DollarSign className="h-4 w-4" />} color="green" />
      <MetricCard label="Gross Profit" value={formatCurrency(kpis?.profitability.grossProfit || 0)} sub={formatPercent(kpis?.profitability.grossMargin || 0)} icon={<TrendingUp className="h-4 w-4" />} color="green" />
      <MetricCard label="Operating Income" value={formatCurrency(kpis?.profitability.operatingIncome || 0)} sub={formatPercent(kpis?.profitability.operatingMargin || 0)} icon={<DollarSign className="h-4 w-4" />} color="blue" />
      <MetricCard label="Net Income" value={formatCurrency(kpis?.profitability.netIncome || 0)} sub={formatPercent(kpis?.profitability.netMargin || 0)} icon={<TrendingUp className="h-4 w-4" />} color="primary" />
      <MetricCard label="COGS" value={formatCurrency(kpis?.profitability.cogs || 0)} icon={<AlertCircle className="h-4 w-4" />} color="orange" />
      <MetricCard label="Operating Expenses" value={formatCurrency(kpis?.profitability.operatingExpenses || 0)} icon={<AlertCircle className="h-4 w-4" />} color="red" />
      <MetricCard label="Accounts Receivable" value={formatCurrency(kpis?.financial.accountsReceivable || 0)} icon={<DollarSign className="h-4 w-4" />} color="orange" />
      <MetricCard label="Conversion Rate" value={formatPercent(kpis?.estimates.conversionRate || 0)} sub={`${kpis?.sales.totalSold || 0} sold`} icon={<CheckCircle className="h-4 w-4" />} color="purple" />
    </div>
  );
}
