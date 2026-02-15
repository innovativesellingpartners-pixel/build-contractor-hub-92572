import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportingFilters as Filters } from "@/pages/Reporting";
import { useEffect } from "react";

interface ReportingFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

function getDateRangeValues(value: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  switch (value) {
    case "all_time":
      return {};
    case "today":
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case "this_week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFrom = startOfWeek;
      dateTo = new Date();
      break;
    case "this_month":
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date();
      break;
    case "last_month":
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case "this_quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
      dateTo = new Date();
      break;
    case "last_quarter":
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedLastQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      dateFrom = new Date(lastQuarterYear, adjustedLastQuarter * 3, 1);
      dateTo = new Date(lastQuarterYear, adjustedLastQuarter * 3 + 3, 0, 23, 59, 59);
      break;
    case "this_year":
      dateFrom = new Date(now.getFullYear(), 0, 1);
      dateTo = new Date();
      break;
    case "custom":
      return {};
  }

  return {
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
  };
}

export function ReportingFilters({ filters, onFiltersChange }: ReportingFiltersProps) {
  useEffect(() => {
    if (filters.dateRange && !filters.dateFrom && !filters.dateTo && filters.dateRange !== "all_time" && filters.dateRange !== "custom") {
      const dates = getDateRangeValues(filters.dateRange);
      if (dates.dateFrom || dates.dateTo) {
        onFiltersChange({
          ...filters,
          ...dates,
        });
      }
    }
  }, []);

  const handleDateRangeChange = (value: string) => {
    const dates = getDateRangeValues(value);
    onFiltersChange({
      ...filters,
      dateRange: value,
      dateFrom: dates.dateFrom,
      dateTo: dates.dateTo,
    });
  };

  const handleReset = () => {
    onFiltersChange({ 
      dateRange: "all_time",
      dateFrom: undefined,
      dateTo: undefined,
      tradeType: undefined,
      status: undefined,
    });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-muted/30 rounded-xl border border-border/40">
      <div className="flex-1 min-w-[180px]">
        <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
          <SelectTrigger className="h-9 text-sm">
            <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_time">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="last_quarter">Last Quarter</SelectItem>
            <SelectItem value="this_year">Year to Date</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[180px]">
        <Select
          value={filters.tradeType || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, tradeType: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="roofing">Roofing</SelectItem>
            <SelectItem value="concrete">Concrete</SelectItem>
            <SelectItem value="general">General Contracting</SelectItem>
            <SelectItem value="painting">Painting</SelectItem>
            <SelectItem value="landscaping">Landscaping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[180px]">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
        Reset
      </Button>
    </div>
  );
}
