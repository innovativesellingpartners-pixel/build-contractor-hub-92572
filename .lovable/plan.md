
# Comprehensive Improvement Plan: Items 1-8

This plan covers all 8 roadmap items in sequence: estimate workflow, CRM follow-ups, mobile audit, job scheduling, Stripe invoice links, communication logs, DB-persisted reports, and enhanced exports.

---

## Item 1: Estimate/Proposal Workflow Improvements

### 1a. Builder UX: Step validation feedback
Currently, if a user clicks "Next" without filling required fields, nothing happens -- no visual feedback. Add inline validation messages on Step 1 (project title + client name required) and Step 2 (at least one line item with a description).

### 1b. Estimate status lifecycle badge
The list view shows status as a simple badge ("draft", "sent", "accepted"). Enhance the list row to show a multi-step status indicator: Draft -> Sent -> Viewed -> Signed -> Paid, using the existing `sent_at`, `viewed_at`, `signed_at`, `paid_at` timestamps.

### 1c. "View and Sign Online" link on detail page
The detail view has a PDF preview button but no quick way to copy or open the public signing link. Add a "Copy Link" action button and a "View & Sign Online" button to the detail view action row.

### 1d. Estimate list filtering
Add filter chips above the estimates list for: All, Drafts, Sent, Viewed, Signed, Paid. Currently there is no filtering -- all estimates show in one list.

**Files to modify:**
- `src/components/contractor/crm/EstimateBuilder.tsx` -- validation feedback
- `src/components/contractor/crm/sections/EstimatesSection.tsx` -- status lifecycle badges, filter chips
- `src/components/contractor/crm/sections/EstimateDetailViewBlue.tsx` -- copy link + view online buttons

---

## Item 2: CRM Lead Follow-Up Reminders

The `leads` table already has `next_action_date` and `next_action_description` columns but they are not prominently surfaced.

### 2a. Follow-up due indicator on lead cards
Show a colored indicator on lead list rows: red if `next_action_date` is past due, amber if due today, green if upcoming.

### 2b. Dashboard follow-up widget
Add a "Follow-ups Due" card to the CRM dashboard showing leads with `next_action_date` <= today, sorted by urgency. Clicking a lead opens its detail view.

### 2c. Quick "Set Follow-up" action
Add a quick-action button on lead detail views to set/update the `next_action_date` and `next_action_description` via a small popover with a date picker and text input.

**Files to modify:**
- `src/components/contractor/crm/sections/LeadsSection.tsx` -- due indicators on list rows
- `src/components/contractor/crm/CT1CRM.tsx` or dashboard component -- follow-up widget
- Lead detail view component -- quick follow-up setter

---

## Item 3: Mobile Responsiveness Audit

### 3a. Estimate builder mobile fixes
- Step indicators currently use `hidden sm:inline` for labels -- ensure step numbers alone are tappable and clear on small screens
- Footer navigation buttons overlap bottom nav (`mb-20` exists but verify)
- Running total in footer is `hidden md:block` -- show a compact version on mobile

### 3b. Report views mobile optimization
- Ensure `InteractiveReportShell` header doesn't wrap awkwardly on 375px screens
- Date range picker and export menu should stack vertically on mobile

### 3c. Action button rows on detail views
- The `ActionButtonRow` on estimate/job detail views wraps but can extend off-screen on narrow phones -- add `overflow-x-auto` or convert to a scrollable row

**Files to modify:**
- `src/components/contractor/crm/EstimateBuilder.tsx` -- mobile footer/step fixes
- `src/components/reporting/drilldown/InteractiveReportShell.tsx` -- responsive header
- `src/components/contractor/crm/sections/ProvenJobsTheme.tsx` -- action button row scrolling

---

## Item 4: Job Scheduling and Crew Management

### 4a. Job status workflow
Add a visual status pipeline on the jobs list: Lead -> Estimated -> Scheduled -> In Progress -> Complete. Currently jobs have a `status` field but no visual pipeline.

### 4b. Job schedule date fields
The `jobs` table likely has `start_date` and `end_date` fields. Surface these prominently in the job detail view and add a calendar-style view option for the jobs list.

### 4c. Daily log entries
Add a "Daily Logs" section to the job detail view where contractors can log daily notes, hours, and photos. This requires a new `job_daily_logs` table.

