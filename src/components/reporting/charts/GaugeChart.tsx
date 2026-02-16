/**
 * GaugeChart — Clean semi-circle gauge with no clipping or stray marks.
 *
 * Uses a simple polar math approach:
 *  - 180° arc from left (π) to right (0)
 *  - viewBox 0 0 200 120 with arc centered at (100, 100)
 *  - strokeLinecap="butt" to avoid endpoint bloat
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

/** Polar to cartesian — angle 0 = right, π = left */
function polarToCart(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

/** Describe an SVG arc from startAngle to endAngle (radians, counter-clockwise) */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const sweep = startAngle - endAngle; // CCW
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
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

  const color =
    value >= thresholds.mid
      ? "hsl(142, 76%, 36%)"
      : value >= thresholds.low
        ? "hsl(45, 93%, 47%)"
        : "hsl(0, 84%, 60%)";

  const CX = 100;
  const CY = 100;
  const R = 70;
  const STROKE = 12;

  const geo = useMemo(() => {
    // Full arc: from π (left) to 0 (right) — a top semicircle
    const bgPath = describeArc(CX, CY, R, Math.PI, 0);

    // Value arc: from π to (π - pct * π)
    const valueEndAngle = Math.PI - pct * Math.PI;
    const valuePath =
      pct > 0.005
        ? describeArc(CX, CY, R, Math.PI, Math.max(valueEndAngle, 0.01))
        : null;

    // Needle angle (same as value end)
    const needleAngle = Math.PI - pct * Math.PI;
    const needleTip = polarToCart(CX, CY, R - STROKE / 2 - 4, needleAngle);

    // Target marker
    let targetMarker: { x1: number; y1: number; x2: number; y2: number } | null = null;
    if (target != null && max > 0) {
      const tPct = Math.min(Math.max(target, 0), max) / max;
      const tAngle = Math.PI - tPct * Math.PI;
      const outer = polarToCart(CX, CY, R + STROKE / 2 + 3, tAngle);
      const inner = polarToCart(CX, CY, R - STROKE / 2 - 3, tAngle);
      targetMarker = { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    }

    return { bgPath, valuePath, needleTip, targetMarker };
  }, [pct, max, target]);

  return (
    <div className="flex flex-col items-center w-full" style={{ maxWidth: 240 }}>
      <div className="w-full" style={{ aspectRatio: "200 / 120" }}>
        <svg
          viewBox="0 0 200 120"
          className="w-full h-full block overflow-visible"
          role="img"
          aria-label={`${clamped.toFixed(1)}${suffix}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background track */}
          <path
            d={geo.bgPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />

          {/* Value arc */}
          {geo.valuePath && (
            <path
              d={geo.valuePath}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
            />
          )}

          {/* Target tick */}
          {geo.targetMarker && (
            <line
              x1={geo.targetMarker.x1}
              y1={geo.targetMarker.y1}
              x2={geo.targetMarker.x2}
              y2={geo.targetMarker.y2}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              opacity="0.4"
            />
          )}

          {/* Needle */}
          <line
            x1={CX}
            y1={CY}
            x2={geo.needleTip.x}
            y2={geo.needleTip.y}
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <circle cx={CX} cy={CY} r="3" fill="hsl(var(--muted-foreground))" />

          {/* Value label */}
          <text
            x={CX}
            y={CY - 16}
            textAnchor="middle"
            fill="currentColor"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {clamped.toFixed(1)}{suffix}
          </text>
        </svg>
      </div>

      {label && (
        <span className="text-xs text-muted-foreground -mt-2">{label}</span>
      )}
      {target != null && (
        <span className="text-[10px] text-muted-foreground">
          Target: {target}{suffix}
        </span>
      )}
    </div>
  );
}
