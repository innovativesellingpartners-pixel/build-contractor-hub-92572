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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, TrendingUp, Briefcase, DollarSign, Receipt,
  Users, FileText, Store, Wrench, Gauge,
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
import { ContractorVisibilityDashboard } from "@/components/reporting/unified/ContractorVisibilityDashboard";
import { cn } from "@/lib/utils";

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
  { value: "visibility", label: "Contractor Visibility", icon: Gauge },
];

export default function Reporting() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const ActiveIcon = sections.find(s => s.value === activeSection)?.icon || LayoutDashboard;

  return (
    <DrillDownProvider onNavigateToReport={setActiveSection}>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6 pb-24 md:pb-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ActiveIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reporting & Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Unified business intelligence across all data sources
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <DrillDownBreadcrumbs />

        {/* Section selector — pill nav on desktop, dropdown on mobile */}
        <div className="hidden sm:flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/40">
          {sections.map((s) => (
            <button
              key={s.value}
              onClick={() => setActiveSection(s.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                activeSection === s.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="sm:hidden">
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger className="w-full">
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
        </div>

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
        {activeSection === "visibility" && <ContractorVisibilityDashboard />}

        {/* Global drill-down slide-out panel */}
        <DrillDownPanel />
      </div>
    </DrillDownProvider>
  );
}
