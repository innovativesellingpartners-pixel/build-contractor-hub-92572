/**
 * GaugeChart — Clean semi-circle gauge with no clipping or stray marks.
 * Supports onClick for drill-down.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max?: number;
  target?: number;
  label?: string;
  suffix?: string;
  thresholds?: { low: number; mid: number };
  onClick?: () => void;
}

function polarToCart(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const sweep = startAngle - endAngle;
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
  onClick,
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
    const bgPath = describeArc(CX, CY, R, Math.PI, 0);
    const valueEndAngle = Math.PI - pct * Math.PI;
    const valuePath =
      pct > 0.005
        ? describeArc(CX, CY, R, Math.PI, Math.max(valueEndAngle, 0.01))
        : null;
    const needleAngle = Math.PI - pct * Math.PI;
    const needleTip = polarToCart(CX, CY, R - STROKE / 2 - 4, needleAngle);
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

  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        "flex flex-col items-center w-full",
        isClickable && "cursor-pointer group"
      )}
      style={{ maxWidth: 240 }}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); } : undefined}
    >
      <div className={cn("w-full transition-transform", isClickable && "group-hover:scale-105")} style={{ aspectRatio: "200 / 120" }}>
        <svg
          viewBox="0 0 200 120"
          className="w-full h-full block overflow-hidden"
          role="img"
          aria-label={`${clamped.toFixed(1)}${suffix}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={geo.bgPath} fill="none" stroke="hsl(var(--muted))" strokeWidth={STROKE} strokeLinecap="butt" />
          {geo.valuePath && (
            <path d={geo.valuePath} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="butt" />
          )}
          {geo.targetMarker && (
            <line x1={geo.targetMarker.x1} y1={geo.targetMarker.y1} x2={geo.targetMarker.x2} y2={geo.targetMarker.y2} stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.4" />
          )}
          <line x1={CX} y1={CY} x2={geo.needleTip.x} y2={geo.needleTip.y} stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.5" />
          <circle cx={CX} cy={CY} r="3" fill="hsl(var(--muted-foreground))" />
          <text x={CX} y={CY - 16} textAnchor="middle" fill="currentColor" style={{ fontSize: "20px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {clamped.toFixed(1)}{suffix}
          </text>
        </svg>
      </div>
      {label && <span className="text-xs text-muted-foreground -mt-2">{label}</span>}
      {target != null && <span className="text-[10px] text-muted-foreground">Target: {target}{suffix}</span>}
      {isClickable && <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">Click for details →</span>}
    </div>
  );
}
