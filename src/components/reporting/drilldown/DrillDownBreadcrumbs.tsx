/**
 * DrillDownBreadcrumbs — Clickable breadcrumb trail for report navigation.
 */

import { ChevronRight, Home } from "lucide-react";
import { useDrillDown } from "./DrillDownProvider";
import { cn } from "@/lib/utils";

export function DrillDownBreadcrumbs() {
  const { breadcrumbs, popToLevel } = useDrillDown();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return (
          <div key={`${crumb.id}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            <button
              onClick={() => !isLast && popToLevel(i)}
              disabled={isLast}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors",
                isLast
                  ? "text-foreground cursor-default"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              )}
            >
              {i === 0 && <Home className="h-3 w-3" />}
              <span className="max-w-[120px] truncate">{crumb.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
