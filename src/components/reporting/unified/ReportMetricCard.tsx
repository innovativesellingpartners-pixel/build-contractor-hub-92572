/**
 * ReportMetricCard — Reusable KPI card for the unified reporting portal.
 * Matches the polished InteractiveMetricCard styling.
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

const variantStyles = {
  default: { iconBg: "bg-primary/10", accentLine: "bg-primary" },
  success: { iconBg: "bg-emerald-500/10", accentLine: "bg-emerald-500" },
  danger: { iconBg: "bg-red-500/10", accentLine: "bg-red-500" },
  warning: { iconBg: "bg-amber-500/10", accentLine: "bg-amber-500" },
  info: { iconBg: "bg-blue-500/10", accentLine: "bg-blue-500" },
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
  const trendColor = trend === undefined ? "text-muted-foreground" : trend > 0 ? "text-emerald-600 dark:text-emerald-400" : trend < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
  const styles = variantStyles[variant];

  return (
    <Card className="relative overflow-hidden border-border/60">
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", styles.accentLine, "opacity-60")} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest truncate">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight break-words leading-none">{value}</p>
            {(trend !== undefined || subtitle) && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {trend !== undefined && (
                  <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
                    trend > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                    trend < 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                    "bg-muted text-muted-foreground"
                  )}>
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
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", styles.iconBg)}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
