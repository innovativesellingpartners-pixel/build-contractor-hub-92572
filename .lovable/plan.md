

# myCT1 Production Architecture Review

## Section 1: Executive Summary

myCT1 is a **partially hardened, feature-rich contractor SaaS platform** that has outgrown its original single-user architecture. The platform demonstrates strong product thinking — the module set, UI structure, and workflow coverage are impressive for a Lovable-built product. However, it sits at a critical inflection point: the architecture was designed for individual contractor accounts and is being stretched toward multi-user teams without a completed tenant isolation migration.

**Overall assessment: Adequate for single-user contractors in production, but structurally incomplete for multi-tenant team use.**

The platform has strong foundations in several areas (auth, Edge Functions, trigger-based automation, encrypted token storage) but carries meaningful technical debt in tenant isolation, business logic placement, and data integrity enforcement. None of these are showstoppers for current usage, but they become serious as the user base grows and team features are marketed.

---

## Section 2: What Is Already Strong

These areas are solid and should remain mostly as-is:

1. **Auth and session management** — Supabase Auth with PKCE flow, proper session persistence, clean AuthProvider context, profile auto-provisioning via `handle_new_user()` trigger. Well-implemented.

2. **Edge Function coverage** — 100+ Edge Functions covering critical server-side operations: estimate-to-job conversion, lead conversion, QuickBooks sync, payment processing, calendar integration, email/SMS delivery. This is significantly better than many Lovable projects.

3. **Encrypted token storage** — QuickBooks, Google, and Outlook tokens stored with `pgp_sym_encrypt()`. No secrets in frontend code. Proper SECURITY DEFINER functions for token retrieval.

4. **Trigger-based automation** — Auto-numbering (leads, estimates, invoices, jobs, customers, contractors), status history logging (jobs, estimates), payment total rollups, expense tracking, change order totals. Good use of database triggers for data consistency.

5. **Admin role system** — Clean separation of platform roles (`user_roles`: admin/super_admin) from team roles (`contractor_users`: owner/admin/staff). Audit logging for admin actions. SECURITY DEFINER functions for role checks.

6. **Hook-based data access pattern** — Consistent use of custom hooks (`useEstimates`, `useJobs`, `useInvoices`, etc.) with React Query or useState for data access. Clean separation from UI components.

7. **Routing and navigation** — Clean route structure with protected routes, admin layout, public routes, and SEO-friendly feature pages. Good use of redirects for URL consolidation.

8. **Financial calculation triggers** — `update_job_payment_totals`, `update_job_expense_totals`, `update_job_change_order_totals` keep derived financial fields consistent at the database level.

---

## Section 3: Architecture Checklist

| Category | Rating | Notes |
|---|---|---|
| System architecture | **Adequate** | Good frontend structure; backend responsibilities split between Edge Functions and direct Supabase calls. Some business logic still frontend-heavy. |
| Multi-tenant design | **Weak** | Hybrid user_id/contractor_id model. Core tables (estimates, jobs, invoices, leads, customers) use user_id only. Team members cannot access contractor data. |
| Database design | **Adequate** | 110+ tables, good FK coverage, strong trigger usage. But inconsistent tenant column naming, missing status enums on some tables, no unique constraint on invoice_number. |
| Business logic design | **Adequate** | Critical conversions are server-side. But invoice creation, estimate approval, status changes, and manual payment recording are frontend-only. |
| Module design | **Adequate to Strong** | Comprehensive module coverage. Clean hook-per-module pattern. Some large components (Dashboard.tsx at 1218 lines, CT1CRM.tsx at 486 lines). |
| Backend hardening | **Weak** | No status transition validation, no idempotency for sync operations, `has_full_access()` email-domain bypass, world-readable portal tables. |
| Performance and scale readiness | **Adequate** | Good indexing. But no pagination in most queries, `has_full_access()` queries auth.users on every RLS evaluation, potential N+1 in dashboard aggregations. |
| Maintainability | **Adequate** | Clean hook pattern, but large monolithic components, two competing toast libraries (sonner + shadcn toast), duplicate role systems. |
| Integration architecture | **Adequate** | QB tokens encrypted, sync via Edge Functions. But no sync log table, no duplicate prevention, no retry mechanism. |
| Environment and operations | **Adequate** | Lovable Cloud provides test/live separation. GitHub sync available. No structured error logging beyond console. |

---

## Section 4: Top Weaknesses (Priority Order)

### 1. Incomplete Multi-Tenant Isolation (Structural Risk)
Core business tables (estimates, jobs, invoices, leads, customers) are scoped by `user_id`, not `contractor_id`. The `contractor_users` mapping exists but RLS policies don't use it. Team members added via admin/staff roles **cannot see any business data**. This blocks the team feature from working and creates a data modeling inconsistency.
**Why it matters:** This is the single biggest gap between current state and a real multi-tenant SaaS. Every module is affected.

### 2. `has_full_access()` Email-Domain Bypass (Security Risk)
This function grants read access to all business data for any user with an `@myct1.com` email. If email verification is disabled or spoofable, this is a full data exposure vulnerability.
**Why it matters:** A single malicious signup could read all contractor data across the platform.

### 3. Frontend-Only Financial Operations (Integrity Risk)
Invoice creation, manual payment recording, estimate status changes, and estimate approval all happen via direct frontend mutations. No server-side validation of amounts, no status transition enforcement, no duplicate prevention.
**Why it matters:** Financial data inconsistency at scale, and no protection against invalid state transitions.

