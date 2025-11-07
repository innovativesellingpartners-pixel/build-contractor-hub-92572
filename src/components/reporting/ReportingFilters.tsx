import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportingFilters as Filters } from "@/pages/Reporting";

interface ReportingFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ReportingFilters({ filters, onFiltersChange }: ReportingFiltersProps) {
  const handleDateRangeChange = (value: string) => {
    const now = new Date();
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    switch (value) {
      case "today":
        dateFrom = dateTo = now;
        break;
      case "this_week":
        dateFrom = new Date(now.setDate(now.getDate() - now.getDay()));
        dateTo = new Date();
        break;
      case "this_month":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = new Date();
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
        dateTo = new Date();
        break;
      case "year":
        dateFrom = new Date(now.getFullYear(), 0, 1);
        dateTo = new Date();
        break;
    }

    onFiltersChange({
      ...filters,
      dateRange: value,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
    });
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger>
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="quarter">Quarter to Date</SelectItem>
              <SelectItem value="year">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select
            value={filters.tradeType}
            onValueChange={(value) => onFiltersChange({ ...filters, tradeType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="roofing">Roofing</SelectItem>
              <SelectItem value="concrete">Concrete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => onFiltersChange({ dateRange: "this_month" })}>
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}
