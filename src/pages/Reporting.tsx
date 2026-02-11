/**
 * Reporting — Unified Reporting Portal with 9 sections.
 * Combines myCT1 native data + QuickBooks synced data into a single analytics hub.
 * Navigation via collapsible sidebar on desktop, dropdown on mobile.
 * Wrapped with DrillDownProvider for interactive drill-down navigation.
 */

import { useState } from "react";

/** Re-exported for backward compatibility — many reporting components import this type from here. */
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
// Tabs import removed — using Select dropdown instead
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, TrendingUp, Briefcase, DollarSign, Receipt,
  Users, FileText, Store, Wrench,
} from "lucide-react";

import { DrillDownProvider } from "@/components/reporting/drilldown/DrillDownProvider";
import { DrillDownBreadcrumbs } from "@/components/reporting/drilldown/DrillDownBreadcrumbs";
import { DrillDownPanel } from "@/components/reporting/drilldown/DrillDownPanel";

import { UnifiedDashboard } from "@/components/reporting/unified/UnifiedDashboard";
import { SalesPipelineReport } from "@/components/reporting/unified/SalesPipelineReport";
import { JobsProjectsReport } from "@/components/reporting/unified/JobsProjectsReport";
import { RevenueFinancialReport } from "@/components/reporting/unified/RevenueFinancialReport";
import { ExpensesProfitabilityReport } from "@/components/reporting/unified/ExpensesProfitabilityReport";
import { CustomersReport } from "@/components/reporting/unified/CustomersReport";
import { AccountsReceivableReport } from "@/components/reporting/unified/AccountsReceivableReport";
import { AccountsPayableReport } from "@/components/reporting/unified/AccountsPayableReport";
import { CustomReportBuilder } from "@/components/reporting/unified/CustomReportBuilder";

const sections = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "sales", label: "Sales & Pipeline", icon: TrendingUp },
  { value: "jobs", label: "Jobs & Projects", icon: Briefcase },
  { value: "revenue", label: "Revenue", icon: DollarSign },
  { value: "expenses", label: "Expenses", icon: Receipt },
  { value: "customers", label: "Customers", icon: Users },
  { value: "ar", label: "Receivables", icon: FileText },
  { value: "ap", label: "Payables", icon: Store },
  { value: "custom", label: "Custom Reports", icon: Wrench },
];

export default function Reporting() {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <DrillDownProvider onNavigateToReport={setActiveSection}>
      <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 pb-24 md:pb-8 overflow-y-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reporting & Analytics</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Unified business intelligence across all data sources
          </p>
        </div>

        {/* Breadcrumbs */}
        <DrillDownBreadcrumbs />

        {/* Section selector dropdown */}
        <Select value={activeSection} onValueChange={setActiveSection}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Select report" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {sections.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Content */}
        {activeSection === "dashboard" && <UnifiedDashboard />}
        {activeSection === "sales" && <SalesPipelineReport />}
        {activeSection === "jobs" && <JobsProjectsReport />}
        {activeSection === "revenue" && <RevenueFinancialReport />}
        {activeSection === "expenses" && <ExpensesProfitabilityReport />}
        {activeSection === "customers" && <CustomersReport />}
        {activeSection === "ar" && <AccountsReceivableReport />}
        {activeSection === "ap" && <AccountsPayableReport />}
        {activeSection === "custom" && <CustomReportBuilder />}

        {/* Global drill-down slide-out panel */}
        <DrillDownPanel />
      </div>
    </DrillDownProvider>
  );
}
