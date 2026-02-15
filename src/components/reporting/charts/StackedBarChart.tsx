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
}

const defaultFormat = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

export function StackedBarChart({ data, series, xAxisKey = "name", height = 300, formatValue = defaultFormat }: StackedBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
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
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId="a" radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
