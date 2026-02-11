/**
 * ReportDateRangePicker — Universal date range selector with presets.
 * Sits at the top of every report view for consistent date filtering.
 */

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRangePreset =
  | "this_month" | "last_month" | "this_quarter" | "last_quarter"
  | "ytd" | "last_year" | "all_time" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start?: string;
  end?: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function computeDates(preset: DateRangePreset): { start?: string; end?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "this_month":
      return { start: fmt(new Date(y, m, 1)), end: fmt(now) };
    case "last_month":
      return { start: fmt(new Date(y, m - 1, 1)), end: fmt(new Date(y, m, 0)) };
    case "this_quarter": {
      const q = Math.floor(m / 3);
      return { start: fmt(new Date(y, q * 3, 1)), end: fmt(now) };
    }
    case "last_quarter": {
      const lq = Math.floor(m / 3) - 1;
      const ly = lq < 0 ? y - 1 : y;
      const aq = lq < 0 ? 3 : lq;
      return { start: fmt(new Date(ly, aq * 3, 1)), end: fmt(new Date(ly, aq * 3 + 3, 0)) };
    }
    case "ytd":
      return { start: `${y}-01-01`, end: fmt(now) };
    case "last_year":
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
    case "all_time":
      return {};
    default:
      return {};
  }
}

const presetLabels: Record<DateRangePreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  last_quarter: "Last Quarter",
  ytd: "Year to Date",
  last_year: "Last Year",
  all_time: "All Time",
  custom: "Custom",
};

export function ReportDateRangePicker({ value, onChange }: Props) {
  const handleChange = (preset: string) => {
    const dates = computeDates(preset as DateRangePreset);
    onChange({ preset: preset as DateRangePreset, ...dates });
  };

  return (
    <Select value={value.preset} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {Object.entries(presetLabels).map(([key, label]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { computeDates, presetLabels };
