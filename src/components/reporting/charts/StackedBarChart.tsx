import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface StackedBarChartProps {
  data: Record<string, any>[];
  series: SeriesConfig[];
  xAxisKey?: string;
  height?: number;
  formatValue?: (v: number) => string;
  onBarClick?: (data: any) => void;
}

const defaultFormat = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function StackedBarChart({ data, series, xAxisKey = "name", height = 300, formatValue = defaultFormat, onBarClick }: StackedBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>No data</div>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} onClick={(e) => {
          if (onBarClick && e?.activePayload?.[0]?.payload) {
            onBarClick(e.activePayload[0].payload);
          }
        }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey={xAxisKey} className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            formatter={(value: number, name: string) => [formatValue(value), name]}
            cursor={onBarClick ? { fill: "hsl(var(--muted))", fillOpacity: 0.5 } : undefined}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId="a" radius={[0, 0, 0, 0]} className={onBarClick ? "cursor-pointer" : ""} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {onBarClick && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">Click a bar to drill down</p>
      )}
    </div>
  );
}
