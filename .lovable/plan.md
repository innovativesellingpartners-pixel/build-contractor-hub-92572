

## Plan: Chat-to-Job/Estimate Creation in Pocket Agent

### What We're Building

Add AI tool-calling capabilities to the Pocket Agent so contractors can dictate or type job/estimate details (line items, hours, materials, customer info, pricing) and the AI will parse them into structured data. The AI response will include actionable buttons inline — "Create Estimate", "Create Job", "Add to Existing Estimate", "Add to Existing Job" — that insert the parsed data directly into the database.

### How It Works

1. **Contractor speaks or types** freely: "I need 20 sheets of 4x8 drywall at $14 each, 10 hours labor at $80/hr, customer is John Smith at 123 Main St, phone 555-1234"
2. **AI parses** the input using a new `extract_job_data` tool and returns structured line items, customer details, and totals
3. **Chat renders** the parsed data as a formatted card with action buttons
4. **Contractor clicks** a button to create or add to an estimate/job

### Technical Changes

#### 1. Edge Function: `pocketbot-chat/index.ts`
- Add new AI tool `extract_job_data` with parameters:
  - `line_items`: array of `{ description, quantity, unit, unit_price, category (labor/material/subcontractor/equipment/other) }`
  - `customer_name`, `customer_email`, `customer_phone`, `customer_address`
  - `project_name`, `project_description`, `project_address`
  - `notes`
- When the AI calls this tool, return a new response type `"job_data_extracted"` with the structured JSON back to the frontend (don't insert into DB yet — let the user choose the action)

#### 2. Frontend: `FloatingPocketbot.tsx`
- Extend the `Message` interface to include `jobData?: ExtractedJobData` and `actionType?: string`
- In the response handler, detect `type: "job_data_extracted"` responses and store the parsed data on the message
- Render a **JobDataCard** component inline in the chat bubble showing:
  - Formatted line items table (description, qty, unit price, total)
  - Customer info summary
  - Project details
  - Grand total
  - Four action buttons: **Create Estimate** | **Create Job** | **Add to Estimate** | **Add to Job**

#### 3. New Component: `ChatJobDataCard.tsx`
- Displays extracted data in a compact card format within the chat
- "Create Estimate" button: inserts into `estimates` table with `line_items` JSON, customer fields, and navigates to the estimate editor
- "Create Job" button: inserts into `jobs` table with name, address, customer info, and creates a linked estimate with the line items
- "Add to Estimate/Job" buttons: open a small select dropdown listing the user's recent estimates/jobs, then appends line items to the selected record's existing `line_items` JSON array
- All actions use the existing Supabase client with the authenticated user's session

#### 4. System Prompt Update
- Add instructions telling the AI to use `extract_job_data` when the user provides pricing, materials, labor hours, customer details, or says they want to build an estimate/job
- Tell the AI to present the extracted data and ask the user which action they'd like to take

### Key Details
- No database schema changes needed — estimates already store `line_items` as JSON, jobs have all relevant fields
- Line item format matches existing estimate line items: `{ description, quantity, unit_price, total, category }`
- The "Add to" flow fetches the user's recent 20 estimates/jobs for selection
- Each action button shows a loading state and success toast on completion

