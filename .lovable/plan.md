

# Upgrade AI Search to Access All Platform Data and Generate Full-Page Reports

## Problem
The CRM AI search currently only queries 7 tables (jobs, estimates, invoices, customers, leads, payments, expenses). When a user asks "run a report that shows all my expenses," the system can fetch the data but cannot:
1. Query additional data sources like bank transactions, materials, job costs, change orders, budget line items, daily logs, or crew data
2. Open results as a full-page report (it only shows a dropdown panel)

## Solution Overview

### 1. Expand the Edge Function Data Sources
Add support for these additional report types in the `crm-ai-search` edge function:

| New Report Type | Table | Owner Field | Key Fields |
|---|---|---|---|
| `materials` | `materials` | `user_id` | name, quantity, cost_per_unit, total_cost, job relation |
| `change_orders` | `change_orders` | `user_id` | title, status, additional_cost, job relation |
| `job_costs` | `job_costs` | `user_id` | amount, category, cost_date, description, job relation |
| `plaid_transactions` | `plaid_transactions` | `contractor_id` | amount, category, vendor, transaction_date, description |
| `budget_items` | `job_budget_line_items` | via jobs.user_id | trade, budget_amount, actual_amount, variance |
| `daily_logs` | `daily_logs` | `user_id` | notes, weather, crew_count, job relation |
| `crew` | `crew_members` | `user_id` | name, role, contact_info |

Update the AI system prompt to list all available report types so the LLM can correctly route queries like "show all expenses" or "list my bank transactions."

### 2. Add a "Full Report" Action
When the user asks to "run a report" or "show a report in a new page," the AI search will:
- Detect the intent via a new `openAsReport: true` flag from the AI parser
- Pass the full result set to a new dedicated report page/view within the CRM
- The CRM search bar will call `onNavigate` with a special route like `ai-report` and pass the data via state (React context or sessionStorage)

### 3. Create an AI Report View Component
Build a new `AIReportView` component that renders a full-page, printable table of results with:
- Title and summary from the AI
- A formatted data table with sortable columns
- Export to CSV/PDF capability (using existing jspdf setup)
- AI insight panel at the top (if analysis was requested)
- Back button to return to previous CRM section

---

## Technical Details

### Files to Modify

**`supabase/functions/crm-ai-search/index.ts`**
- Add 7 new `case` blocks in the switch statement for the new report types
- Update the system prompt to include all new report types and their available filters
- Add `openAsReport` boolean to the AI output schema so the LLM can detect when users want a full-page report vs. a quick search
- Increase default limit to 200 when `openAsReport` is true

**`src/components/contractor/crm/CRMSearchBar.tsx`**
- When `openAsReport` is true in the response, call `onNavigate('ai-report')` and store the result data in sessionStorage
- Add "Open as full report" button to the results dropdown for any search

**`src/components/contractor/crm/CT1CRM.tsx`**
- Add `'ai-report'` to the `Section` type union
- Add a case to render the new `AIReportView` component
- Pass a back-navigation callback

**New file: `src/components/contractor/crm/sections/AIReportView.tsx`**
- Full-page report component with:
  - Header showing report title, date, record count
  - AI insight summary (if present)
  - Auto-columned data table based on report type
  - Export buttons (CSV download, PDF via jspdf)
  - Back button

### AI Prompt Changes
The system prompt will be updated to include all report types:

```
Available report types: jobs, estimates, invoices, customers, leads, 
payments, expenses, materials, change_orders, job_costs, 
plaid_transactions, budget_items, daily_logs, crew

Additional output field:
- openAsReport: true/false (set true when user says "run a report", 
  "generate a report", "show report in new page", etc.)
```

### Data Flow

```text
User types: "Run a report showing all my expenses"
        |
        v
  AI Parser (Gemini) --> { reportType: "expenses", 
                           openAsReport: true, 
                           filters: { limit: 200 } }
        |
        v
  Edge function queries expenses table (up to 200 rows)
        |
        v
  Response includes openAsReport: true
        |
        v
  CRMSearchBar stores result in sessionStorage,
  calls onNavigate('ai-report')
        |
        v
  CT1CRM renders AIReportView with full data table
```

