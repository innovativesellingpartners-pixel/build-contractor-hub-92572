

# myCT1 Production Architecture Review — Post-Phase 1 Update

---

## Section 1: Executive Summary

myCT1 is a **partially hardened, feature-rich contractor SaaS platform** that has completed its first round of critical security fixes. The `has_full_access()` email-domain bypass has been eliminated, world-readable portal tables have been scoped, and public token policies have been moved to Edge Functions. The platform now has 375 RLS policies across 110+ tables, 100+ Edge Functions, and strong trigger-based automation.

**Overall assessment: Adequate for single-user contractors in production. Structurally incomplete for multi-tenant team use. Security posture significantly improved after Phase 1.**

The primary architectural gap remains: core business tables (estimates, jobs, invoices, leads, customers) are scoped by `user_id` rather than `contractor_id`, which means team members cannot access shared business data. This is the single most important structural issue to resolve.

---

## Section 2: What Is Already Strong

1. **Auth and session management** — Supabase Auth with PKCE, profile auto-provisioning via `handle_new_user()`, email confirmation required, anonymous signups disabled.

2. **Edge Function coverage** — 110+ Edge Functions covering conversions, payments, QuickBooks sync, calendar integrations, email/SMS delivery, AI features. Server-side logic is well-separated.

3. **Encrypted token storage** — QB, Google, Outlook tokens use `pgp_sym_encrypt()` with SECURITY DEFINER retrieval. No secrets in frontend.

4. **Trigger-based automation** — Auto-numbering for all entity types, status history logging, financial rollup triggers (`update_job_payment_totals`, `update_job_expense_totals`, `update_job_change_order_totals`). Correct and performant.

5. **Admin role system** — `user_roles` table with `has_role()` SECURITY DEFINER function. Audit logging via `admin_audit_log`. Phase 1 removed email-domain bypass.

6. **Hook-based data access** — Consistent custom hooks per module (`useEstimates`, `useJobs`, `useInvoices`, `useLeads`, `useCustomers`, `usePayments`). Clean separation from UI.

7. **Indexing** — Strong composite and partial indexes on core tables. `user_id + status` composite indexes on estimates. Indexes on all FK columns.

8. **Public access architecture** — Public estimates, invoices, and change orders now use Edge Functions instead of overly-permissive RLS policies. Portal tables properly scoped.

---

## Section 3: Architecture Checklist

| Category | Rating | Notes |
|---|---|---|
| System architecture | **Adequate** | Good hook pattern, clean route structure. Dashboard.tsx at 1218 lines needs decomposition. |
| Multi-tenant design | **Weak** | Core tables use `user_id`, not `contractor_id`. Team members can't access business data. Phase 2 needed. |
| Database design | **Adequate** | 110+ tables, good FK/indexing. `estimates.status` and `leads.status` are plain text (no enum). Unique constraint exists on `invoice_number`. |
| Business logic design | **Adequate** | Conversions server-side. Invoice creation, estimate approval, status changes are frontend-only. |
| Module design | **Adequate to Strong** | Comprehensive coverage. Clean hook-per-module. Some hooks use `useState` (leads, jobs) while others use React Query (estimates, invoices) — inconsistent. |
| Backend hardening | **Adequate** | Phase 1 fixed critical RLS issues. No status transition validation. No sync idempotency. |
| Performance/scale | **Adequate** | Good indexes. No pagination on list queries. All records fetched per user. |
| Maintainability | **Adequate** | Consistent naming. Two toast libraries (sonner + shadcn). Large monolithic components. |
| Integration architecture | **Adequate** | QB tokens encrypted, sync via Edge Functions. No sync log table, no duplicate prevention. |
| Environment/operations | **Adequate** | Test/live separation via Lovable Cloud. GitHub sync. No structured error logging. |

---

## Section 4: Top Weaknesses (Priority Order)

### 1. Incomplete Multi-Tenant Isolation (Structural)
Core tables use `user_id = auth.uid()` for RLS. The `contractor_users` table exists but isn't used in policies. Staff/admin team members **cannot see any business data**.
**Impact:** Blocks team features entirely.

### 2. Frontend-Only Financial Operations (Integrity)
Invoice creation (`useInvoices.createInvoice`), manual payments, estimate status changes, and estimate approval are direct frontend mutations with no server-side validation.
**Impact:** No protection against invalid amounts, duplicate invoices, or incorrect state transitions.

### 3. No Status Transition Validation (Integrity)
`estimates.status` and `leads.status` are plain text — any value can be set. Jobs and invoices use enums but no trigger validates transitions.
**Impact:** Invalid statuses break workflows and reports.

