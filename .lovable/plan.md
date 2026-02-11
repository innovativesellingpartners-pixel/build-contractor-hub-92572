
# Unified Single Sidebar for Desktop

## Problem
On desktop, when the CRM is active, there are **two sidebars side by side**:
1. The **Hub sidebar** (w-64): CT1 CRM, Training, Voice AI, Marketplace, Reporting, Tasks, Insurance, etc.
2. The **CRM sidebar** (w-64): Dashboard, Leads, Jobs, Estimates, Invoices, etc.

Together they consume ~512px of horizontal space, leaving the main content cramped.

## Solution
Merge both navigation levels into a **single sidebar** on desktop. The sidebar will contain:
- **CRM section** (grouped): Dashboard, Leads, Jobs, Estimates, Invoices, Calls, Emails, Calendar, Accounting, Customers, GC Contacts, Contacts, Templates, Reporting
- **Divider**
- **Hub section** (grouped): 5-Star Training, Voice AI, Marketplace, My Tasks, Insurance, CT1 Standards, CT1 Podcast, My Account, Help Center, CT1 Home

This gives the content area an extra ~256px of breathing room.

## Technical Changes

### 1. Update `Dashboard.tsx` - Remove the outer Hub sidebar on desktop
- Remove the `hidden lg:block w-64` sidebar `<div>` that renders `SidebarNav` on desktop
- The main content panel will now stretch to use the full width (minus the single CRM sidebar)
- Keep the mobile Sheet menu as-is (it already shows one nav at a time)

### 2. Update `CT1CRM.tsx` - Merge Hub nav items into the CRM sidebar
- Add the Hub navigation items (Training, Voice AI, Marketplace, Tasks, Insurance, etc.) below a divider in the existing CRM desktop sidebar
- These items will call `onSectionChange` to switch the parent Dashboard's active section (navigating away from CRM)
- The CRM sidebar header and collapse toggle remain as they are

### 3. Update `Dashboard.tsx` - Adjust layout when non-CRM sections are active
- When a non-CRM section is active (Training, Marketplace, etc.), hide the CRM sidebar entirely and render content full-width
- OR keep the unified sidebar visible with the active Hub item highlighted, allowing quick switching back to CRM
- Recommended: Keep the sidebar visible at all times for consistent navigation

### 4. Pass necessary props
- Pass `tierFeatures` and `activeSection` into `CT1CRM` so the Hub items can be conditionally shown
- Pass a callback like `onHubSectionChange` so clicking Hub items in the CRM sidebar switches the parent Dashboard section

### 5. Mobile - No changes
- Mobile already uses either bottom nav or a Sheet drawer with one nav at a time
- No double-sidebar issue exists on mobile

## Result
- Single sidebar (~256px wide) on desktop
- All navigation in one place
- Content area gains ~256px of usable width
- Clean, modern layout matching industry standards
