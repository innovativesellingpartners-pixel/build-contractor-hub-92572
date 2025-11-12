import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportingFilters } from "@/components/reporting/ReportingFilters";
import { KPICards } from "@/components/reporting/KPICards";
import { SalesOverTimeChart } from "@/components/reporting/SalesOverTimeChart";
import { EstimateFunnelChart } from "@/components/reporting/EstimateFunnelChart";
import { RevenueProfitChart } from "@/components/reporting/RevenueProfitChart";
import { PerformanceByRepChart } from "@/components/reporting/PerformanceByRepChart";
import { ProfitLossStatement } from "@/components/reporting/ProfitLossStatement";
import { ExpenseBreakdown } from "@/components/reporting/ExpenseBreakdown";
import { JobProfitability } from "@/components/reporting/JobProfitability";
import { CashFlowChart } from "@/components/reporting/CashFlowChart";
import { EstimatesTable } from "@/components/reporting/EstimatesTable";
import { JobsTable } from "@/components/reporting/JobsTable";
import { PaymentsTable } from "@/components/reporting/PaymentsTable";
import { UnclosedStalledTable } from "@/components/reporting/UnclosedStalledTable";
import { ReportExportActions } from "@/components/reporting/ReportExportActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportingFilters {
  dateRange: string;
  dateFrom?: string;
  dateTo?: string;
  salesRepId?: string;
  tradeType?: string;
  status?: string;
  leadSource?: string;
  customerType?: string;
}

export default function Reporting() {
  const [filters, setFilters] = useState<ReportingFilters>({
    dateRange: "this_month",
  });

  // Fetch all report data for export
  const { data: exportData } = useQuery({
    queryKey: ["report-export-data", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch estimates, jobs, and other data for export
      const [estimates, jobs] = await Promise.all([
        supabase.from("estimates").select("*").eq("user_id", user.id),
        supabase.from("jobs").select("*").eq("user_id", user.id),
      ]);

      return { estimates: estimates.data || [], jobs: jobs.data || [] };
    },
  });

  // Prepare report data for export
  const reportData = useMemo(() => {
    const dateRangeLabels: Record<string, string> = {
      this_week: "This Week",
      this_month: "This Month",
      this_quarter: "This Quarter",
      this_year: "This Year",
      last_month: "Last Month",
      last_quarter: "Last Quarter",
      custom: filters.dateFrom && filters.dateTo 
        ? `${filters.dateFrom} to ${filters.dateTo}` 
        : "Custom Range",
    };

    return {
      title: "Financial Report",
      dateRange: dateRangeLabels[filters.dateRange] || "All Time",
      sections: [
        {
          title: "Estimates",
          data: exportData?.estimates || [],
        },
        {
          title: "Jobs",
          data: exportData?.jobs || [],
        },
      ],
      summary: [],
    };
  }, [exportData, filters]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reporting & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track sales performance, revenue, and job metrics
            </p>
          </div>
          <ReportExportActions reportData={reportData} filters={filters} />
        </div>

        {/* Filters */}
        <ReportingFilters filters={filters} onFiltersChange={setFilters} />

        {/* KPI Cards */}
        <KPICards filters={filters} />

        {/* Financial Statements */}
        <div className="grid gap-6">
          <ProfitLossStatement filters={filters} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cash Flow Analysis</h3>
            <CashFlowChart filters={filters} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
            <ExpenseBreakdown filters={filters} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales Over Time</h3>
            <SalesOverTimeChart filters={filters} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estimate to Sale Funnel</h3>
            <EstimateFunnelChart filters={filters} />
          </Card>

          <Card className="p-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Revenue & Profit Trend</h3>
            <RevenueProfitChart filters={filters} />
          </Card>

          <Card className="p-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Performance by Sales Rep</h3>
            <PerformanceByRepChart filters={filters} />
          </Card>
        </div>

        {/* Job Profitability Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Job Profitability Analysis</h3>
          <JobProfitability filters={filters} />
        </Card>

        {/* Data Tables */}
        <Tabs defaultValue="estimates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="estimates">Estimates</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="unclosed">Unclosed & Stalled</TabsTrigger>
          </TabsList>

          <TabsContent value="estimates">
            <EstimatesTable filters={filters} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsTable filters={filters} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTable filters={filters} />
          </TabsContent>

          <TabsContent value="unclosed">
            <UnclosedStalledTable filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
