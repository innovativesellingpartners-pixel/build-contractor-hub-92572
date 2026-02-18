/**
 * InteractiveReportShell — Shared wrapper for all interactive report views.
 * Provides header (title, breadcrumbs, date range, filters, export), 
 * metric card row, chart area, table area, and drill-down surface.
 */

import { ReactNode } from "react";
import { DrillDownBreadcrumbs } from "./DrillDownBreadcrumbs";
import { ReportDateRangePicker, DateRange } from "../unified/ReportDateRangePicker";
import { ReportExportMenu } from "../unified/ReportExportMenu";
import { ReportFilterChips } from "../unified/ReportFilterChips";

interface FilterItem {
  key: string;
  label: string;
  value: string;
}

interface InteractiveReportShellProps {
  title: string;
  subtitle?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  filters?: FilterItem[];
  onFilterRemove?: (key: string) => void;
  onFilterClearAll?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  badge?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function InteractiveReportShell({
  title,
  subtitle,
  dateRange,
  onDateRangeChange,
  filters,
  onFilterRemove,
  onFilterClearAll,
  onExportCSV,
  onExportPDF,
  badge,
  headerActions,
  children,
}: InteractiveReportShellProps) {
  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <DrillDownBreadcrumbs />

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            {title}
            {badge}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {headerActions}
          {dateRange && onDateRangeChange && (
            <ReportDateRangePicker value={dateRange} onChange={onDateRangeChange} />
          )}
          {(onExportCSV || onExportPDF) && (
            <ReportExportMenu onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {filters && filters.length > 0 && onFilterRemove && (
        <ReportFilterChips
          filters={filters}
          onRemove={onFilterRemove}
          onClearAll={onFilterClearAll}
        />
      )}

      {/* Content */}
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}
