/**
 * GaugeChart — Clean semi-circle gauge with no clipping or stray marks.
 * Uses thin arcs, proper viewBox padding, and simple needle.
 */

interface GaugeChartProps {
  value: number;
  max?: number;
  target?: number;
  label?: string;
  suffix?: string;
  height?: number;
  thresholds?: { low: number; mid: number };
}

export function GaugeChart({
  value,
  max = 100,
  target,
  label,
  suffix = "%",
  height = 180,
  thresholds = { low: 15, mid: 25 },
}: GaugeChartProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? clamped / max : 0;

  const color =
    value >= thresholds.mid
      ? "hsl(142, 76%, 36%)"
      : value >= thresholds.low
        ? "hsl(45, 93%, 47%)"
        : "hsl(0, 84%, 60%)";

  // Geometry — generous viewBox with padding
  const cx = 100;
  const cy = 100;
  const r = 80;
  const strokeW = 8;
  const viewBox = "0 0 200 130";

  // Convert angle (0=left, 180=right) to SVG coordinates
  const polar = (deg: number, radius: number) => {
    const rad = ((180 - deg) * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy - radius * Math.sin(rad)] as const;
  };

  // SVG arc path
  const arcPath = (from: number, to: number) => {
    const [sx, sy] = polar(from, r);
    const [ex, ey] = polar(to, r);
    const large = to - from > 180 ? 1 : 0;
    return `M${sx},${sy} A${r},${r} 0 ${large} 0 ${ex},${ey}`;
  };

  const sweepDeg = pct * 180;

  // Needle endpoint
  const [nx, ny] = polar(sweepDeg, r - strokeW - 4);

  return (
    <div className="flex flex-col items-center w-full" style={{ maxWidth: 240 }}>
      <svg viewBox={viewBox} className="w-full" role="img" aria-label={`${value.toFixed(1)}${suffix}`}>
        {/* Background track */}
        <path
          d={arcPath(0, 180)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {sweepDeg > 1 && (
          <path
            d={arcPath(0, Math.min(sweepDeg, 179.9))}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}

        {/* Target tick */}
        {target != null && (() => {
          const tDeg = (Math.min(Math.max(target, 0), max) / max) * 180;
          const [ox, oy] = polar(tDeg, r + strokeW / 2 + 3);
          const [ix, iy] = polar(tDeg, r - strokeW / 2 - 3);
          return (
            <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.35" />
          );
        })()}

        {/* Needle line from center to arc */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="2.5" fill="hsl(var(--muted-foreground))" />

        {/* Value text */}
        <text x={cx} y={cy - 16} textAnchor="middle" className="fill-foreground" style={{ fontSize: "20px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {value.toFixed(1)}{suffix}
        </text>

        {/* Min / Max */}
        <text x={cx - r} y={cy + 16} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "9px" }}>0</text>
        <text x={cx + r} y={cy + 16} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "9px" }}>{max}</text>
      </svg>

      {label && <span className="text-xs text-muted-foreground -mt-1">{label}</span>}
      {target != null && <span className="text-[10px] text-muted-foreground">Target: {target}{suffix}</span>}
    </div>
  );
}
