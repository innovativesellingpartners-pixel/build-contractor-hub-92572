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

interface UnclosedStalledTableProps {
  filters: ReportingFilters;
}

export function UnclosedStalledTable({ filters }: UnclosedStalledTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["unclosed-stalled", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get unsold estimates
      let estimatesQuery = supabase
        .from("estimates")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["draft", "rejected", "sent"]);

      if (filters.dateFrom) estimatesQuery = estimatesQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) estimatesQuery = estimatesQuery.lte("created_at", filters.dateTo);

      // Get stalled/on hold jobs
      let jobsQuery = supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("job_status", "on_hold");

      if (filters.dateFrom) jobsQuery = jobsQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) jobsQuery = jobsQuery.lte("created_at", filters.dateTo);

      const [{ data: estimates }, { data: jobs }] = await Promise.all([
        estimatesQuery,
        jobsQuery,
      ]);

      const estimateItems = (estimates || []).map((e) => ({
        id: e.estimate_number || e.id.slice(0, 8),
        type: "Estimate",
        status: e.status,
        value: e.total_amount,
        createdAt: e.created_at,
        customer: e.client_name,
      }));

      const jobItems = (jobs || []).map((j) => ({
        id: j.job_number || j.id.slice(0, 8),
        type: "Job",
        status: j.job_status,
        value: j.budget_amount,
        createdAt: j.created_at,
        customer: "-",
      }));

      return [...estimateItems, ...jobItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const exportToCSV = () => {
    if (!data) return;

    const headers = ["ID", "Type", "Status", "Value", "Age (Days)", "Customer"];
    const rows = data.map((item) => {
      const ageInDays = Math.floor(
        (new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return [
        item.id,
        item.type,
        item.status,
        item.value || 0,
        ageInDays,
        item.customer || "-",
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unclosed-stalled.csv";
    a.click();
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Unclosed & Stalled</h3>
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
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Age (Days)</TableHead>
              <TableHead>Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((item, index) => {
                const ageInDays = Math.floor(
                  (new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <TableRow key={`${item.type}-${item.id}-${index}`}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(item.value || 0)}
                    </TableCell>
                    <TableCell className="text-right">{ageInDays}</TableCell>
                    <TableCell>{item.customer || "-"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No unclosed or stalled items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
