/**
 * GaugeChart — Responsive semi-circle gauge.
 *
 * Design:
 *  - viewBox is 220×130 so arcs + labels never clip.
 *  - Arcs use strokeLinecap="round" with thin (10px) strokes.
 *  - Needle + center dot are purely cosmetic overlays.
 *  - The SVG is wrapped in a locked-aspect-ratio container
 *    so it cannot collapse to 0 height.
 */

import { useMemo } from "react";

interface GaugeChartProps {
  value: number;
  max?: number;
  target?: number;
  label?: string;
  suffix?: string;
  thresholds?: { low: number; mid: number };
}

export function GaugeChart({
  value,
  max = 100,
  target,
  label,
  suffix = "%",
  thresholds = { low: 15, mid: 25 },
}: GaugeChartProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? clamped / max : 0;

  // Color based on thresholds
  const color =
    value >= thresholds.mid
      ? "hsl(142, 76%, 36%)"
      : value >= thresholds.low
        ? "hsl(45, 93%, 47%)"
        : "hsl(0, 84%, 60%)";

  /* ─── Geometry ─── */
  const CX = 110;        // center x in viewBox
  const CY = 105;        // center y — slightly below center for text room
  const R = 80;           // arc radius
  const STROKE = 10;      // arc thickness
  const VB = "0 0 220 130"; // generous viewBox — nothing clips

  const geometry = useMemo(() => {
    /** Convert gauge-degrees (0 = left, 180 = right) to SVG x,y */
    const toXY = (deg: number, radius: number) => {
      const rad = ((180 - deg) * Math.PI) / 180;
      return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)] as const;
    };

    /** SVG arc path from `from` degrees to `to` degrees */
    const arcPath = (from: number, to: number) => {
      const [sx, sy] = toXY(from, R);
      const [ex, ey] = toXY(to, R);
      const large = to - from > 180 ? 1 : 0;
      return `M${sx},${sy} A${R},${R} 0 ${large} 0 ${ex},${ey}`;
    };

    const sweepDeg = pct * 180;
    const needleDeg = sweepDeg;

    // Needle tip — stop a bit inside the arc
    const [nx, ny] = toXY(needleDeg, R - STROKE - 6);

    // Target tick — small line across the arc
    let targetLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
    if (target != null) {
      const tDeg = (Math.min(Math.max(target, 0), max) / max) * 180;
      const [ox, oy] = toXY(tDeg, R + STROKE / 2 + 4);
      const [ix, iy] = toXY(tDeg, R - STROKE / 2 - 4);
      targetLine = { x1: ix, y1: iy, x2: ox, y2: oy };
    }

    return { arcPath, sweepDeg, nx, ny, targetLine };
  }, [pct, max, target]);

  const { arcPath, sweepDeg, nx, ny, targetLine } = geometry;

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{ maxWidth: 260 }}
    >
      {/* Aspect-ratio locked container — prevents 0-height collapse */}
      <div className="w-full" style={{ aspectRatio: "220 / 130" }}>
        <svg
          viewBox={VB}
          className="w-full h-full block"
          role="img"
          aria-label={`${value.toFixed(1)}${suffix}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background track */}
          <path
            d={arcPath(0, 180)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Value arc — only render if > 0 */}
          {sweepDeg > 0.5 && (
            <path
              d={arcPath(0, Math.min(sweepDeg, 179.5))}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          )}

          {/* Target tick */}
          {targetLine && (
            <line
              x1={targetLine.x1}
              y1={targetLine.y1}
              x2={targetLine.x2}
              y2={targetLine.y2}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              opacity="0.3"
              strokeLinecap="round"
            />
          )}

          {/* Needle */}
          <line
            x1={CX}
            y1={CY}
            x2={nx}
            y2={ny}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            opacity="0.5"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={CX} cy={CY} r="3" fill="hsl(var(--muted-foreground))" />

          {/* Value text */}
          <text
            x={CX}
            y={CY - 18}
            textAnchor="middle"
            className="fill-foreground"
            style={{
              fontSize: "22px",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              fontFamily: "inherit",
            }}
          >
            {value.toFixed(1)}{suffix}
          </text>

          {/* Min / Max labels */}
          <text
            x={CX - R}
            y={CY + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "10px" }}
          >
            0
          </text>
          <text
            x={CX + R}
            y={CY + 16}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "10px" }}
          >
            {max}
          </text>
        </svg>
      </div>

      {/* Labels below the gauge */}
      {label && (
        <span className="text-xs text-muted-foreground -mt-1">{label}</span>
      )}
      {target != null && (
        <span className="text-[10px] text-muted-foreground">
          Target: {target}{suffix}
        </span>
      )}
    </div>
  );
}
