import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceByRepChartProps {
  filters: ReportingFilters;
}

export function PerformanceByRepChart({ filters }: PerformanceByRepChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["performance-by-rep", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For now, show current user's performance
      // In future, can expand to show team performance for admins
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("user_id", user.id)
        .single();

      let estimatesQuery = supabase
        .from("estimates")
        .select("total_amount")
        .eq("user_id", user.id);

      let jobsQuery = supabase
        .from("jobs")
        .select("contract_amount, paid_amount, actual_cost, job_status")
        .eq("user_id", user.id)
        .in("job_status", ["completed", "in_progress"]);

      if (filters.dateFrom) {
        estimatesQuery = estimatesQuery.gte("created_at", filters.dateFrom);
        jobsQuery = jobsQuery.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        estimatesQuery = estimatesQuery.lte("created_at", filters.dateTo);
        jobsQuery = jobsQuery.lte("created_at", filters.dateTo);
      }

      const [{ data: estimates }, { data: jobs }] = await Promise.all([
        estimatesQuery,
        jobsQuery,
      ]);

      const estimatesWritten = estimates?.length || 0;
      const estimateValue = estimates?.reduce((sum, e) => sum + Number(e.total_amount || 0), 0) || 0;
      const jobsSold = jobs?.length || 0;
      const revenue = jobs?.reduce((sum, j) => sum + Number(j.paid_amount || 0), 0) || 0;
      const cogs = jobs?.reduce((sum, j) => sum + Number(j.actual_cost || 0), 0) || 0;
      const profit = revenue - cogs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return [
        {
          rep: profile?.company_name || "You",
          estimates: estimatesWritten,
          estimateValue,
          jobsSold,
          revenue,
          profit,
          margin,
        },
      ];
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
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {data.map((rep) => (
          <div key={rep.rep} className="space-y-2">
            <h4 className="font-semibold">{rep.rep}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimates:</span>
                <span className="font-medium">{rep.estimates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jobs Sold:</span>
                <span className="font-medium">{rep.jobsSold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(rep.revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(rep.profit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin:</span>
                <span className="font-medium">{rep.margin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
