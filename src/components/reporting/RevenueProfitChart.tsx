import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueProfitChartProps {
  filters: ReportingFilters;
}

export function RevenueProfitChart({ filters }: RevenueProfitChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["revenue-profit", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("jobs")
        .select("created_at, paid_amount, actual_cost, contract_amount")
        .eq("user_id", user.id)
        .in("job_status", ["completed", "in_progress"]);

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        query = query.eq("trade_type", filters.tradeType);
      }

      const { data: jobs } = await query;

      // Group by month
      const groupedData: Record<string, { revenue: number; cogs: number; profit: number }> = {};
      jobs?.forEach((job) => {
        const date = new Date(job.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!groupedData[monthKey]) {
          groupedData[monthKey] = { revenue: 0, cogs: 0, profit: 0 };
        }
        
        const revenue = Number(job.paid_amount || 0);
        const cogs = Number(job.actual_cost || 0);
        
        groupedData[monthKey].revenue += revenue;
        groupedData[monthKey].cogs += cogs;
        groupedData[monthKey].profit += revenue - cogs;
      });

      return Object.entries(groupedData)
        .map(([month, values]) => ({
          month,
          revenue: values.revenue,
          cogs: values.cogs,
          profit: values.profit,
          margin: values.revenue > 0 ? (values.profit / values.revenue) * 100 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "margin") return `${value.toFixed(1)}%`;
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(value);
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="hsl(217, 91%, 60%)" />
        <Bar yAxisId="left" dataKey="cogs" name="COGS" fill="hsl(var(--destructive))" />
        <Bar yAxisId="left" dataKey="profit" name="Profit" fill="hsl(142, 76%, 36%)" />
        <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin %" stroke="hsl(var(--primary))" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
