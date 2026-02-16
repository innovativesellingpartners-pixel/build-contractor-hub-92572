/**
 * Report Registry — Centralized config mapping reportKey to visual type,
 * required fields, formatter rules, and empty state messaging.
 *
 * Usage:
 *   import { REPORT_REGISTRY, getReportConfig } from "./reportRegistry";
 *   const config = getReportConfig("gross_margin_gauge");
 */

export type VisualType =
  | "gauge"
  | "donut"
  | "area"
  | "bar"
  | "stacked_bar"
  | "bullet"
  | "sparkline"
  | "table"
  | "kpi_card"
  | "funnel";

export interface ReportConfig {
  key: string;
  title: string;
  description: string;
  visualType: VisualType;
  requiredFields: string[];
  /** How to format the primary value */
  formatter: "currency" | "percent" | "number" | "count";
  defaultTimeRange: "ytd" | "all_time" | "last_30" | "last_90";
  emptyMessage: string;
}

export const REPORT_REGISTRY: Record<string, ReportConfig> = {
  // ─── Dashboard ───
  gross_margin_gauge: {
    key: "gross_margin_gauge",
    title: "Gross Margin",
    description: "Overall gross margin across all jobs.",
    visualType: "gauge",
    requiredFields: ["totalJobRevenue", "totalJobCost"],
    formatter: "percent",
    defaultTimeRange: "ytd",
    emptyMessage: "No job data to calculate gross margin.",
  },
  revenue_trend_area: {
    key: "revenue_trend_area",
    title: "Monthly Revenue Trend",
    description: "Revenue from payments over time.",
    visualType: "area",
    requiredFields: ["revenueTrend"],
    formatter: "currency",
    defaultTimeRange: "ytd",
    emptyMessage: "No payment data to show revenue trend.",
  },
  job_status_donut: {
    key: "job_status_donut",
    title: "Job Status Distribution",
    description: "Breakdown of jobs by current status.",
    visualType: "donut",
    requiredFields: ["jobStatusData"],
    formatter: "count",
    defaultTimeRange: "all_time",
    emptyMessage: "No jobs found for the selected period.",
  },
  active_jobs_bullet: {
    key: "active_jobs_bullet",
    title: "Active Jobs Budget",
    description: "Budget vs spend for in-progress jobs.",
    visualType: "bullet",
    requiredFields: ["activeJobCosts", "activeJobBudgets"],
    formatter: "currency",
    defaultTimeRange: "ytd",
    emptyMessage: "No active jobs to display budget tracking.",
  },

  // ─── Sales Pipeline ───
  conversion_rate_gauge: {
    key: "conversion_rate_gauge",
    title: "Conversion Rate",
    description: "Percentage of estimates converted to jobs.",
    visualType: "gauge",
    requiredFields: ["conversionRate"],
    formatter: "percent",
    defaultTimeRange: "all_time",
    emptyMessage: "No estimates to calculate conversion rate.",
  },
  estimate_funnel: {
    key: "estimate_funnel",
    title: "Estimate Funnel",
    description: "Pipeline progression from leads to jobs.",
    visualType: "funnel",
    requiredFields: ["totalLeads", "totalEstimates", "totalCustomers", "totalJobs"],
    formatter: "count",
    defaultTimeRange: "all_time",
    emptyMessage: "No pipeline data available.",
  },
  overall_conversion_gauge: {
    key: "overall_conversion_gauge",
    title: "Overall Conversion",
    description: "Lead to job conversion rate.",
    visualType: "gauge",
    requiredFields: ["overallConversionRate"],
    formatter: "percent",
    defaultTimeRange: "all_time",
    emptyMessage: "No leads to calculate conversion.",
  },

  // ─── Jobs & Projects ───
  revenue_by_type_bar: {
    key: "revenue_by_type_bar",
    title: "Revenue by Job Type",
    description: "Revenue breakdown by trade type.",
    visualType: "bar",
    requiredFields: ["byTypeData"],
    formatter: "currency",
    defaultTimeRange: "all_time",
    emptyMessage: "No jobs found to break down by type.",
  },
  job_margin_gauge: {
    key: "job_margin_gauge",
    title: "Gross Margin",
    description: "Overall job gross margin percentage.",
    visualType: "gauge",
    requiredFields: ["margin"],
    formatter: "percent",
    defaultTimeRange: "all_time",
    emptyMessage: "No job data to calculate margin.",
  },

  // ─── Expenses ───
  expense_donut: {
    key: "expense_donut",
    title: "Expense Breakdown",
    description: "Expenses by category.",
    visualType: "donut",
    requiredFields: ["donutData"],
    formatter: "currency",
    defaultTimeRange: "ytd",
    emptyMessage: "No expenses recorded for this period.",
  },
  expense_trend_stacked: {
    key: "expense_trend_stacked",
    title: "Expense Trend",
    description: "Monthly expense trend by category.",
    visualType: "stacked_bar",
    requiredFields: ["trendData"],
    formatter: "currency",
    defaultTimeRange: "ytd",
    emptyMessage: "Not enough data to show expense trends.",
  },

  // ─── Revenue ───
  monthly_revenue_area: {
    key: "monthly_revenue_area",
    title: "Monthly Revenue",
    description: "Monthly revenue from payments.",
    visualType: "area",
    requiredFields: ["revenueTrend"],
    formatter: "currency",
    defaultTimeRange: "ytd",
    emptyMessage: "No payment data to chart monthly revenue.",
  },
};

export function getReportConfig(key: string): ReportConfig | undefined {
  return REPORT_REGISTRY[key];
}

/**
 * Check whether a dataset has the required fields for a given report.
 * Returns true if all required fields are present and non-empty.
 */
export function hasRequiredData(key: string, data: Record<string, any> | null | undefined): boolean {
  const config = REPORT_REGISTRY[key];
  if (!config || !data) return false;
  return config.requiredFields.every((field) => {
    const val = data[field];
    if (val == null) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });
}
