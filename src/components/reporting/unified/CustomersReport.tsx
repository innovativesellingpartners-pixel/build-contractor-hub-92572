/**
 * CustomersReport — Unified customer intelligence merging myCT1 + QB customer data.
 * Shows directory, lifetime value, acquisition, top customers.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBCustomers } from "@/hooks/useQuickBooksQuery";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ReportMetricCard } from "./ReportMetricCard";
import { ReportEmptyState } from "./ReportEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, UserPlus, TrendingUp } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function CustomersReport() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });
  const [search, setSearch] = useState("");

  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-cust", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const { data: qbCustomers } = useQBCustomers(!!qbConnected);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers-report", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase.from("customers").select("id, name, email, phone, company, created_at, lifetime_value, referral_source").eq("user_id", user.id);
      if (dateRange.start) q = q.gte("created_at", dateRange.start);
      if (dateRange.end) q = q.lte("created_at", dateRange.end);
      const { data } = await q.order("lifetime_value", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const totalLTV = customers?.reduce((s, c) => s + Number(c.lifetime_value || 0), 0) || 0;
  const avgLTV = customers?.length ? totalLTV / customers.length : 0;

  const filtered = customers?.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground">Customer intelligence from all sources</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard title="Total Customers" value={String(customers?.length || 0)} subtitle="myCT1 records" icon={<Users className="h-4 w-4 text-blue-600" />} variant="info" />
        <ReportMetricCard title="Total Lifetime Value" value={fmt(totalLTV)} subtitle="All customers" icon={<DollarSign className="h-4 w-4 text-green-600" />} variant="success" />
        <ReportMetricCard title="Avg Customer Value" value={fmt(avgLTV)} subtitle="Per customer" icon={<TrendingUp className="h-4 w-4 text-primary" />} variant="default" />
        {qbConnected && <ReportMetricCard title="QB Customers" value={String(qbCustomers?.length || 0)} subtitle="From connected accounting" icon={<UserPlus className="h-4 w-4 text-green-600" />} variant="success" />}
      </div>

      {/* Search */}
      <Input
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Customer directory table */}
      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Lifetime Value</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell>{c.company || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmt(Number(c.lifetime_value || 0))}</TableCell>
                      <TableCell>{c.referral_source ? <Badge variant="outline" className="text-xs">{c.referral_source}</Badge> : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReportEmptyState title="No customers found" description="Try adjusting your search or date range." />
      )}

      {/* QB Customers */}
      {qbConnected && qbCustomers && qbCustomers.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">QB Customer Balances</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qbCustomers.slice(0, 25).map((c: any) => (
                    <TableRow key={c.Id}>
                      <TableCell className="font-medium">{c.DisplayName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.PrimaryEmailAddr?.Address || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(c.Balance || "0"))}</TableCell>
                      <TableCell><Badge variant={c.Active ? "default" : "secondary"} className="text-xs">{c.Active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
