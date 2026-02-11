/**
 * SalesPipelineReport — Unified sales & pipeline analytics.
 * Merges estimates, proposals, conversion rates, pipeline value from myCT1 data.
 * Uses existing ConversionAnalytics and WinLossAnalysis components.
 */

import { useState } from "react";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { ConversionAnalytics } from "@/components/reporting/ConversionAnalytics";
import { WinLossAnalysis } from "@/components/reporting/WinLossAnalysis";
import { EstimateFunnelChart } from "@/components/reporting/EstimateFunnelChart";
import { SalesOverTimeChart } from "@/components/reporting/SalesOverTimeChart";
import { Card } from "@/components/ui/card";

export function SalesPipelineReport() {
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });

  const filters = {
    dateRange: dateRange.preset === "ytd" ? "this_year" : dateRange.preset === "all_time" ? "all_time" : dateRange.preset,
    dateFrom: dateRange.start,
    dateTo: dateRange.end,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Sales & Pipeline</h2>
          <p className="text-sm text-muted-foreground">Pre-sale and conversion analytics</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Conversion funnel + metrics */}
      <ConversionAnalytics filters={filters} />

      {/* Win/Loss */}
      <WinLossAnalysis filters={{ dateFrom: dateRange.start, dateTo: dateRange.end }} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estimate Funnel</h3>
          <EstimateFunnelChart filters={filters} />
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Over Time</h3>
          <SalesOverTimeChart filters={filters} />
        </Card>
      </div>
    </div>
  );
}
