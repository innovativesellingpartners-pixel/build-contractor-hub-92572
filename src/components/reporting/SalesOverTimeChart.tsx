import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesOverTimeChartProps {
  filters: ReportingFilters;
}

export function SalesOverTimeChart({ filters }: SalesOverTimeChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["sales-over-time", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("jobs")
        .select("created_at, contract_amount, job_status")
        .eq("user_id", user.id)
        .in("job_status", ["completed", "in_progress"]);

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        query = query.eq("trade_type", filters.tradeType);
      }

      const { data: jobs } = await query;

      // Group by month
      const groupedData: Record<string, number> = {};
      jobs?.forEach((job) => {
        const date = new Date(job.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        groupedData[monthKey] = (groupedData[monthKey] || 0) + Number(job.contract_amount || 0);
      });

      return Object.entries(groupedData)
        .map(([month, amount]) => ({
          month,
          amount,
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
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(value)
          }
        />
        <Legend />
        <Bar dataKey="amount" name="Sales" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}
