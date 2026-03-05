

## Plan: Add AI Help (Pocket Agent) to All CRM & Dashboard Pages

### Problem
The Pocket Agent AI assistant is currently excluded from dashboard and CRM routes (`/dashboard`, `/crm`, `/reporting`, `/accounting`) in the `PocketAgentWrapper`. While the main Dashboard component has its own Pocket Agent button, standalone pages like `/crm`, `/reporting`, and `/accounting` don't have easy AI help access.

### Solution
Create a **`DashboardPocketAgent`** component — a lightweight floating AI help button specifically for authenticated/dashboard pages — and add it to all CRM and dashboard routes.

### Changes

**1. Create `src/components/DashboardPocketAgent.tsx`**
A simple floating button (bottom-right) that opens the existing `FloatingPocketAgent` modal. Similar to `GlobalPocketAgent` but without the "Chat With Us" bubble (that's for public pages). Includes:
- A fixed-position AI help button with the CT1 logo
- Opens the existing `FloatingPocketAgent` on click
- Positioned to not conflict with existing dashboard UI

**2. Update `src/App.tsx`**
Modify the `PocketAgentWrapper` logic to render the new `DashboardPocketAgent` on authenticated routes (`/dashboard`, `/crm`, `/reporting`, `/accounting`) instead of returning `null`. This way every page gets AI help — public pages get the full `GlobalPocketAgent`, dashboard pages get the streamlined `DashboardPocketAgent`.

**3. Remove duplicate Pocket Agent button from `src/components/Dashboard.tsx`**
Since the wrapper now handles showing the AI button globally on dashboard pages, remove the dashboard's own floating Pocket Agent button to avoid duplication. Keep the `onOpenPocketAgent` prop passing into CT1CRM for any inline CRM buttons that trigger it.

### Result
Every page in the app — leads, jobs, estimating, customers, invoicing, reporting, accounting, and all other CRM sections — will have a consistent floating AI help button in the bottom-right corner that opens the Pocket Agent.