**Database migration needed:**
```text
CREATE TABLE job_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  hours_worked NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS policies for user_id matching
```

**Files to modify:**
- Job detail view component -- daily logs section
- Jobs list component -- status pipeline visual
- New component: `DailyLogEntry.tsx`

---

## Item 5: Stripe Payment Links on Invoices

### 5a. Auto-generate Stripe payment link on invoice creation
When an invoice is created (from estimate or manually), automatically call the `stripe-create-checkout` function and store the `stripe_payment_link` on the invoice record. The column already exists.

### 5b. Payment link in invoice emails
Update the `send-invoice-email` edge function to include the Stripe payment link as a prominent CTA button in the email template, similar to how `send-estimate` includes payment CTAs.

### 5c. Invoice detail view payment button
Add a "Pay Now" button on the invoice detail view that opens the Stripe checkout link, visible only when `stripe_payment_link` exists and status is not "paid".

**Files to modify:**
- `supabase/functions/send-invoice-email/index.ts` -- payment CTA in email
- Invoice creation flow -- auto-generate payment link
- Invoice detail view component -- Pay Now button

---

## Item 6: Unified Customer Communication Logs

### 6a. Activity timeline on customer detail
Create a unified activity feed on the customer detail view that aggregates:
- Estimates sent/viewed/signed
- Invoices sent/paid
- Emails sent (from `email_logs` if exists)
- SMS sent
- Meetings scheduled

### 6b. Database: communication_logs table
```text
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  type TEXT NOT NULL, -- 'email', 'sms', 'call', 'meeting', 'note'
  subject TEXT,
  body TEXT,
  direction TEXT DEFAULT 'outbound', -- 'inbound' or 'outbound'
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS policies for user_id matching
```

### 6c. Log entries automatically
Update `send-estimate`, `send-estimate-sms`, `send-invoice-email` edge functions to insert a row into `communication_logs` after successful delivery.

**Files to modify:**
- Customer detail view -- activity timeline component
- Edge functions for email/SMS -- auto-log entries
- New component: `CustomerActivityTimeline.tsx`

---

## Item 7: DB-Persisted Custom Reports

Currently, `CustomReportBuilder` saves reports to `localStorage`. Move to database persistence.

### 7a. Database: saved_reports table
```text
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  data_source TEXT NOT NULL,
  columns TEXT[] NOT NULL,
  date_range JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS policies for user_id matching
```

### 7b. Migrate CustomReportBuilder
Replace `localStorage` reads/writes with database queries. Keep localStorage as a fallback for offline scenarios.

**Files to modify:**
- `src/components/reporting/unified/CustomReportBuilder.tsx` -- DB persistence
- Database migration for `saved_reports` table

---

## Item 8: Enhanced PDF/CSV Exports

### 8a. Wire up export buttons across all unified reports
Several unified reports (`SalesPipelineReport`, `JobsProjectsReport`, `CustomersReport`, `AccountsReceivableReport`, `AccountsPayableReport`) pass `onExportCSV`/`onExportPDF` to `InteractiveReportShell` but some may not have actual implementations behind those callbacks.

### 8b. Standardized CSV export utility
Create a shared `exportReportAsCSV(headers, rows, filename)` utility and wire it into all report views consistently.

### 8c. PDF export with branded header
Enhance the `exportToPDF` function in `src/lib/reportExports.ts` to include the contractor's company name, logo, and date range in the PDF header.

**Files to modify:**
- `src/lib/reportExports.ts` -- enhanced PDF with branding
- New utility: `src/lib/csvExport.ts`
- All 5 unified report files -- wire export callbacks

---

## Implementation Order

Given dependencies, the recommended build order is:

1. **Item 1** (Estimate workflow) -- immediate value, no DB changes needed for 1a-1d
2. **Item 3** (Mobile audit) -- polish pass, no DB changes
3. **Item 2** (Lead follow-ups) -- uses existing DB columns, quick wins
4. **Item 5** (Stripe invoice links) -- uses existing column + function
5. **Item 8** (Exports) -- utility work, no DB changes
6. **Item 7** (DB-persisted reports) -- needs migration
7. **Item 6** (Communication logs) -- needs migration + edge function updates
8. **Item 4** (Job scheduling) -- largest scope, needs migration + new UI

Each item will be implemented in a single focused pass before moving to the next.
