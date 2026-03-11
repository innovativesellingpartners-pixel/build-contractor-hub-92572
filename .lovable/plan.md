

## Remove All Sticky Headers/Footers — Maximize Contractor Screen Space

### Summary
Remove every `sticky` header and footer across the Contractor Hub (CT1 CRM) and related pages so all headers scroll with content, giving contractors maximum usable screen real estate. The bottom navigation bar stays fixed as requested.

### Files to Change

**1. CRM Dashboard page — `src/pages/CRMDashboard.tsx` (line 640)**
- Remove `sticky top-0 z-50` from the mobile header div
- Header scrolls with content naturally

**2. Help Center — `src/components/help/HelpCenter.tsx` (line 90)**
- Remove `sticky top-0 z-10` from the back-navigation header
- Remove backdrop-blur since it's no longer floating

**3. Table header component — `src/components/ui/table.tsx` (line 55)**
- Remove `sticky top-0 z-10` from `TableHead`
- Table headers scroll with their table content

**4. Leads Section table — `src/components/contractor/crm/sections/LeadsSection.tsx` (line 509)**
- Remove `sticky top-0` from the `<thead>` element

**5. Calendar Section — `src/components/contractor/crm/sections/CalendarSection.tsx` (line 1057)**
- Remove `sticky top-0` from the time-slot schedule label

**6. CT1CRM mobile header — `src/components/contractor/crm/CT1CRM.tsx` (line 408)**
- Already non-sticky — no change needed (confirmed)

### What stays fixed
- **Bottom Nav** (`src/components/contractor/crm/BottomNav.tsx`) — remains `fixed bottom-0` as requested
- **Global Pocketbot** floating buttons — utility buttons, not headers/footers
- **UI primitives** (Dialog overlays, Sheet overlays, AlertDialog) — these are modal overlays, not page headers

### Not in scope (marketing/public pages)
- `LandingPage.tsx`, `BusinessSuite.tsx`, `Subscribe.tsx`, `NetworkMap.tsx` — these are public-facing marketing pages, not the contractor workspace. Will leave as-is unless you want those changed too.

### Approach
Each change is a simple class removal — no layout restructuring needed. Mobile-first by nature since the sticky classes were primarily impacting mobile viewports.

