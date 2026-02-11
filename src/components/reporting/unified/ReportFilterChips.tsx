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
          className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
        >
          <span className="text-xs text-muted-foreground mr-0.5">{f.label}:</span>
          <span className="text-xs font-medium">{f.value}</span>
          <button
            onClick={() => onRemove(f.key)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
