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
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon || <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />}
        <p className="text-base font-semibold mb-1">{title}</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}
