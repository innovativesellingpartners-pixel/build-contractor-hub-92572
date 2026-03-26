import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface JobProfitabilityProps {
  filters: ReportingFilters;
}

export function JobProfitability({ filters }: JobProfitabilityProps) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-profitability", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("jobs")
        .select(`
          id,
          name,
          budget_amount,
          actual_cost,
          job_status,
          created_at,
          customers (
            name
          )
        `)
        .eq("user_id", user.id)
        .in("job_status", ["completed", "in_progress"]);

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        query = query.eq("trade_type", filters.tradeType);
      }

      const { data } = await query;

      // Fetch sub assignment costs per job
      const jobIds = (data || []).map((j: any) => j.id);
      const { data: subAssigns } = jobIds.length > 0
        ? await supabase
            .from("sub_assignments")
            .select("job_id, agreed_amount, status")
            .in("job_id", jobIds)
            .in("status", ["accepted", "in_progress", "completed", "paid"])
        : { data: [] };

      // Calculate profitability metrics for each job
      return data?.map((job) => {
        const revenue = Number(job.budget_amount) || 0;
        const baseCost = Number(job.actual_cost) || 0;
        const subCost = (subAssigns || [])
          .filter((s: any) => s.job_id === job.id)
          .reduce((sum: number, s: any) => sum + Number(s.agreed_amount || 0), 0);
        const cost = baseCost + subCost;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          id: job.id,
          name: job.name || "Unnamed Job",
          customerName: (job.customers as any)?.name || "Unknown",
          revenue,
          cost,
          profit,
          margin,
          status: job.job_status,
        };
      }).sort((a, b) => b.profit - a.profit) || [];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No job data available
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

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return "bg-green-500/10 text-green-600 border-green-600/20";
    if (margin >= 15) return "bg-blue-500/10 text-blue-600 border-blue-600/20";
    if (margin >= 0) return "bg-yellow-500/10 text-yellow-600 border-yellow-600/20";
    return "bg-red-500/10 text-red-600 border-red-600/20";
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.name}</TableCell>
                <TableCell>{job.customerName}</TableCell>
                <TableCell className="text-right">{formatCurrency(job.revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(job.cost)}</TableCell>
                <TableCell className="text-right">
                  <span className={job.profit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {formatCurrency(job.profit)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={getMarginColor(job.margin)}>
                    {formatPercent(job.margin)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {job.status === "completed" ? "Completed" : "In Progress"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
