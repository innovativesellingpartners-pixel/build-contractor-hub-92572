/**
 * ReportEmptyState — Friendly empty state for report views with no data.
 */

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function ReportEmptyState({
  title = "No data available",
  description = "Try adjusting your date range or filters to see data here.",
  icon,
  actionLabel,
  onAction,
}: Props) {
  return (
    <Card className="border-dashed border-border/40">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
          {icon || <BarChart3 className="h-7 w-7 text-muted-foreground/60" />}
        </div>
        <p className="text-base font-semibold mb-1.5">{title}</p>
        <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-5" size="sm">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
