
# Plan: Lead Edit Dialog Updates & Full-Page Desktop Views

## Overview
This plan addresses four main requirements:
1. Change "Convert to Customer" to "Convert to Job" in lead editing
2. Update lead status dropdown options (remove won/lost, add job)
3. Remove converted leads from the leads queue
4. Make edit/view dialogs full-page on desktop (keep mobile unchanged)

---

## Changes

### 1. Update Lead Status Options

**File: `src/hooks/useLeads.ts`**
- Modify the Lead interface status type from:
  `'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost'`
  to:
  `'new' | 'contacted' | 'qualified' | 'quoted' | 'job' | 'converted'`

**File: `src/components/contractor/EditLeadDialog.tsx`**
- Update the SearchableSelect options for status (around line 204-211):
  - Remove "Won" and "Lost" options
  - Add "Job" option
  - Keep: New, Contacted, Qualified, Quoted, Job

**File: `src/components/contractor/crm/sections/LeadsSection.tsx`**
- Update `getStatusColor` function to add color for "job" status and remove "won"/"lost"

---

### 2. Change "Convert to Customer" to "Convert to Job"

**File: `src/components/contractor/EditLeadDialog.tsx`**
- Change the button label from "Convert to Customer" to "Convert to Job" (line 301-302)
- Change the icon from `Users` to `Briefcase`
- Update the alert dialog text:
  - Title: "Convert Lead to Job?"
  - Description: "This will create a new job and customer from this lead. The lead will be marked as converted."
- Modify `handleConvertToCustomer` to use the existing `convert-lead-to-job` edge function instead of directly creating a customer

---

### 3. Filter Converted Leads from Leads Queue

**File: `src/hooks/useLeads.ts`**
- Modify the `fetchLeads` query to filter out leads that have `converted_to_job_id` set (meaning they've been converted to a job)
- Add filter: `.is('converted_to_job_id', null)` alongside the existing archived filter

---

### 4. Full-Page Desktop Views for Detail/Edit Dialogs

Create a responsive approach that uses full viewport on desktop while keeping the current modal behavior on mobile.

**Files to modify:**
- `src/components/contractor/crm/sections/LeadsSection.tsx` (Lead Detail Dialog)
- `src/components/contractor/crm/sections/CustomersSection.tsx` (Customer Detail Dialog)
- `src/components/contractor/crm/sections/EstimatesSection.tsx` (Estimate Detail Dialog and Estimate Builder Dialog)
- `src/components/contractor/crm/sections/JobsSection.tsx` (uses JobDetailViewBlue which has its own Dialog)
- `src/components/contractor/crm/JobDetailViewBlue.tsx` (Job Detail Dialog)
- `src/components/contractor/EditLeadDialog.tsx` (Edit Lead Dialog)
- `src/components/contractor/crm/EditJobDialog.tsx` (Edit Job Dialog)
- `src/components/contractor/crm/EditCustomerDialog.tsx` (Edit Customer Dialog)

**Approach:**
Change DialogContent classes from:
```
className="max-w-2xl h-[calc(100vh-5rem)] top-[45%] sm:top-[50%] ..."
```
To responsive full-page on larger screens:
```
className="w-full h-full max-w-full max-h-full md:max-w-full md:h-screen md:max-h-screen md:rounded-none md:border-0 sm:max-w-2xl sm:h-[calc(100vh-5rem)] sm:top-[50%] ..."
```

The key is using breakpoints:
- **Mobile (default)**: Current modal behavior with `max-w-2xl` and height constraints
- **Desktop (md: and above)**: Full viewport width and height, no rounded corners or borders

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/hooks/useLeads.ts` | Update Lead status type, filter out converted leads |
| `src/components/contractor/EditLeadDialog.tsx` | Change button to "Convert to Job", update status options, full-page desktop dialog |
| `src/components/contractor/crm/sections/LeadsSection.tsx` | Update status colors, full-page desktop detail dialog |
| `src/components/contractor/crm/sections/CustomersSection.tsx` | Full-page desktop detail dialog |
| `src/components/contractor/crm/sections/EstimatesSection.tsx` | Full-page desktop dialogs |
| `src/components/contractor/crm/JobDetailViewBlue.tsx` | Full-page desktop detail dialog |
| `src/components/contractor/crm/EditJobDialog.tsx` | Full-page desktop dialog |
| `src/components/contractor/crm/EditCustomerDialog.tsx` | Full-page desktop dialog |

---

## Expected Behavior After Changes

1. **Lead Status Dropdown**: Shows New, Contacted, Qualified, Quoted, Job (no Won/Lost)
2. **Convert Button**: Shows "Convert to Job" with briefcase icon, creates both job and customer when clicked
3. **Leads Queue**: Only shows active leads; once converted to a job, the lead disappears from the queue
4. **Desktop Views**: All detail and edit dialogs expand to full browser page
5. **Mobile Views**: No change - dialogs remain as current modal overlays
