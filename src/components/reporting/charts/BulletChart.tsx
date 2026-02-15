interface BulletChartProps {
  actual: number;
  target: number;
  max?: number;
  label: string;
  formatValue?: (v: number) => string;
}

const defaultFormat = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function BulletChart({ actual, target, max, label, formatValue = defaultFormat }: BulletChartProps) {
  const effectiveMax = max || Math.max(actual, target) * 1.2 || 1;
  const actualPct = Math.min((actual / effectiveMax) * 100, 100);
  const targetPct = Math.min((target / effectiveMax) * 100, 100);
  const overBudget = actual > target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate">{label}</span>
        <span className="tabular-nums text-muted-foreground">{formatValue(actual)} / {formatValue(target)}</span>
      </div>
      <div className="relative h-5 bg-muted rounded-md overflow-hidden">
        {/* Ranges */}
        <div className="absolute inset-y-0 left-0 bg-muted-foreground/5 rounded-md" style={{ width: "60%" }} />
        <div className="absolute inset-y-0 left-0 bg-muted-foreground/10 rounded-md" style={{ width: "80%" }} />
        {/* Actual bar */}
        <div
          className={`absolute inset-y-1 left-0 rounded-sm transition-all ${overBudget ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${actualPct}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/70"
          style={{ left: `${targetPct}%` }}
        />
      </div>
    </div>
  );
}
