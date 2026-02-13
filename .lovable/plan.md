

## Plan: Enhance myCT1 with 5 Core Features

### Feature Audit Summary

| Feature | Status | Location |
|---------|--------|----------|
| 1. Intuitive Budgeting | Partially implemented | `JobBudgetTracker.tsx`, `useJobBudget.ts` |
| 2. Actual Cost Tab (QB/Banking) | Partially implemented | `JobProfitabilityTab.tsx`, `QBEnhancedJobData.tsx` |
| 3. Dashboard Overview (Revenue/Cost) | Not implemented | CRM Dashboard has nav tiles only, no financial summary |
| 4. Review Request via Phone | Partially implemented (legacy) | `CRMDashboard.tsx` has mock review flow, not in main CRM |
| 5. Job Schedule | Partially implemented | `TasksTab.tsx` has tasks with dates but no schedule/timeline view |
| 6. Customer Portal | Skipped per user decision | N/A |

---

### Phase 1: Intuitive Budgeting System

**Current state:** `JobBudgetTracker.tsx` exists with metric cards, a budget consumption bar, a bar chart, and a line items table. It works but is dense -- budget, actual, and variance are all mixed together.

**Changes:**
- Refactor `JobBudgetTracker.tsx` into a tabbed layout with three clear sections: **Budget**, **Actual**, and **Variance**
- **Budget tab**: Shows budgeted revenue (contract value), budgeted cost (sum of budget line items), and expected margin. Includes the line items table (editable) and the "Import from Estimate" action
- **Actual tab**: Shows actual revenue (from invoices/payments collected), actual cost (from `job_costs`), actual margin. Shows the cost breakdown by category (reuse existing category grouping from `JobProfitabilityTab`)
- **Variance tab**: Side-by-side comparison of Budget vs Actual for revenue, cost, and margin with color-coded variance indicators. Include the bar chart comparing budget vs actual by category
- Keep the top-level summary cards (Budget, Spent, Remaining, Forecast) above the tabs for at-a-glance view
- Use existing `useJobBudget` and `useJobCosts` hooks; no schema changes

---

### Phase 2: Actual Cost Tab (QuickBooks / Banking)

**Current state:** `JobProfitabilityTab.tsx` (P&L tab) already shows cost breakdown by category (Labor, Materials, Subcontractor, Equipment, Other) and pulls from `job_costs`. `QBEnhancedJobData.tsx` fetches QB expenses and matches by job name. Plaid transactions exist in the `plaid_transactions` table.

**Changes:**
- Enhance `JobProfitabilityTab.tsx` to also pull and display:
  - **QuickBooks expenses** matched to this job (reuse `useQBExpenses` hook, filter by job name)
  - **Banking/Plaid transactions** assigned to this job (query `plaid_transactions` where `job_id` matches, or `expenses` where `job_id` matches)
- Add a "Source" column to the cost breakdown showing whether each cost came from: Manual entry, QuickBooks, or Bank
- Show a combined total actual cost at the top merging all sources (with deduplication note)
- Add a linked transaction list at the bottom showing Date, Vendor, Category, Amount, Source for all external transactions tied to this job
- No new tables -- uses existing `job_costs`, `expenses`, `plaid_transactions`, and QB query hooks

---

### Phase 3: Dashboard Overview (Revenue, Cost, Payments)

**Current state:** The CRM Dashboard (`sections/CRMDashboard.tsx`) only shows navigation tiles. There's no financial summary across jobs.

**Changes:**
- Add a new `JobsFinancialOverview` component rendered above the navigation tiles on the CRM Dashboard
- Query all jobs for the current user with their financial data:
  - **Total Revenue**: Sum of `contract_value` or `total_contract_value` across active jobs
  - **Total Costs**: Sum from `job_costs` table grouped by job
  - **Total Payments Received**: Sum of `amount_paid` from `invoices` table
  - **Outstanding**: Total Revenue minus Total Payments
- Add a simple date range filter with presets: This Month, Last Month, This Quarter, Year to Date
- Display as 4 metric cards using existing Card component styling
- Each card is clickable -- navigates to the Jobs section (filtered by relevant context)
- Include a small bar chart showing top 5 jobs by revenue using existing Recharts
- Responsive: 2x2 grid on mobile, 4-column on desktop

