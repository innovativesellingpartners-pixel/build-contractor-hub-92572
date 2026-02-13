

## Plan: Fix Jobs Not Loading in Expense Assignment + Add "Assign Expenses" to Jobs Section

### Problem 1: Jobs Not Populating in Assign Expenses Dialog

The `DropTargetPanel` queries jobs using `.eq("user_id", user.id)`. The query itself looks correct, and RLS policies allow users to view their own jobs (`auth.uid() = user_id`). However, there's no error handling — if the query fails silently, you'd see zero jobs with no feedback.

**Fix:**
- Add error handling and logging to the jobs/customers/estimates queries in `DropTargetPanel.tsx` so failures are visible
- Add an empty-state message when no jobs are found (e.g., "No jobs found. Create a job first.")
- Ensure the `user` object is fully loaded before queries run (the `enabled: !!user?.id` check is there but may have a race condition with the dialog opening)

### Problem 2: Add "Assign Expenses" Button to Jobs Section

Currently, the Assign Expenses dialog is available in:
- Accounting Dashboard
- Banking View
- QB Expenses
- Expenses/Profitability Report

It needs to also appear in the **Jobs Section** within the CRM.

**Fix:**
- Import `ExpenseAssignmentDialog` into `JobsSection.tsx`
- Add an "Assign Expenses" button (with the `ArrowLeftRight` icon, matching the pattern used in other sections) to the Jobs section header
- Wire up the open/close state

---

### Technical Details

**File: `src/components/accounting/expense-assignment/DropTargetPanel.tsx`**
- Add error states to all three `useQuery` calls (`jobs`, `customers`, `estimates`)
- Log errors to console for debugging
- Show user-friendly empty states per tab when no data is returned

**File: `src/components/contractor/crm/sections/JobsSection.tsx`**
- Import `ExpenseAssignmentDialog` from `@/components/accounting/expense-assignment`
- Add `assignOpen` state variable
- Add "Assign Expenses" button in the header area (matching existing UI patterns with `ArrowLeftRight` icon)
- Render `<ExpenseAssignmentDialog open={assignOpen} onOpenChange={setAssignOpen} />`

