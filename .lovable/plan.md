

## Plan: Simplify to Single Small Red AI Button

### What changes
The current dashboard has a large, dark floating Pocket Agent button with a pulsing dot. Replace it with a compact red circular button containing just the CT1 logo — clean, minimal, and consistent across all pages.

### Changes

**1. Update `src/components/Dashboard.tsx` (lines 836-859)**
Replace the current large dark floating button with a small red circle button:
- Simple `h-12 w-12` red (`bg-primary`) rounded-full button
- CT1 logo centered inside (`h-7 w-7`)
- Keep existing drag functionality and click handler
- Remove the outer dark container, pulsing dot, and nested divs

**2. Update `src/components/DashboardPocketAgent.tsx`**
Match the same style — small red circular button with CT1 logo for the other dashboard routes (reporting, accounting, etc.). Replace the current dark pill-shaped button with the same compact red circle.

### Result
One consistent, small red circular AI button with the CT1 logo on every dashboard/CRM page.

