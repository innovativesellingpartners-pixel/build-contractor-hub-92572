/**
 * ReportFilterChips — Inline filter pills for report views.
 * Shows active filters with X to remove.
 */

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Filter {
  key: string;
  label: string;
  value: string;
}

interface Props {
  filters: Filter[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}

export function ReportFilterChips({ filters, onRemove, onClearAll }: Props) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        <Badge
          key={f.key}
          variant="secondary"
          className="flex items-center gap-1.5 pr-1 cursor-pointer hover:bg-secondary/80 rounded-lg h-7"
        >
          <span className="text-[11px] text-muted-foreground font-medium">{f.label}:</span>
          <span className="text-[11px] font-semibold">{f.value}</span>
          <button
            onClick={() => onRemove(f.key)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
