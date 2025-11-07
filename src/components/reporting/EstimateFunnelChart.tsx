import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Skeleton } from "@/components/ui/skeleton";

interface EstimateFunnelChartProps {
  filters: ReportingFilters;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(217, 91%, 60%)"];

export function EstimateFunnelChart({ filters }: EstimateFunnelChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["estimate-funnel", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase.from("estimates").select("*").eq("user_id", user.id);

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        query = query.eq("trade_type", filters.tradeType);
      }

      const { data: estimates } = await query;

      const created = estimates?.length || 0;
      const sent = estimates?.filter((e) => e.sent_at).length || 0;
      const accepted = estimates?.filter((e) => e.status === "accepted" || e.signed_at).length || 0;

      // Get sold jobs count
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", user.id)
        .in("job_status", ["completed", "in_progress"]);

      const sold = jobs?.length || 0;

      return [
        { stage: "Created", count: created, conversion: 100 },
        { stage: "Sent", count: sent, conversion: created > 0 ? (sent / created) * 100 : 0 },
        { stage: "Accepted", count: accepted, conversion: sent > 0 ? (accepted / sent) * 100 : 0 },
        { stage: "Sold", count: sold, conversion: accepted > 0 ? (sold / accepted) * 100 : 0 },
      ];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data) {
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
        <XAxis dataKey="stage" />
        <YAxis />
        <Tooltip
          content={({ payload }) => {
            if (!payload || !payload.length) return null;
            const data = payload[0].payload;
            return (
              <div className="bg-background border rounded-lg p-3 shadow-lg">
                <p className="font-semibold">{data.stage}</p>
                <p className="text-sm">Count: {data.count}</p>
                <p className="text-sm">Conversion: {data.conversion.toFixed(1)}%</p>
              </div>
            );
          }}
        />
        <Bar dataKey="count" name="Count">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
