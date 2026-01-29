
# Mobile Overflow Fix: Content Bleeding Off Screen Edges

## Problem Summary
Content in dialog forms (especially "Add New Job" and "Edit Job") is bleeding off the left edge of the screen on mobile devices. Labels like "ob Name", "escription", "tatus" appear cut off because the first letters are hidden beyond the viewport boundary.

## Root Causes Identified

1. **DialogContent Base Component** (`src/components/ui/dialog.tsx`)
   - Uses fixed `p-6` padding which is too generous for narrow mobile screens
   - Missing `overflow-x-hidden` to prevent horizontal content bleed
   - No explicit mobile-first width constraints

2. **Fixed Grid Column Layouts**
   - `grid-cols-6` used in AddJobDialog and EditJobDialog for City/State/Zip fields
   - `grid-cols-3` in AddLeadDialog for the same address fields
   - These don't collapse to single column on mobile, forcing content to squeeze

3. **Nested Flex/Grid Containers**
   - Some form sections don't have `min-w-0` to prevent flex children from overflowing

## Implementation Plan

### Phase 1: Fix Core Dialog Component (Highest Impact)

**File: `src/components/ui/dialog.tsx`**

Update `DialogContent` to:
- Add `overflow-x-hidden` to prevent horizontal bleed
- Change padding from `p-6` to `px-4 py-6 sm:p-6` for mobile-friendly spacing
- Add `max-w-[calc(100vw-2rem)]` to ensure dialogs never exceed viewport width on mobile

### Phase 2: Fix Job Dialog Grid Layouts

**File: `src/components/contractor/crm/AddJobDialog.tsx`**

Update the City/State/Zip grid from:
```tsx
<div className="grid grid-cols-6 gap-4">
```
To:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
```

Adjust column spans:
- City: `col-span-2 sm:col-span-3`
- State: `col-span-1`
- Zip: `col-span-1 sm:col-span-2`

**File: `src/components/contractor/crm/EditJobDialog.tsx`**

Apply the same grid layout fixes as AddJobDialog.

### Phase 3: Fix Lead Dialog Grid Layouts

**File: `src/components/contractor/AddLeadDialog.tsx`**

Update City/State/Zip grid from:
```tsx
<div className="grid grid-cols-3 gap-4">
```
To:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

### Phase 4: Add Global Mobile Overflow Prevention

**File: `src/components/ui/dialog.tsx`**

Add to the DialogContent inner container:
- `min-w-0` to prevent flex/grid overflow
- Ensure all children respect container boundaries

### Phase 5: Audit and Fix Other Affected Dialogs

Apply similar mobile-first grid patterns to:
- `src/components/contractor/crm/AddCustomerDialog.tsx`
- `src/components/contractor/crm/EditCustomerDialog.tsx`
- `src/components/contractor/crm/AddOpportunityDialog.tsx`
- `src/components/contractor/EditLeadDialog.tsx`
- `src/components/contractor/crm/ScheduleMeetingDialog.tsx`
- `src/components/contractor/ProfileEditDialog.tsx`

Each dialog will be checked for:
- Fixed grid column counts without mobile breakpoints
- Proper padding on mobile
- `min-w-0` on flex containers

## Technical Details

### DialogContent Component Changes

```tsx
// Before
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg ...",
  className,
)}

// After
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg max-w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background px-4 py-6 sm:p-6 shadow-lg overflow-x-hidden ...",
  className,
)}
```

### Grid Layout Pattern (Mobile-First)

```tsx
// Location fields - 2 columns on mobile, 6 on desktop
<div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
  <div className="col-span-2 sm:col-span-3">City</div>
  <div className="col-span-1">State</div>
  <div className="col-span-1 sm:col-span-2">Zip</div>
</div>
```

## Files to Modify

| File | Change Type |
|------|-------------|
| `src/components/ui/dialog.tsx` | Core fix - padding, overflow, max-width |
| `src/components/contractor/crm/AddJobDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/crm/EditJobDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/AddLeadDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/crm/AddCustomerDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/crm/EditCustomerDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/crm/AddOpportunityDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/EditLeadDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/ProfileEditDialog.tsx` | Grid layout responsive fix |
| `src/components/contractor/crm/ScheduleMeetingDialog.tsx` | Grid layout responsive fix |

## Testing Checklist

After implementation, verify on mobile (375px width):
- [ ] Add Job dialog - all labels fully visible
- [ ] Edit Job dialog - all labels fully visible
- [ ] Add Lead dialog - City/State/Zip stack properly
- [ ] Add Customer dialog - all fields contained
- [ ] Edit Customer dialog - all fields contained
- [ ] Schedule Meeting dialog - time/duration fields visible
- [ ] No horizontal scrolling on any dialog
- [ ] All content stays within screen boundaries
- [ ] Works in both light and dark mode
- [ ] Desktop layout unchanged (no regression)

## Design Principles Applied

1. **Mobile-first grid**: Use smaller column counts by default, expand on larger screens
2. **Responsive padding**: Less padding on mobile, more on desktop
3. **Overflow prevention**: Always add `overflow-x-hidden` and `min-w-0` to containers
4. **Max-width constraints**: Ensure modals never exceed `calc(100vw - 2rem)` on mobile
