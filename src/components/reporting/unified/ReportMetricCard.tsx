/**
 * ReportMetricCard — Reusable KPI card for the unified reporting portal.
 * Displays a large metric value, trend indicator, and optional sparkline description.
 */

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number; // percentage change vs previous period
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
}

const variantStyles = {
  default: "border-l-primary/30",
  success: "border-l-green-500/30",
  danger: "border-l-red-500/30",
  warning: "border-l-orange-500/30",
  info: "border-l-blue-500/30",
};

const variantIconBg = {
  default: "bg-primary/10",
  success: "bg-green-500/10",
  danger: "bg-red-500/10",
  warning: "bg-orange-500/10",
  info: "bg-blue-500/10",
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
    <Card className={cn("p-4 border-l-4 transition-shadow hover:shadow-md", variantStyles[variant])}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums break-words">{value}</p>
          {(trend !== undefined || subtitle) && (
            <div className="flex items-center gap-1.5 mt-1">
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
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", variantIconBg[variant])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
