import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface MetricItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
}

interface MetricGridProps {
  items: MetricItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({
  items,
  columns = 4,
  className,
}: MetricGridProps) {
  const colsClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-4", colsClass, className)}>
      {items.map((item, idx) => (
        <MetricCard key={idx} {...item} />
      ))}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend, className }: MetricItem) {
  return (
    <div
      className={cn(
        "bg-card border border-border/50 rounded-xl p-4 space-y-1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <p className="text-xs text-muted-foreground">{trend}</p>
      )}
    </div>
  );
}
