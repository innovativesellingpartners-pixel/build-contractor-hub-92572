

## Convert Estimate Filter Chips to Labeled Dropdown on Mobile

The filter chips (All, Draft, Sent, Viewed, Signed, Paid) currently display as small unlabeled buttons that can be confusing on mobile. This change replaces them with a labeled Select dropdown that matches the site-wide sub-navigation pattern.

### What changes

**File: `src/components/contractor/crm/sections/EstimatesSection.tsx`**

Replace the filter chips `div` (lines 350-365) with:
- A labeled row: "Filter by Status" label + a `Select` dropdown
- The dropdown contains options: All, Draft, Sent, Viewed, Signed, Paid
- Uses the existing `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` components already used throughout the app
- Keeps the same `statusFilter` state and filtering logic -- only the UI control changes
- Compact layout: label and dropdown sit side-by-side on one row with proper spacing

This aligns with the site-wide convention of using dropdown selection menus for sub-navigation and filtering (per the established hub pattern), and is clear and accessible on all screen sizes.

### Technical details

- Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` (already available in the project)
- Replace the `map` of `<button>` chips with a single `<Select>` component
- Add a `<label>` or `<span>` with text "Filter by Status" to the left of the dropdown
- The `onValueChange` callback calls `setStatusFilter(value)`
- No new dependencies, no DB changes