---

### Phase 4: Review Request via Phone (SMS)

**Current state:** `CRMDashboard.tsx` (the legacy page at `/crm`) has a mock review system with in-memory state -- not connected to any database and not accessible from the main CRM (`CT1CRM`).

**Changes:**
- Create a `SendReviewRequestDialog` component that:
  - Shows the customer name and phone number
  - Generates a review link URL (e.g., `/review/{jobId}?token={generated_token}`)
  - Sends the link via SMS using the existing `send-meeting-sms` edge function
  - Shows success/failure feedback
- Add a "Request Review" button in `JobDetailViewBlue.tsx` for completed jobs (in the action button row)
- Create a simple public `/review/:jobId` page where customers can:
  - See the contractor's business name and job name
  - Leave a star rating (1-5) using existing `StarRating` component
  - Leave an optional text comment
  - Submit the review
- Store reviews in the existing `post_sale_follow_ups` table (which already has `rating`, `feedback`, and `job_id` fields) -- no new tables needed
- The review page is public (no auth required), secured by a token parameter

---

### Phase 5: Job Schedule View

**Current state:** `TasksTab.tsx` shows a flat list of tasks with status badges. Tasks already have `scheduled_start`, `scheduled_end`, `actual_start`, `actual_end` fields and crew member assignment.

**Changes:**
- Add a "Schedule" view toggle (List / Timeline) to the TasksTab
- **Timeline view**: A simple horizontal timeline/Gantt-like display showing:
  - Tasks as bars spanning from `scheduled_start` to `scheduled_end`
  - Color-coded by status (not started = gray, in progress = blue, completed = green, blocked = red)
  - Crew member name shown on each bar
  - Week-by-week columns
- **List view**: Enhanced version of current list, grouped by date with clearer date headers
- Update the "Add Task" form to make Start Date and Due Date more prominent (move them up, make them required-feeling)
- Use existing `useTasks` hook and task schema; no new tables
- Responsive: Timeline scrolls horizontally on mobile, list view stacks vertically

---

### Phase 6: Cross-Device Optimization

For all new/modified views:
- Use existing responsive breakpoints (`md:`, `sm:`, `lg:`)
- Metric cards: 2-col on mobile, 4-col on desktop
- Tables convert to stacked card lists on mobile (existing pattern from `HorizontalRowCard`)
- Timeline view scrolls horizontally on mobile with touch support
- All dialogs use full-screen on mobile, modal on desktop (existing pattern)

---

### Technical Details

**Files to create:**
- `src/components/contractor/crm/job/JobScheduleView.tsx` -- Timeline/Gantt component for tasks
- `src/components/contractor/crm/sections/JobsFinancialOverview.tsx` -- Dashboard financial summary widget
- `src/components/contractor/crm/SendReviewRequestDialog.tsx` -- Review request dialog with SMS
- `src/pages/PublicReview.tsx` -- Public review submission page

**Files to modify:**
- `src/components/contractor/crm/job/JobBudgetTracker.tsx` -- Refactor into tabbed Budget/Actual/Variance layout
- `src/components/contractor/crm/job/JobProfitabilityTab.tsx` -- Add QB and banking transaction display
- `src/components/contractor/crm/job/TasksTab.tsx` -- Add schedule/timeline view toggle
- `src/components/contractor/crm/sections/CRMDashboard.tsx` -- Add financial overview widget
- `src/components/contractor/crm/JobDetailViewBlue.tsx` -- Add "Request Review" action button for completed jobs
- `src/App.tsx` -- Add `/review/:jobId` public route

**Hooks/data used (all existing):**
- `useJobBudget` -- budget line items
- `useJobCosts` -- manual job costs
- `useJobs` -- job list and details
- `useTasks` -- task CRUD
- `useQBExpenses` -- QuickBooks expense data
- `useCustomers` -- customer contact info
- Existing `send-meeting-sms` edge function for SMS delivery
- `post_sale_follow_ups` table for storing review data

**No database migrations required.**

