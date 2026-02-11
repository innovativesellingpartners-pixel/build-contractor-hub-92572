/**
 * CustomersReport — Customer intelligence with full drill-down interactivity.
 * All metric cards and customer rows are clickable → detail panel.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBCustomers } from "@/hooks/useQuickBooksQuery";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveTable, TableColumn } from "../drilldown/InteractiveTable";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { ReportEmptyState } from "./ReportEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, UserPlus, TrendingUp } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function CustomersReport() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });

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

  const customerColumns: TableColumn<any>[] = [
    { key: "name", label: "Name", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "email", label: "Email", render: (row) => <span className="text-muted-foreground">{row.email || "—"}</span> },
    { key: "company", label: "Company" },
    { key: "lifetime_value", label: "Lifetime Value", align: "right", render: (row) => <span className="font-medium tabular-nums">{fmt(Number(row.lifetime_value || 0))}</span> },
    { key: "referral_source", label: "Source", render: (row) => row.referral_source ? <Badge variant="outline" className="text-xs">{row.referral_source}</Badge> : "—" },
    { key: "created_at", label: "Added", render: (row) => <span className="text-muted-foreground text-xs">{new Date(row.created_at).toLocaleDateString()}</span> },
  ];

  const qbColumns: TableColumn<any>[] = [
    { key: "DisplayName", label: "Name", render: (row) => <span className="font-medium">{row.DisplayName}</span> },
    { key: "Email", label: "Email", render: (row) => <span className="text-muted-foreground">{row.PrimaryEmailAddr?.Address || "—"}</span> },
    { key: "Balance", label: "Balance", align: "right", render: (row) => <span className="font-medium tabular-nums">{fmt(parseFloat(row.Balance || "0"))}</span> },
    { key: "Active", label: "Status", render: (row) => <Badge variant={row.Active ? "default" : "secondary"} className="text-xs">{row.Active ? "Active" : "Inactive"}</Badge> },
  ];

  return (
    <InteractiveReportShell
      title="Customers"
      subtitle="Customer intelligence from all sources"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard title="Total Customers" value={String(customers?.length || 0)} subtitle="myCT1 records" icon={<Users className="h-4 w-4 text-blue-600" />} variant="info"
          onClick={() => { const first = customers?.[0]; if (first) openPanel({ type: "customer", title: first.name, data: first }); }}
          breakdown={[{ label: "Total", value: String(customers?.length || 0) }]}
        />
        <InteractiveMetricCard title="Total Lifetime Value" value={fmt(totalLTV)} subtitle="All customers" icon={<DollarSign className="h-4 w-4 text-green-600" />} variant="success"
          onClick={() => openPanel({ type: "category-breakdown", title: "Customer Revenue", data: { category: "Customer Revenue", type: "revenue", totalAmount: totalLTV } })}
          breakdown={customers?.slice(0, 3).map((c: any) => ({ label: c.name, value: fmt(Number(c.lifetime_value || 0)) }))}
        />
        <InteractiveMetricCard title="Avg Customer Value" value={fmt(avgLTV)} subtitle="Per customer" icon={<TrendingUp className="h-4 w-4 text-primary" />} variant="default"
          onClick={() => openPanel({ type: "category-breakdown", title: "Average Customer Value", data: { category: "Customer Value", type: "revenue", totalAmount: totalLTV } })}
          breakdown={[{ label: "Total LTV", value: fmt(totalLTV) }, { label: "Customers", value: String(customers?.length || 0) }]}
        />
        {qbConnected && <InteractiveMetricCard title="QB Customers" value={String(qbCustomers?.length || 0)} subtitle="From connected accounting" icon={<UserPlus className="h-4 w-4 text-green-600" />} variant="success"
          onClick={() => { const first = qbCustomers?.[0]; if (first) openPanel({ type: "customer", title: first.DisplayName, data: { name: first.DisplayName, email: first.PrimaryEmailAddr?.Address } }); }}
        />}
      </div>

      {/* Customer directory — clickable rows */}
      {customers && customers.length > 0 ? (
        <InteractiveTable
          title="Customer Directory"
          data={customers}
          columns={customerColumns}
          onRowClick={(row) => openPanel({
            type: "customer",
            title: row.name,
            data: row,
          })}
          searchKeys={["name", "email", "company"]}
          searchPlaceholder="Search customers..."
        />
      ) : (
        <ReportEmptyState title="No customers found" description="Try adjusting your date range." />
      )}

      {/* QB Customers — clickable rows */}
      {qbConnected && qbCustomers && qbCustomers.length > 0 && (
        <InteractiveTable
          title="QB Customer Balances"
          data={qbCustomers.slice(0, 25)}
          columns={qbColumns}
          onRowClick={(row) => openPanel({
            type: "customer",
            title: row.DisplayName,
            data: { name: row.DisplayName, email: row.PrimaryEmailAddr?.Address },
          })}
          searchKeys={["DisplayName"]}
          searchPlaceholder="Search QB customers..."
        />
      )}
    </InteractiveReportShell>
  );
}
