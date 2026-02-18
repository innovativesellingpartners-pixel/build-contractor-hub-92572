import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DonutChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
  onSegmentClick?: (entry: { name: string; value: number }) => void;
}

const DEFAULT_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(174, 62%, 47%)",
  "hsl(24, 95%, 53%)",
  "hsl(280, 70%, 55%)",
];

const fmtNum = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

export function DonutChart({ data, colors = DEFAULT_COLORS, centerLabel, centerValue, height = 280, onSegmentClick }: DonutChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>No data</div>;
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            className={onSegmentClick ? "cursor-pointer" : ""}
            onClick={(_, index) => {
              if (onSegmentClick && data[index]) {
                onSegmentClick(data[index]);
              }
            }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            formatter={(value: number, name: string) => [fmtNum(value), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && <span className="text-2xl font-bold tracking-tight">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {data.map((entry, i) => (
          <button
            key={entry.name}
            className="flex items-center gap-1.5 text-xs hover:underline underline-offset-2 transition-colors"
            onClick={() => onSegmentClick?.(entry)}
            type="button"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </button>
        ))}
      </div>
      {onSegmentClick && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">Click a segment or label to drill down</p>
      )}
    </div>
  );
}
