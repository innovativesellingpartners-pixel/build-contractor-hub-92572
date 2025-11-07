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

      // Apply date filters
      if (filters.dateFrom) {
        estimatesQuery = estimatesQuery.gte("created_at", filters.dateFrom);
        jobsQuery = jobsQuery.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        estimatesQuery = estimatesQuery.lte("created_at", filters.dateTo);
        jobsQuery = jobsQuery.lte("created_at", filters.dateTo);
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

      const totalRevenue = totalSoldValue; // Using budget_amount as revenue proxy
      const totalCOGS = soldJobs.reduce(
        (sum, j) => sum + (Number(j.actual_cost) || 0),
        0
      );
      const grossProfit = totalRevenue - totalCOGS;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

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
          cogs: totalCOGS,
          grossProfit,
          margin: profitMargin,
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
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Estimates</p>
            <p className="text-2xl font-bold">{kpis?.estimates.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(kpis?.estimates.value || 0)}
            </p>
          </div>
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
            <p className="text-2xl font-bold">
              {formatPercent(kpis?.estimates.conversionRate || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis?.sales.totalSold || 0} jobs sold
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">
              {formatCurrency(kpis?.profitability.revenue || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(kpis?.sales.totalValue || 0)} contracted
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
            <p className="text-2xl font-bold">
              {formatPercent(kpis?.profitability.margin || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(kpis?.profitability.grossProfit || 0)} profit
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg Estimate</p>
            <p className="text-2xl font-bold">
              {formatCurrency(kpis?.estimates.average || 0)}
            </p>
          </div>
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg Sale Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(kpis?.sales.averageValue || 0)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Jobs Fully Paid</p>
            <p className="text-2xl font-bold">{kpis?.payments.fullyPaid || 0}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold">{kpis?.payments.withBalance || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">jobs</p>
          </div>
          <AlertCircle className="h-8 w-8 text-orange-500" />
        </div>
      </Card>
    </div>
  );
}
