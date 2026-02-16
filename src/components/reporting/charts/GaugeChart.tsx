interface GaugeChartProps {
  value: number;
  max?: number;
  target?: number;
  label?: string;
  suffix?: string;
  height?: number;
  thresholds?: { low: number; mid: number };
}

export function GaugeChart({ value, max = 100, target, label, suffix = "%", height = 160, thresholds = { low: 15, mid: 25 } }: GaugeChartProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const angle = (clampedValue / max) * 180;
  const targetAngle = target ? (Math.min(target, max) / max) * 180 : undefined;

  const color = value >= thresholds.mid
    ? "hsl(142, 76%, 36%)"
    : value >= thresholds.low
      ? "hsl(45, 93%, 47%)"
      : "hsl(0, 84%, 60%)";

  const r = 60;
  const cx = 90;
  const cy = 80;
  const strokeW = 10;

  const polarToCart = (angleDeg: number, radius: number) => {
    const rad = (Math.PI / 180) * (180 - angleDeg);
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const arcPath = (startAngle: number, endAngle: number, radius: number) => {
    const s = polarToCart(startAngle, radius);
    const e = polarToCart(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  };

  const needleEnd = polarToCart(angle, r - 14);
  const needleTip = polarToCart(angle, r + 4);

  return (
    <div className="flex flex-col items-center" style={{ height }}>
      <svg viewBox="0 0 180 100" className="w-full max-w-[220px]">
        {/* Background arc */}
        <path d={arcPath(0, 180, r)} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeW} strokeLinecap="butt" />
        {/* Value arc */}
        {angle > 0.5 && (
          <path d={arcPath(0, Math.min(angle, 180), r)} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="butt" />
        )}
        {/* Target marker */}
        {targetAngle !== undefined && (() => {
          const t1 = polarToCart(targetAngle, r + 6);
          const t2 = polarToCart(targetAngle, r - 6);
          return (
            <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y}
              stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />
          );
        })()}
        {/* Needle */}
        <line x1={needleEnd.x} y1={needleEnd.y} x2={needleTip.x} y2={needleTip.y}
          stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.7" />
        <circle cx={cx} cy={cy} r="2.5" fill="hsl(var(--foreground))" opacity="0.5" />
        {/* Center value */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" style={{ fontSize: "18px", fontWeight: 700 }}>
          {value.toFixed(1)}{suffix}
        </text>
      </svg>
      {label && <span className="text-xs text-muted-foreground -mt-1">{label}</span>}
      {target !== undefined && (
        <span className="text-[10px] text-muted-foreground">Target: {target}{suffix}</span>
      )}
    </div>
  );
}
