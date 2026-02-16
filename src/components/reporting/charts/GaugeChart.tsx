/**
 * GaugeChart — Robust semi-circle gauge with responsive sizing.
 * Uses a proper SVG viewBox with no clipping, butt linecaps, and locked aspect ratio.
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
  // Clamp value to 0..max
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? clamped / max : 0;
  const sweepAngle = pct * 180; // 0–180 degrees

  // Color based on thresholds
  const color =
    value >= thresholds.mid
      ? "hsl(142, 76%, 36%)"
      : value >= thresholds.low
        ? "hsl(45, 93%, 47%)"
        : "hsl(0, 84%, 60%)";

  // SVG geometry — all dimensions relative to viewBox
  const viewW = 200;
  const viewH = 120; // enough for the arc + labels below
  const cx = viewW / 2;
  const cy = 95; // center of the arc (near bottom)
  const r = 70; // arc radius
  const stroke = 14; // arc thickness

  // Polar to cartesian (0° = left, 180° = right on a top semi-circle)
  const toXY = (deg: number, radius: number) => {
    const rad = (Math.PI / 180) * (180 - deg);
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  // Arc path from startDeg to endDeg
  const arc = (startDeg: number, endDeg: number, radius: number) => {
    const s = toXY(startDeg, radius);
    const e = toXY(endDeg, radius);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  // Target marker
  const targetPct = target != null ? Math.min(Math.max(target, 0), max) / max : undefined;
  const targetDeg = targetPct != null ? targetPct * 180 : undefined;

  // Needle
  const needleBase = toXY(sweepAngle, r - 20);
  const needleTip = toXY(sweepAngle, r + 6);

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{ height, maxWidth: 260 }}
    >
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full"
        style={{ aspectRatio: `${viewW}/${viewH}` }}
        role="img"
        aria-label={`Gauge showing ${value.toFixed(1)}${suffix}`}
      >
        {/* Background track */}
        <path
          d={arc(0, 180, r)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          strokeLinecap="butt"
        />

        {/* Foreground progress arc */}
        {sweepAngle > 0.5 && (
          <path
            d={arc(0, Math.min(sweepAngle, 180), r)}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        )}

        {/* Target marker line */}
        {targetDeg != null && (() => {
          const outer = toXY(targetDeg, r + stroke / 2 + 4);
          const inner = toXY(targetDeg, r - stroke / 2 - 4);
          return (
            <line
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              opacity="0.45"
            />
          );
        })()}

        {/* Needle */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          opacity="0.7"
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r="3"
          fill="hsl(var(--foreground))"
          opacity="0.5"
        />

        {/* Center value */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: "22px", fontWeight: 700 }}
        >
          {value.toFixed(1)}
          {suffix}
        </text>

        {/* Min/Max labels */}
        <text
          x={cx - r - 2}
          y={cy + 14}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: "10px" }}
        >
          0
        </text>
        <text
          x={cx + r + 2}
          y={cy + 14}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: "10px" }}
        >
          {max}
        </text>
      </svg>

      {/* Labels below the gauge */}
      {label && (
        <span className="text-xs text-muted-foreground -mt-2">{label}</span>
      )}
      {target != null && (
        <span className="text-[10px] text-muted-foreground">
          Target: {target}
          {suffix}
        </span>
      )}
    </div>
  );
}