### 4. Inconsistent Data Hook Patterns (Maintainability)
`useJobs` and `useLeads` use `useState` + `useEffect` while `useEstimates`, `useInvoices`, `usePayments` use React Query. No pagination anywhere.
**Impact:** Inconsistent caching, refetching behavior, and stale data handling. Performance degrades with data growth.

### 5. No QuickBooks Sync Tracking (Integration)
No `quickbooks_sync_log` table. No idempotency keys. No duplicate push prevention.
**Impact:** Duplicate invoices in QuickBooks, silent failures, no observability.

### 6. Large Monolithic Components (Maintainability)
`Dashboard.tsx` at 1218 lines. `CT1CRM.tsx` at 486 lines. Mixed layout, routing, state, and business logic.
**Impact:** Hard to modify, high regression risk.

### 7. Missing Pagination (Scale)
All list queries (`useEstimates`, `useJobs`, `useLeads`, `useCustomers`) fetch all non-archived records with no limit.
**Impact:** Will degrade noticeably at 500+ records per contractor.

### 8. Duplicate Toast Libraries (Maintainability)
Some hooks use `sonner` (`toast` from sonner), others use `useToast` from shadcn. Both active.
**Impact:** Inconsistent UX, confusing for developers.

---

## Section 5: Recommended Hardening Plan

### Phase 1 — Critical Security Fixes ✅ COMPLETED
- [x] Removed `has_full_access()` email-domain bypass
- [x] Fixed public estimate/change order token RLS
- [x] Locked down `portal_participants` and `invoice_payment_sessions`
- [x] Created `update_portal_token_last_accessed()` SECURITY DEFINER function
- [x] Confirmed email verification required, anonymous signups disabled

### Phase 2 — Tenant Isolation Foundation (3-5 days)
- Create `get_user_contractor_id()` SECURITY DEFINER function
- Add contractor-scoped RLS policies to estimates, jobs, invoices, leads, customers (additive)
- Update frontend hooks to work with contractor-scoped queries for team members
- Test that owner retains full access and staff gains read access

### Phase 3 — Data Integrity Hardening (3-5 days)
- Add status transition validation triggers for estimates, jobs, invoices, leads
- Create enums for `estimates.status` and `leads.status`
- Move invoice creation to an Edge Function with server-side validation
- Add pagination to all major list queries
- Standardize all data hooks to React Query pattern

### Phase 4 — Integration Resilience (2-3 days)
- Create `quickbooks_sync_log` table with idempotency key
- Add structured error logging for sync failures
- Add duplicate push prevention
- Add financial audit triggers for invoices and payments

### Phase 5 — Long-Term Cleanup (ongoing)
- Consolidate to sonner only for toasts
- Break down Dashboard.tsx and large section components
- Expand team roles (Estimator, Project Manager, Technician, etc.)
- Add role-based UI gating

---

## Section 6: What Should Not Be Changed

1. **Auth flow and AuthProvider** — Working correctly with PKCE. Don't touch.
2. **Edge Function structure** — Well-organized with shared CORS. Clean individual functions.
3. **Database triggers** — Auto-numbering, financial rollups, status history logging. All correct.
4. **Token encryption** — `pgp_sym_encrypt` with SECURITY DEFINER retrieval. Solid.
5. **Hook-per-module pattern** — Clean and consistent concept. Just standardize to React Query.
6. **Route structure** — Protected routes, admin layout, public routes. Well-organized.
7. **Admin role system** — `user_roles` + `has_role()` works well. Keep it.
8. **Indexing strategy** — Strong FK indexes, composite indexes, partial indexes. Already good.

---

## Section 7: Specific Planning Suggestions

1. **Phase 2 should start next.** Create `get_user_contractor_id()` first, add policies to `estimates` as a pilot, test thoroughly, then roll out to remaining tables incrementally.

2. **For hook standardization**, migrate `useJobs` and `useLeads` from `useState` to React Query first — these are the most heavily used. Add `.limit(100)` and cursor pagination at the same time.

3. **For invoice hardening**, create an Edge Function `create-invoice` that validates amounts against job totals, enforces unique numbering per contractor, and checks status rules. Then update `useInvoices.createInvoice` to call it.

4. **For QuickBooks sync logging**, create the table and start logging before adding idempotency. Visibility first, enforcement second.

5. **For Dashboard.tsx decomposition**, extract the sidebar navigation, the section router/renderer, and the header into separate components. This is pure refactoring with no behavior change.

6. **Do not attempt a bulk migration of all tables to `contractor_id`**. Instead, use the `get_user_contractor_id()` function in RLS policies — this works with the existing `user_id` columns and doesn't require schema changes to core tables.

