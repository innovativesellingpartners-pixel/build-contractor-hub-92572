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

  const r = 70;
  const cx = 90;
  const cy = 85;

  const arcPath = (startAngle: number, endAngle: number, radius: number) => {
    const s = (Math.PI / 180) * (180 - startAngle);
    const e = (Math.PI / 180) * (180 - endAngle);
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy - radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy - radius * Math.sin(e);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
  };

  const needleX = cx + (r - 10) * Math.cos((Math.PI / 180) * (180 - angle));
  const needleY = cy - (r - 10) * Math.sin((Math.PI / 180) * (180 - angle));

  return (
    <div className="flex flex-col items-center" style={{ height }}>
      <svg viewBox="0 0 180 100" className="w-full max-w-[220px]">
        {/* Background arc */}
        <path d={arcPath(0, 180, r)} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        {/* Value arc */}
        {angle > 0 && (
          <path d={arcPath(0, angle, r)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        )}
        {/* Target marker */}
        {targetAngle !== undefined && (
          <>
            <line
              x1={cx + (r + 2) * Math.cos((Math.PI / 180) * (180 - targetAngle))}
              y1={cy - (r + 2) * Math.sin((Math.PI / 180) * (180 - targetAngle))}
              x2={cx + (r - 16) * Math.cos((Math.PI / 180) * (180 - targetAngle))}
              y2={cy - (r - 16) * Math.sin((Math.PI / 180) * (180 - targetAngle))}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
          </>
        )}
        {/* Needle dot */}
        <circle cx={needleX} cy={needleY} r="3" fill={color} />
        {/* Center value */}
        <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground text-lg font-bold" style={{ fontSize: "22px" }}>
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