### 4. World-Readable Portal Tables (Security Risk)
`portal_participants` and `invoice_payment_sessions` have `SELECT` policies with `qual: true`, meaning any visitor (authenticated or not) can read all records.
**Why it matters:** Exposes customer contact info and payment session details.

### 5. No QuickBooks Sync Tracking (Integration Risk)
No `quickbooks_sync_log` table exists. No idempotency keys. No duplicate push prevention. No structured error logging for sync failures.
**Why it matters:** Could result in duplicate invoices in QuickBooks, silent sync failures, and no visibility into integration health.

### 6. No Status Transition Validation (Data Integrity Risk)
Estimate, job, invoice, and lead statuses can be set to arbitrary values from the frontend. Estimates and leads use plain text instead of enums. No state machine enforces valid transitions.
**Why it matters:** Invalid statuses break workflows, reports, and downstream automations.

### 7. Missing Pagination (Scale Risk)
Most data hooks fetch all records with no limit or pagination. Queries like `useEstimates`, `useJobs`, `useLeads`, `useCustomers` pull all non-archived records.
**Why it matters:** Performance degrades linearly with data growth. A contractor with 500+ estimates will notice.

### 8. Large Monolithic Components (Maintainability Risk)
`Dashboard.tsx` (1218 lines) and several section components (EstimatesSection at 651 lines) contain mixed concerns: layout, navigation, state management, API calls, and business logic.
**Why it matters:** Hard to modify, hard to test, high risk of regressions.

---

## Section 5: Recommended Hardening Plan

### Phase 1 — Critical Security Fixes (1-2 days)
- Remove `has_full_access()` and replace all references with `has_role(auth.uid(), 'admin')`
- Fix `portal_participants` and `invoice_payment_sessions` RLS policies to scope by token or contractor
- Fix public estimate RLS from `public_token IS NOT NULL` to require token value match
- Verify email confirmation is required for signup

### Phase 2 — Tenant Isolation Foundation (3-5 days)
- Create `get_user_contractor_id()` SECURITY DEFINER function
- Add contractor-scoped RLS policies to estimates, jobs, invoices, leads, customers (additive — keep existing user_id policies)
- Update frontend hooks to work with contractor-scoped queries when team context is present
- Test that owner still has full access and team members gain read access

### Phase 3 — Data Integrity Hardening (3-5 days)
- Add status transition validation triggers for estimates, jobs, invoices, leads
- Create enums for `estimates.status` and `leads.status`
- Add unique constraint on `invoice_number` per contractor
- Move invoice creation to an Edge Function with server-side validation
- Add pagination to all major list queries (estimates, jobs, leads, customers, invoices)

### Phase 4 — Integration Resilience (2-3 days)
- Create `quickbooks_sync_log` table with idempotency key
- Add structured error logging for sync failures
- Add duplicate push prevention via sync log lookup
- Add financial audit triggers for invoices and payments (INSERT/UPDATE/DELETE)

### Phase 5 — Long-Term Cleanup (ongoing)
- Consolidate toast libraries to sonner only
- Break down Dashboard.tsx and large section components
- Expand team roles (Estimator, Project Manager, Technician, etc.)
- Add role-based UI gating to match backend restrictions
- Standardize all tables to `contractor_id` (long migration)

---

## Section 6: What Should Not Be Changed

1. **Auth flow and AuthProvider** — Working correctly. Don't touch.
2. **Edge Function structure** — Well-organized with shared CORS. Individual functions are clean.
3. **Database triggers for auto-numbering and financial rollups** — These are correct and performant. Leave them.
4. **Token encryption approach** — `pgp_sym_encrypt` with SECURITY DEFINER retrieval functions. Solid pattern.
5. **Hook-per-module data access pattern** — Clean and consistent. Extend it, don't replace it.
6. **Route structure and protected routes** — Well-organized. Keep consolidating under `/features/` path.
7. **CRM section architecture** — The section-based navigation in CT1CRM is clean. Sections are independently loadable.
8. **Admin role system** — `user_roles` table with `has_role()` function works well for platform admin. Keep it.

---

## Section 7: Specific Planning Suggestions

1. **Start with Phase 1 security fixes.** The `has_full_access()` removal is low-risk and high-impact. It touches RLS policies only, no frontend code changes needed.

2. **For Phase 2 tenant isolation**, create the helper function first, then add policies to one table (e.g., `estimates`) and test thoroughly before rolling out to all tables. This is the highest-effort change and should be done incrementally.

3. **For pagination**, start with the highest-volume tables (estimates, leads) and add cursor-based or offset pagination to the hooks. Use React Query's `keepPreviousData` for smooth UX.

4. **For QuickBooks sync logging**, create the table and start logging before adding idempotency enforcement. This gives you visibility first, enforcement second.

5. **For component refactoring**, start with `Dashboard.tsx` — extract the sidebar, the section router, and the header into separate components. This is a readability improvement that reduces risk of future regressions.

6. **Do not attempt a "big bang" migration of all tables to `contractor_id`**. Instead, add `contractor_id` columns where missing, backfill from `contractor_users`, then gradually update hooks and policies. Keep `user_id` columns for backward compatibility during transition.

