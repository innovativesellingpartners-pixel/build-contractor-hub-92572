/**
 * ReportEmptyState — Friendly empty state for report views with no data.
 */

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ReportEmptyState({
  title = "No data available",
  description = "Try adjusting your date range or filters to see data here.",
  icon,
}: Props) {
  return (
    <Card className="border-dashed border-border/40">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center mb-4">
          {icon || <BarChart3 className="h-6 w-6 text-muted-foreground" />}
        </div>
        <p className="text-base font-semibold mb-1">{title}</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}
