

# Pocket Agent CRM Actions — Full CRUD Tool Calling

## Overview

Transform the Pocket Agent from a read-only advisor into a fully actionable assistant that can create and manage leads, customers, jobs, estimates, and customer portals directly from natural language commands.

## Architecture

The existing pattern is solid: the edge function defines AI tools, the AI decides when to call them, the edge function executes the tool server-side using the service-role client, and returns structured JSON to the frontend. We extend this same pattern with new CRM action tools.

```text
User: "Create a lead for John Smith, 555-1234, needs a new roof"
  → AI calls create_lead tool
  → Edge function inserts into leads table (service role)
  → Returns confirmation + link to the new record
  → Frontend shows confirmation message with "View Lead" button
```

## Changes

### 1. Edge Function: Add CRM Action Tools (`supabase/functions/pocketbot-chat/index.ts`)

Add 5 new tool definitions to the existing `tools` array:

- **`create_lead`** — Insert into `leads` table with name, phone, email, address, source, notes, trade_type. Auto-assigns `user_id` and `contractor_id` from the authenticated user.
- **`create_customer`** — Insert into `customers` table with name, email, phone, address, company.
- **`create_job`** — Insert into `jobs` table with project_name, description, address, customer_id (optional), status, contract_value.
- **`create_estimate`** — Insert into `estimates` table with title, description, client details, line_items JSON, trade_type.
- **`create_customer_portal`** — Insert into `customer_portal_tokens` table with customer_id, job_id (optional), generates a public_token, and returns the portal URL.

Each tool handler will:
1. Parse the AI's arguments
2. Look up the user's `contractor_id` via `get_user_contractor_id(user.id)`
3. Insert the record using the service-role Supabase client
4. Return a confirmation message with the record details and a navigation path (e.g., `/dashboard/leads/{id}`)

### 2. Update System Prompt in Edge Function

Add a new section to the system prompt explaining the CRM action capabilities:

```
CRM ACTIONS:
You can directly create records in the CT1 system. When users ask you to:
- "Create a lead for..." → use create_lead
- "Add a customer named..." → use create_customer  
- "Create a job for..." → use create_job
- "Create an estimate for..." → use create_estimate
- "Set up a customer portal for..." → use create_customer_portal

Always confirm what you're about to create and include all details the user provided.
When information is missing (e.g., no email), still create the record with available data.
```

### 3. Frontend: Handle New Response Types (`src/components/contractor/FloatingPocketbot.tsx`)

Add handling for new response types (`crm_record_created`) in the JSON response handler. Display:
- Confirmation message from the AI
- A "View Record" button that navigates to the relevant dashboard page (e.g., `/dashboard/leads/{id}`)

Add a new `navigationPath` field to the Message interface to support inline navigation buttons.

### 4. Security Considerations

- All inserts use the **service-role client** scoped to the authenticated user's `contractor_id` — no cross-tenant leakage
- The user's `auth.uid()` is verified before any operations
- The `contractor_id` is resolved server-side via `get_user_contractor_id()`, not from client input
- Rate limiting already in place continues to apply

## Technical Details

- **Tables involved**: `leads`, `customers`, `jobs`, `estimates`, `customer_portal_tokens`
- **No schema changes needed** — all tables already exist with the required columns
- **No new edge functions** — extends the existing `pocketbot-chat` function
- **Tool calling pattern** — identical to existing `add_task` tool implementation
- **Portal token generation** — uses `crypto.randomUUID()` for the `public_token` field

