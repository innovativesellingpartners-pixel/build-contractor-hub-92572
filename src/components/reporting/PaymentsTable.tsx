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

interface PaymentsTableProps {
  filters: ReportingFilters;
}

export function PaymentsTable({ filters }: PaymentsTableProps) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["payments-table", filters],
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

      const { data } = await query;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const exportToCSV = () => {
    if (!jobs) return;

    const headers = ["Job ID", "Customer", "Budget Amount", "Status", "Balance", "Payment Status"];
    const rows = jobs.map((j) => [
      j.job_number || j.id.slice(0, 8),
      "-",
      j.budget_amount || 0,
      j.job_status,
      Number(j.budget_amount || 0),
      j.job_status === "completed" ? "Completed" : "In Progress",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Payments</h3>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Budget Amount</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => {
                const budget = Number(job.budget_amount || 0);
                const cost = Number(job.actual_cost || 0);
                const profit = budget - cost;
                const isCompleted = job.job_status === "completed";

                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.job_number || job.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>-</TableCell>
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
                    <TableCell>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        {job.job_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No payment data found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
