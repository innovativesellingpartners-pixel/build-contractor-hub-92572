

## Add Customer Portal to CRM Navigation

### What Changes

Add "Customer Portal" as a navigable section in three places so contractors can quickly access and manage all their portal links from anywhere in the CRM.

### 1. Desktop Sidebar

Add a "Customer Portal" item to the `navItems` array in `CT1CRM.tsx` (with a `Link2` or `Globe` icon), positioned after Customers.

### 2. Mobile Bottom Nav / Slide-Out Menu

Add a matching entry to the `allNavItems` array in `BottomNav.tsx` so it appears in the mobile slide-out menu.

### 3. CRM Dashboard Tile

Add a "Customer Portal" tile to the `mainModules` array in `CRMDashboard.tsx` with a gradient card (e.g., cyan-to-teal) so it appears alongside Jobs, Estimates, etc.

### 4. New Portal Management Section

Create `src/components/contractor/crm/sections/PortalSection.tsx` -- a dedicated section that:
- Lists all jobs that have active portal tokens (queries `customer_portal_tokens` joined with `jobs`)
- Shows job name, customer name, token status, and a "Copy Link" action for each
- Includes a quick link to generate new portal links for jobs that don't have one yet
- Provides an overview of recent portal messages (unread count per job)

### 5. Wire It Up

- Add `'portal'` to the `Section` type union in `CT1CRM.tsx`, `BottomNav.tsx`, and `CRMDashboard.tsx`
- Add a `case 'portal'` in the `renderSection()` switch in `CT1CRM.tsx`
- Add it to the valid sections list in `getInitialSection`

### Technical Details

**Files to create:**
- `src/components/contractor/crm/sections/PortalSection.tsx`

**Files to modify:**
- `src/components/contractor/crm/CT1CRM.tsx` -- Add to Section type, navItems, renderSection switch, imports
- `src/components/contractor/crm/BottomNav.tsx` -- Add to Section type, allNavItems
- `src/components/contractor/crm/sections/CRMDashboard.tsx` -- Add to Section type, mainModules array
