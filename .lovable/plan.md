

# Enhanced Data Visualizations and KPI Analytics

## Overview
Add richer chart types and visual analytics across the Dashboard and Report pages to give contractors better insight into their business performance. All existing data sources and logic stay the same -- this adds new visual components on top.

## What Gets Added

### 1. Shared Chart Components (new files)

**DonutChart** (`src/components/reporting/charts/DonutChart.tsx`)
- Reusable donut/ring chart with center label showing total or key metric
- Used for: expense breakdown, estimate status composition, job status composition
- Replaces the basic PieChart in ExpenseBreakdown with a cleaner donut variant
- Props: data array, colors, center label, height

**GaugeChart** (`src/components/reporting/charts/GaugeChart.tsx`)
- Semi-circle gauge showing a value against a target (e.g., gross margin target of 30%)
- Used for: gross margin gauge on Dashboard, conversion rate gauge on Sales Pipeline
- Props: value, max, target, label, color thresholds

**MiniSparkline** (`src/components/reporting/charts/MiniSparkline.tsx`)
- Tiny inline line/area chart (50x20px) for embedding in table cells or metric cards
- Used for: trend columns in job tables, revenue trend in metric cards
- Props: data points array, color, width, height

**StackedBarChart** (`src/components/reporting/charts/StackedBarChart.tsx`)
- Stacked bar for comparing composition over time (e.g., revenue by trade type per month, expenses by category per month)
- Props: data, series config, height

**BulletChart** (`src/components/reporting/charts/BulletChart.tsx`)
- Horizontal bullet chart for goal-vs-actual display
- Used for: budget vs actual per job, revenue vs target
- Props: actual, target, ranges, label

### 2. Executive Dashboard Enhancements (`UnifiedDashboard.tsx`)

Current state: metric cards + text lists + simple pipeline circles
Changes:
- Replace the plain "Gross Margin" text display with a **GaugeChart** component
- Add a **revenue trend sparkline** inside the Total Revenue metric card using MiniSparkline
- Replace the "Active Jobs Forecast" text grid with a **BulletChart** showing budget vs spent per active category
- Add a new **"Monthly Revenue Trend"** area chart card below the metric row -- uses the same jobs data already fetched, grouped by month
- Add a **DonutChart** for job status composition (scheduled / in_progress / completed / on_hold) next to the pipeline funnel

### 3. Sales Pipeline Report Enhancements (`SalesPipelineReport.tsx`)

Current state: metric cards + ConversionAnalytics + funnel bar chart + sales over time bar
Changes:
- Add a **conversion rate GaugeChart** alongside the existing conversion metrics
- Upgrade the EstimateFunnelChart with gradient fills and rounded bar corners for modern look

### 4. Jobs & Projects Report Enhancements (`JobsProjectsReport.tsx`)

Current state: metric cards + bar chart by trade + profitability table
Changes:
- Add **MiniSparkline** trend column to the job profitability table showing margin trend
- Add a **StackedBarChart** showing revenue breakdown by trade type over time
- Add a **DonutChart** showing job status distribution

### 5. Revenue Report Enhancements (`RevenueFinancialReport.tsx`)

Current state: metric cards + RevenueProfitChart (composed bar+line) + payment table
Changes:
- Add a **monthly revenue area chart** with gradient fill (cleaner alternative view alongside existing bar chart)
- Add **BulletChart** for revenue vs target if any target data exists

### 6. Expenses Report Enhancements (`ExpensesProfitabilityReport.tsx`)

Current state: metric cards + pie chart + P&L statement + vendor list
Changes:
- Replace the basic Pie chart with a **DonutChart** showing expense categories with center total
- Add a **StackedBarChart** showing expense trend by category over time

### 7. Conversion Analytics Visual Upgrade (`ConversionAnalytics.tsx`)

Current state: cards + circles pipeline + progress bars for status breakdowns
Changes:
- Replace the pipeline circles with a proper **funnel visualization** using progressively narrower bars
- Add **GaugeChart** for overall conversion rate

## Technical Details

### New files to create:
1. `src/components/reporting/charts/DonutChart.tsx`
2. `src/components/reporting/charts/GaugeChart.tsx`
3. `src/components/reporting/charts/MiniSparkline.tsx`
4. `src/components/reporting/charts/StackedBarChart.tsx`
5. `src/components/reporting/charts/BulletChart.tsx`

### Files to modify:
1. `src/components/reporting/unified/UnifiedDashboard.tsx` -- add gauge, donut, area chart, bullet chart
2. `src/components/reporting/unified/SalesPipelineReport.tsx` -- add gauge
3. `src/components/reporting/unified/JobsProjectsReport.tsx` -- add stacked bar, donut, sparklines
4. `src/components/reporting/unified/ExpensesProfitabilityReport.tsx` -- swap pie for donut, add stacked bar
5. `src/components/reporting/ConversionAnalytics.tsx` -- upgrade pipeline viz, add gauge
6. `src/components/reporting/unified/RevenueFinancialReport.tsx` -- add area chart option

### Libraries used:
- `recharts` (already installed) -- PieChart for donut, custom SVG for gauge, AreaChart, BarChart with stacking
- All chart components use `ResponsiveContainer` for fluid sizing
- Consistent color palette using existing HSL design tokens

### Data sources:
- No new API calls or database queries needed
- All charts use data already fetched by existing hooks and queries
- Sparklines derive from the same monthly-grouped data already computed

### What stays the same:
- All existing charts remain (new ones are additive)
- All metric card logic, drill-down behavior, and click handlers preserved
- All filter, export, and date range controls unchanged
- No route, API, or database changes
