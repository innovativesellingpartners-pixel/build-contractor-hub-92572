# Reporting Charts — How to Add a New Report Widget

## Architecture

All reporting visualizations use a unified system:

1. **`ChartCard`** — Wrapper for every chart. Handles loading skeletons, empty states, and error states with retry.
2. **`reportRegistry.ts`** — Centralized config mapping `reportKey` → visual type, required fields, formatters, and empty messages.
3. **Shared chart components** — `GaugeChart`, `DonutChart`, `BulletChart`, `StackedBarChart`, `MiniSparkline`.
4. **One chart library** — `recharts` for all chart types (bar, area, pie/donut). Custom SVG only for `GaugeChart`.

## Adding a New Report Widget

### 1. Register it

Add an entry to `src/components/reporting/charts/reportRegistry.ts`:

```ts
my_new_chart: {
  key: "my_new_chart",
  title: "My New Chart",
  description: "What this chart shows.",
  visualType: "bar", // gauge | donut | area | bar | stacked_bar | bullet | sparkline | table | kpi_card | funnel
  requiredFields: ["myDataArray"],
  formatter: "currency", // currency | percent | number | count
  defaultTimeRange: "ytd",
  emptyMessage: "No data available for this chart.",
},
```

### 2. Use ChartCard

Wrap your chart in a `ChartCard`:

```tsx
import { ChartCard } from "../charts/ChartCard";

<ChartCard
  title="My New Chart"
  subtitle="Optional subtitle"
  isLoading={isLoading}
  isEmpty={!data || data.length === 0}
  emptyMessage="No data available."
  error={error}
  onRetry={refetch}
>
  {/* Your chart component here */}
</ChartCard>
```

### 3. Choose a chart component

| Visual Type | Component | Import |
|---|---|---|
| Gauge | `<GaugeChart value={42} target={80} />` | `../charts/GaugeChart` |
| Donut | `<DonutChart data={[...]} centerValue="$5k" />` | `../charts/DonutChart` |
| Bullet | `<BulletChart actual={5000} target={8000} label="Budget" />` | `../charts/BulletChart` |
| Stacked Bar | `<StackedBarChart data={[...]} series={[...]} />` | `../charts/StackedBarChart` |
| Sparkline | `<MiniSparkline data={[1,2,3]} />` | `../charts/MiniSparkline` |
| Area/Bar/Line | Use `recharts` directly | `recharts` |

### 4. Data safety

- Always clamp percentages: `Math.min(Math.max(value, 0), 100)`
- Handle empty arrays: check `data.length > 0` before rendering
- Handle division by zero: `total > 0 ? (part / total) * 100 : 0`
- Pass `isEmpty` to ChartCard when data is missing

### 5. Styling rules

- Use `hsl(var(--*))` design tokens, never raw hex colors
- Use `tabular-nums` for all numeric displays
- Use consistent tooltip styles (see existing chart components)
- GaugeChart handles its own responsive sizing via `viewBox`
