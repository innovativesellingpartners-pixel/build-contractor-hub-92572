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

interface EstimatesTableProps {
  filters: ReportingFilters;
}

export function EstimatesTable({ filters }: EstimatesTableProps) {
  const { data: estimates, isLoading } = useQuery({
    queryKey: ["estimates-table", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("estimates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        query = query.eq("trade_type", filters.tradeType);
      }
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data } = await query;
      return data;
    },
  });

  const exportToCSV = () => {
    if (!estimates) return;

    const headers = ["ID", "Date", "Client", "Trade", "Amount", "Status"];
    const rows = estimates.map((e) => [
      e.estimate_number || e.id.slice(0, 8),
      new Date(e.created_at).toLocaleDateString(),
      e.client_name || "-",
      e.trade_type || "-",
      e.total_amount || 0,
      e.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estimates.csv";
    a.click();
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "default",
      accepted: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Estimates</h3>
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
              <TableHead>Client</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates && estimates.length > 0 ? (
              estimates.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">
                    {estimate.estimate_number || estimate.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {new Date(estimate.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{estimate.client_name || "-"}</TableCell>
                  <TableCell>{estimate.trade_type || "-"}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(estimate.total_amount || 0)}
                  </TableCell>
                  <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No estimates found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
