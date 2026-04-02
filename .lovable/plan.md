

# Platform Architecture Improvements — Phased Plan

## Overview
Four phases of internal refactoring that preserve the current design and UI exactly as-is, while improving reliability, simplicity, and maintainability.

---

## Phase 1: Shared Layout Primitives (fastest, lowest risk)

Create 3 reusable components to replace repeated patterns across all sections:

**`PageShell`** — wraps every section with consistent padding, back navigation, and min-height. Replaces the ~15 identical `<div className="p-3 md:p-4 lg:p-6 min-h-[400px]...">` wrappers in Dashboard.tsx (lines 485-595).

**`SectionHeader`** — standardizes title + subtitle + action buttons pattern used in every CRM section.

**`MetricGrid`** — standardizes the stat card grids (revenue, jobs count, etc.) used across Dashboard, Reporting, Jobs, Accounting.

**Files created:**
- `src/components/ui/page-shell.tsx`
- `src/components/ui/section-header.tsx`
- `src/components/ui/metric-grid.tsx`

**Files modified:** Dashboard.tsx section wrappers, and CRM section components that have repeated layout patterns.

---

## Phase 2: Decompose Dashboard.tsx (highest impact)

Break the 1,280-line Dashboard.tsx into smaller files:

1. **Extract `UnifiedHubSidebar`** → `src/components/contractor/hub/UnifiedHubSidebar.tsx` (lines 950-1028)
2. **Extract `SidebarNav`** → `src/components/contractor/hub/SidebarNav.tsx` (lines 1030-1236)
3. **Extract `CRMSidebarNav`** → `src/components/contractor/hub/CRMSidebarNav.tsx` (lines 1238-1280)
4. **Extract Account section** → `src/components/contractor/hub/AccountSection.tsx` (lines 596-852, ~250 lines of inline JSX)
5. **Extract top nav bar** → `src/components/contractor/hub/TopNavBar.tsx` (lines 302-430)
6. **Extract floating chat/pocket agent logic** → `src/components/contractor/hub/useChatButton.ts` (lines 158-266, drag logic)

Dashboard.tsx becomes a ~200-line layout shell that imports and composes these pieces.

---

## Phase 3: Consolidate Duplicate Components

Audit and merge near-duplicates:

- **Nav item definitions** — CRM nav items are defined in 3 places (CT1CRM.tsx lines 86-104, Dashboard.tsx lines 959-971, lines 1246-1259). Extract to a single `src/config/navigation.ts`.
- **Section rendering pattern** — Both CT1CRM.tsx and Dashboard.tsx use large switch/if-else blocks to render sections. Standardize with a section registry map.

---

## Phase 4: Backend-Hardened Financial Mutations

Move invoice/payment create/update operations from client-side Supabase calls to backend functions with server-side validation:

- Create backend functions for: `create-invoice`, `record-payment`, `update-estimate-status`
- Add input validation (amounts > 0, valid status transitions, tenant isolation)
- Client code calls these functions instead of direct table inserts

This aligns with the existing hardening roadmap (Phase 3 from memory).

---

## Execution Order
Phase 1 → Phase 2 → Phase 3 → Phase 4. Each phase is independently shippable. No visual changes at any step.

## Risk Mitigation
- Each phase preserves identical UI output
- Components are extracted, not rewritten
- No routing changes (sessionStorage-based navigation stays for now — URL routing is a separate future effort)

