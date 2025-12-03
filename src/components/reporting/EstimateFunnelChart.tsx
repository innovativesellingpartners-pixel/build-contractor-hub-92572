import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Skeleton } from "@/components/ui/skeleton";

interface EstimateFunnelChartProps {
  filters: ReportingFilters;
}

const COLORS = ["hsl(210, 80%, 55%)", "hsl(270, 70%, 55%)", "hsl(140, 60%, 45%)", "hsl(30, 90%, 55%)", "hsl(350, 70%, 55%)"];

export function EstimateFunnelChart({ filters }: EstimateFunnelChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["estimate-funnel", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all pipeline data
      let leadsQuery = supabase.from("leads").select("id, status, created_at").eq("user_id", user.id);
      let estimatesQuery = supabase.from("estimates").select("id, status, sent_at, signed_at, lead_id, created_at").eq("user_id", user.id);
      let customersQuery = supabase.from("customers").select("id, estimate_id, created_at").eq("user_id", user.id);
      let jobsQuery = supabase.from("jobs").select("id, customer_id, job_status, created_at").eq("user_id", user.id);

      // Apply date filters
      if (filters.dateFrom) {
        leadsQuery = leadsQuery.gte("created_at", filters.dateFrom);
        estimatesQuery = estimatesQuery.gte("created_at", filters.dateFrom);
        customersQuery = customersQuery.gte("created_at", filters.dateFrom);
        jobsQuery = jobsQuery.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        leadsQuery = leadsQuery.lte("created_at", filters.dateTo);
        estimatesQuery = estimatesQuery.lte("created_at", filters.dateTo);
        customersQuery = customersQuery.lte("created_at", filters.dateTo);
        jobsQuery = jobsQuery.lte("created_at", filters.dateTo);
      }

      const [leadsRes, estimatesRes, customersRes, jobsRes] = await Promise.all([
        leadsQuery,
        estimatesQuery,
        customersQuery,
        jobsQuery,
      ]);

      const leads = leadsRes.data || [];
      const estimates = estimatesRes.data || [];
      const customers = customersRes.data || [];
      const jobs = jobsRes.data || [];

      const totalLeads = leads.length;
      const totalEstimates = estimates.length;
      const sentEstimates = estimates.filter((e) => e.sent_at).length;
      const acceptedEstimates = estimates.filter((e) => e.status === "accepted" || e.status === "sold" || e.signed_at).length;
      const totalCustomers = customers.length;
      const totalJobs = jobs.length;

      return [
        { stage: "Leads", count: totalLeads, conversion: 100 },
        { stage: "Estimates", count: totalEstimates, conversion: totalLeads > 0 ? (totalEstimates / totalLeads) * 100 : 0 },
        { stage: "Sent", count: sentEstimates, conversion: totalEstimates > 0 ? (sentEstimates / totalEstimates) * 100 : 0 },
        { stage: "Accepted", count: acceptedEstimates, conversion: sentEstimates > 0 ? (acceptedEstimates / sentEstimates) * 100 : 0 },
        { stage: "Customers", count: totalCustomers, conversion: acceptedEstimates > 0 ? (totalCustomers / acceptedEstimates) * 100 : 0 },
        { stage: "Jobs", count: totalJobs, conversion: totalCustomers > 0 ? (totalJobs / totalCustomers) * 100 : 0 },
      ];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data || data.every(d => d.count === 0)) {
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
        <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
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