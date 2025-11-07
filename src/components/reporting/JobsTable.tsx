import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface JobsTableProps {
  filters: ReportingFilters;
}

export function JobsTable({ filters }: JobsTableProps) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs-table", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        query = query.eq("trade_type", filters.tradeType);
      }

      const { data } = await query;
      return data;
    },
  });

  const exportToCSV = () => {
    if (!jobs) return;

    const headers = ["ID", "Date", "Customer", "Trade", "Status", "Budget", "Cost", "Profit", "Margin %"];
    const rows = jobs.map((j) => {
      const budget = Number(j.budget_amount || 0);
      const cost = Number(j.actual_cost || 0);
      const profit = budget - cost;
      const margin = budget > 0 ? (profit / budget) * 100 : 0;
      return [
        j.job_number || j.id.slice(0, 8),
        new Date(j.created_at).toLocaleDateString(),
        "-",
        j.trade_type || "-",
        j.job_status,
        budget,
        cost,
        profit,
        margin.toFixed(1),
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobs.csv";
    a.click();
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Jobs</h3>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => {
                const budget = Number(job.budget_amount || 0);
                const cost = Number(job.actual_cost || 0);
                const profit = budget - cost;
                const margin = budget > 0 ? (profit / budget) * 100 : 0;

                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.job_number || job.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {new Date(job.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{job.trade_type || "-"}</TableCell>
                    <TableCell>
                      <Badge>{job.job_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(budget)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No jobs found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
