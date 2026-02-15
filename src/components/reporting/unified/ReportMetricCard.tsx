/**
 * ReportMetricCard — Reusable KPI card for the unified reporting portal.
 */

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
}

const variantAccent = {
  default: "bg-primary/8 text-primary",
  success: "bg-green-500/8 text-green-600 dark:text-green-400",
  danger: "bg-red-500/8 text-red-600 dark:text-red-400",
  warning: "bg-orange-500/8 text-orange-600 dark:text-orange-400",
  info: "bg-blue-500/8 text-blue-600 dark:text-blue-400",
};

export function ReportMetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant = "default",
}: ReportMetricCardProps) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined ? "text-muted-foreground" : trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-2xl font-bold tabular-nums tracking-tight break-words">{value}</p>
          {(trend !== undefined || subtitle) && (
            <div className="flex items-center gap-1.5">
              {trend !== undefined && (
                <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
              {(trendLabel || subtitle) && (
                <span className="text-xs text-muted-foreground truncate">
                  {trendLabel || subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", variantAccent[variant])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
