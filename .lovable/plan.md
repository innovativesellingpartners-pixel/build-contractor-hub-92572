
# Modernize CRM Section UIs: Leads, Jobs, Customers, Estimates, Invoices

## Overview
Apply the same modern, clean "tech" design language already established in Reporting to all five core CRM sections. This is a visual-only refresh -- no routes, APIs, permissions, or logic changes.

## Shared Foundation Updates

### 1. HorizontalRowCard modernization
Update the shared list row component used across Leads, Jobs, Customers, and Estimates:
- Increase border radius to `rounded-xl` (matching card updates)
- Add subtle shadow on hover (`hover:shadow-md`)
- Improve padding rhythm (`px-4 py-3.5`)
- Add a left accent border on hover for visual feedback
- Clean up avatar with softer background tones

### 2. ProvenJobsTheme modernization
Update the shared detail view theme components:
- **DetailHeader**: Soften the dark header from pure `bg-foreground` to a gradient with subtle depth; improve spacing
- **InfoCard**: Add `rounded-xl` and subtle shadow
- **SectionHeader**: Modernize from heavy left-border style to a cleaner pill/chip label style
- **ActionButton**: Match button radius and transition styles from the updated button component
- **StatusBadge**: Use `rounded-md` with softer tinted backgrounds (matching new badge variants)
- **ActionButtonRow**: Cleaner spacing and background treatment
- **MoneyDisplay**: Add `tracking-tight` for numeric emphasis

### 3. PredictiveSearch modernization
- Match input styling with updated `rounded-xl` inputs
- Improve dropdown shadow and border radius
- Cleaner result row hover states

### 4. CrmNavHeader modernization
- Softer button styling, slightly larger touch targets
- Breadcrumb separator styling improvement

### 5. MobileOptimizedWrapper modernization
- Update card wrappers to use new rounded corners and shadow scale

## Section-Specific Updates

### 6. LeadsSection
- **Page header**: Stronger typographic hierarchy with `tracking-tight` on the title
- **Status badges**: Replace raw `bg-blue-500 text-white` classes with tinted variants (e.g., `bg-blue-500/10 text-blue-700`) for a modern flat look
- **Empty state**: Add icon and improved spacing
- **Loading state**: Replace plain text with skeleton shimmer

### 7. JobsSection
- Same header and badge treatment as Leads
- Status badges updated to tinted pill style
- Loading and empty state improvements

### 8. CustomersSection
- Same header treatment
- Customer type badge uses new `secondary` variant styling
- Linked record badges get cleaner outline treatment

### 9. EstimatesSection
- **Lifecycle progress dots**: Increase size slightly, add subtle connecting line
- Status filter dropdown gets `rounded-xl` treatment
- Estimate cards match new HorizontalRowCard style
- Loading spinner replaced with skeleton cards

### 10. InvoicesSection
- **Invoice cards**: Migrate from raw Card usage to HorizontalRowCard pattern for consistency with other sections
- Status badges use tinted color system instead of raw Tailwind background classes
- Amount display uses `tabular-nums tracking-tight`
- Empty state gets icon + cleaner text hierarchy

## Technical Details

### Files to modify (in order):
1. `src/components/contractor/crm/sections/HorizontalRowCard.tsx` -- rounded-xl, shadow, hover accent
2. `src/components/contractor/crm/sections/ProvenJobsTheme.tsx` -- all shared detail components
3. `src/components/contractor/crm/PredictiveSearch.tsx` -- dropdown and input styling
4. `src/components/contractor/crm/CrmNavHeader.tsx` -- button and layout refinements
5. `src/components/contractor/crm/sections/MobileOptimizedWrapper.tsx` -- card wrappers
6. `src/components/contractor/crm/sections/LeadsSection.tsx` -- badge colors, header, empty/loading states
7. `src/components/contractor/crm/sections/JobsSection.tsx` -- badge colors, header, empty/loading states
8. `src/components/contractor/crm/sections/CustomersSection.tsx` -- badge and header styling
9. `src/components/contractor/crm/sections/EstimatesSection.tsx` -- progress dots, badges, loading
10. `src/components/contractor/crm/sections/InvoicesSection.tsx` -- card consistency, badge colors, amounts

### Design tokens already in place (from prior Reporting update):
- `--shadow-xs` through `--shadow-xl`
- `rounded-xl` base radius
- `tabular-nums` for financial data
- Tinted badge variants (success, info, warning)
- Updated card, table, input, and button components

### What stays the same:
- All routes and navigation structure
- All API calls, hooks, and data fetching logic
- All dialog/modal behavior and form logic
- All filters, exports, and action handlers
- All permissions and auth checks
- Component public interfaces (props)
