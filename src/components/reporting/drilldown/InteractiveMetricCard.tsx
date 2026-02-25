/**
 * InteractiveMetricCard — Clickable metric card with hover tooltip and drill-down.
 * Clean, modern SaaS design with subtle accent lines and smooth interactions.
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
import { MiniSparkline } from "../charts/MiniSparkline";

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
  sparkData?: number[];
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/8",
    iconText: "text-primary",
    accentLine: "bg-primary",
  },
  success: {
    iconBg: "bg-emerald-500/8",
    iconText: "text-emerald-600 dark:text-emerald-400",
    accentLine: "bg-emerald-500",
  },
  danger: {
    iconBg: "bg-red-500/8",
    iconText: "text-red-600 dark:text-red-400",
    accentLine: "bg-red-500",
  },
  warning: {
    iconBg: "bg-amber-500/8",
    iconText: "text-amber-600 dark:text-amber-400",
    accentLine: "bg-amber-500",
  },
  info: {
    iconBg: "bg-blue-500/8",
    iconText: "text-blue-600 dark:text-blue-400",
    accentLine: "bg-blue-500",
  },
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
  sparkData,
}: Props) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const isClickable = !!onClick;
  const styles = variantStyles[variant];

  const cardContent = (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        isClickable && "cursor-pointer hover:border-border active:scale-[0.98] group"
      )}
      style={isClickable ? { boxShadow: 'var(--shadow-sm)' } : undefined}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-[2px]", styles.accentLine, "opacity-50")} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">{value}</p>
            {(trend !== undefined || subtitle) && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {trend !== undefined && (
                  <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
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
          <div className="flex flex-col items-end gap-2">
            {icon && (
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", styles.iconBg)}>
                {icon}
              </div>
            )}
            {sparkData && sparkData.length > 1 && (
              <MiniSparkline data={sparkData} width={64} height={24} />
            )}
          </div>
        </div>
      </div>

      {/* Clickable indicator */}
      {isClickable && (
        <div className="absolute bottom-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
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
