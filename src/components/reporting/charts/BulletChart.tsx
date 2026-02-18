import { cn } from "@/lib/utils";

interface BulletChartProps {
  actual: number;
  target: number;
  max?: number;
  label: string;
  formatValue?: (v: number) => string;
  onClick?: () => void;
}

const defaultFormat = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function BulletChart({ actual, target, max, label, formatValue = defaultFormat, onClick }: BulletChartProps) {
  const effectiveMax = max || Math.max(actual, target) * 1.2 || 1;
  const actualPct = Math.min((actual / effectiveMax) * 100, 100);
  const targetPct = Math.min((target / effectiveMax) * 100, 100);
  const overBudget = actual > target;
  const isClickable = !!onClick;

  return (
    <div
      className={cn("space-y-1.5", isClickable && "cursor-pointer group hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors")}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); } : undefined}
    >
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium truncate", isClickable && "group-hover:text-primary transition-colors")}>{label}</span>
        <span className="tabular-nums text-muted-foreground">{formatValue(actual)} / {formatValue(target)}</span>
      </div>
      <div className="relative h-5 bg-muted rounded-md overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-muted-foreground/5 rounded-md" style={{ width: "60%" }} />
        <div className="absolute inset-y-0 left-0 bg-muted-foreground/10 rounded-md" style={{ width: "80%" }} />
        <div
          className={`absolute inset-y-1 left-0 rounded-sm transition-all ${overBudget ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${actualPct}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/70"
          style={{ left: `${targetPct}%` }}
        />
      </div>
    </div>
  );
}
