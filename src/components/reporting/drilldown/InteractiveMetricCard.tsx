/**
 * InteractiveMetricCard — Clickable metric card with hover tooltip and drill-down.
 */

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  onClick?: () => void;
  tooltipContent?: React.ReactNode;
  breakdown?: { label: string; value: string }[];
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

export function InteractiveMetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant = "default",
  onClick,
  tooltipContent,
  breakdown,
}: Props) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined ? "text-muted-foreground" : trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground";
  const isClickable = !!onClick;

  const cardContent = (
    <Card
      className={cn(
        "p-4 border-l-4 transition-all",
        variantStyles[variant],
        isClickable && "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
      )}
      onClick={onClick}
    >
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
          {isClickable && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Click for details</span>
              <ChevronRight className="h-3 w-3" />
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

  if (tooltipContent || breakdown) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-3">
            {tooltipContent || (
              <div className="space-y-1.5">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-lg font-bold">{value}</p>
                {breakdown?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
                {isClickable && <p className="text-xs text-primary mt-2">Click for details →</p>}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
