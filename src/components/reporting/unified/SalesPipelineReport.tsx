/**
 * SalesPipelineReport — Sales & pipeline analytics with drill-down interactivity.
 * Wraps existing conversion/funnel components in InteractiveReportShell.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { InteractiveTable, TableColumn } from "../drilldown/InteractiveTable";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { ConversionAnalytics } from "@/components/reporting/ConversionAnalytics";
import { WinLossAnalysis } from "@/components/reporting/WinLossAnalysis";
import { EstimateFunnelChart } from "@/components/reporting/EstimateFunnelChart";
import { SalesOverTimeChart } from "@/components/reporting/SalesOverTimeChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, DollarSign, Target, TrendingUp } from "lucide-react";
import { GaugeChart } from "../charts/GaugeChart";
import { ChartCard } from "../charts/ChartCard";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function SalesPipelineReport() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time", start: "2000-01-01", end: new Date().toISOString().split("T")[0] });

  const filters = {
    dateRange: dateRange.preset === "ytd" ? "this_year" : dateRange.preset === "all_time" ? "all_time" : dateRange.preset,
    dateFrom: dateRange.start,
    dateTo: dateRange.end,
  };

  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales-pipeline-metrics", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let estQ = supabase.from("estimates").select("id, title, status, total_amount, created_at, client_name, customer_id, job_id").eq("user_id", user.id);
      let leadQ = supabase.from("leads").select("id, created_at, status, name, email").eq("user_id", user.id);
      if (dateRange.start) { estQ = estQ.gte("created_at", dateRange.start); leadQ = leadQ.gte("created_at", dateRange.start); }
      if (dateRange.end) { estQ = estQ.lte("created_at", dateRange.end); leadQ = leadQ.lte("created_at", dateRange.end); }
      const [estimates, leads] = await Promise.all([estQ, leadQ]);
      const est = estimates.data || [];
      const ld = leads.data || [];
      const totalValue = est.reduce((s, e) => s + Number(e.total_amount || 0), 0);
      const accepted = est.filter(e => e.status === "accepted" || e.status === "sold");
      const conversionRate = est.length > 0 ? (accepted.length / est.length) * 100 : 0;
      return { estimates: est, leads: ld, totalValue, conversionRate, acceptedCount: accepted.length };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const estimateColumns: TableColumn<any>[] = [
    { key: "title", label: "Title", render: (row) => <span className="font-medium">{row.title || "—"}</span> },
    { key: "client_name", label: "Client", render: (row) => row.client_name || "—" },
    { key: "status", label: "Status", render: (row) => {
      const colors: Record<string, string> = { accepted: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", sold: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" };
      return <Badge className={colors[row.status] || ""} variant="outline">{row.status || "draft"}</Badge>;
    }},
    { key: "total_amount", label: "Amount", align: "right", render: (row) => fmt(Number(row.total_amount || 0)) },
    { key: "created_at", label: "Created", render: (row) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <InteractiveReportShell
      title="Sales & Pipeline"
      subtitle="Pre-sale and conversion analytics"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard title="Leads" value={String(salesData?.leads?.length || 0)} subtitle="Total leads" icon={<Target className="h-4 w-4 text-blue-600" />} variant="info"
          onClick={() => {
            const firstLead = salesData?.leads?.[0];
            if (firstLead) openPanel({ type: "customer", title: firstLead.name || "Lead", data: { name: firstLead.name, email: firstLead.email } });
          }}
          breakdown={salesData?.leads?.slice(0, 3).map((l: any) => ({ label: l.name || "Lead", value: l.status || "new" }))}
        />
        <InteractiveMetricCard title="Estimates" value={String(salesData?.estimates?.length || 0)} subtitle={`${salesData?.acceptedCount || 0} accepted`} icon={<FileText className="h-4 w-4 text-primary" />} variant="default"
          onClick={() => {
            const firstEst = salesData?.estimates?.[0];
            if (firstEst) openPanel({ type: "estimate", title: firstEst.title || "Estimate", data: firstEst });
          }}
          breakdown={[{ label: "Accepted", value: String(salesData?.acceptedCount || 0) }, { label: "Total", value: String(salesData?.estimates?.length || 0) }]}
        />
        <InteractiveMetricCard title="Pipeline Value" value={fmt(salesData?.totalValue || 0)} subtitle="Total estimate value" icon={<DollarSign className="h-4 w-4 text-green-600" />} variant="success"
          onClick={() => openPanel({ type: "category-breakdown", title: "Pipeline Value Breakdown", data: { category: "Pipeline", type: "revenue", totalAmount: salesData?.totalValue || 0 } })}
          breakdown={[{ label: "Avg Estimate", value: fmt(salesData?.estimates?.length ? (salesData.totalValue || 0) / salesData.estimates.length : 0) }]}
        />
        <InteractiveMetricCard title="Conversion Rate" value={`${(salesData?.conversionRate || 0).toFixed(1)}%`} subtitle="Estimates → jobs" icon={<TrendingUp className="h-4 w-4 text-primary" />} variant="default"
          onClick={() => openPanel({ type: "category-breakdown", title: "Conversion Funnel", data: { category: "Conversion", type: "revenue", totalAmount: salesData?.totalValue || 0 } })}
          breakdown={[{ label: "Won", value: String(salesData?.acceptedCount || 0) }, { label: "Total", value: String(salesData?.estimates?.length || 0) }]}
        />
      </div>

      {/* Conversion Gauge */}
      {salesData && (
        <ChartCard
          title="Conversion Rate"
          isEmpty={!salesData.estimates?.length}
          emptyMessage="No estimates to calculate conversion rate."
        >
          <div className="flex justify-center">
            <GaugeChart
              value={salesData.conversionRate || 0}
              target={40}
              label="Estimate → Job"
              thresholds={{ low: 15, mid: 30 }}
            />
          </div>
        </ChartCard>
      )}

      {/* Conversion funnel + metrics */}
      <ConversionAnalytics filters={filters} />

      {/* Win/Loss */}
      <WinLossAnalysis filters={{ dateFrom: dateRange.start, dateTo: dateRange.end }} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 border-border/60">
          <h3 className="text-sm font-semibold mb-4">Estimate Funnel</h3>
          <EstimateFunnelChart filters={filters} />
        </Card>
        <Card className="p-6 border-border/60">
          <h3 className="text-sm font-semibold mb-4">Sales Over Time</h3>
          <SalesOverTimeChart filters={filters} />
        </Card>
      </div>

      {/* Estimates table — clickable rows */}
      {salesData?.estimates && salesData.estimates.length > 0 && (
        <InteractiveTable
          title="Estimates"
          data={salesData.estimates}
          columns={estimateColumns}
          onRowClick={(row) => openPanel({
            type: "estimate",
            title: row.title || "Estimate",
            data: row,
          })}
          searchKeys={["title", "client_name"]}
          searchPlaceholder="Search estimates..."
        />
      )}
    </InteractiveReportShell>
  );
}
