

## Fix Overflowing Charts in Sales & Reporting

### Problem
The Sales Pipeline Funnel and Overall Conversion charts are breaking their boundaries:

1. **Funnel bars overflow their card** -- When a stage count exceeds the Leads count (e.g., Estimates: 22 vs Leads: 6), the width is calculated as `(22/6) * 100 = 366%`, making the bar blast way outside the card.
2. **Gauge chart bleeds into adjacent content** -- The SVG uses `overflow-visible`, allowing the arc and text to overlap neighboring elements.

### Fixes

**1. Cap funnel bar widths at 100%**
In `ConversionAnalytics.tsx`, add `Math.min(..., 100)` to the width calculations for Estimates, Customers, and Jobs so no bar ever exceeds the container width. Also add `overflow-hidden` to the bar container div for safety.

**2. Constrain the GaugeChart SVG**
In `GaugeChart.tsx`, remove `overflow-visible` from the SVG element so the gauge stays within its bounding box. Adjust the viewBox slightly to give enough room for the arc stroke without needing overflow.

**3. Add overflow protection to ChartCard**
Add `overflow-hidden` to the `CardContent` in `ChartCard.tsx` so no chart can ever break out of its card boundary.

### Technical Details

Files to modify:
- `src/components/reporting/ConversionAnalytics.tsx` (lines 305-315) -- cap width values and add overflow-hidden
- `src/components/reporting/charts/GaugeChart.tsx` (line 100) -- remove overflow-visible class from SVG
- `src/components/reporting/charts/ChartCard.tsx` (line 125) -- add overflow-hidden to CardContent

