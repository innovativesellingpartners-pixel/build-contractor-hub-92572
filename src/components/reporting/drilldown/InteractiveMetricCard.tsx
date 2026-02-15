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

const variantAccent = {
  default: "bg-primary/8 text-primary",
  success: "bg-green-500/8 text-green-600 dark:text-green-400",
  danger: "bg-red-500/8 text-red-600 dark:text-red-400",
  warning: "bg-orange-500/8 text-orange-600 dark:text-orange-400",
  info: "bg-blue-500/8 text-blue-600 dark:text-blue-400",
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
        "p-5 transition-all duration-150 relative overflow-hidden",
        isClickable && "cursor-pointer hover:shadow-md active:scale-[0.98] group"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
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
      {isClickable && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/0 group-hover:bg-primary/40 transition-all duration-200" />
      )}
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
                <p className="text-lg font-bold tabular-nums">{value}</p>
                {breakdown?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs gap-4">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium tabular-nums">{item.value}</span>
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
