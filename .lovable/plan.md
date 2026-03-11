

# myCT1 Architecture Review — Post Phase 1 & 2

---

## Section 1: Executive Summary

myCT1 is a **substantially hardened, feature-rich contractor SaaS platform** that has made significant progress in the last two phases. Phase 1 eliminated the critical `has_full_access()` email-domain bypass and locked down world-readable tables. Phase 2 implemented proper tenant isolation with `is_contractor_member()` and `is_contractor_admin()` SECURITY DEFINER functions and 30 new RLS policies across 10 tables.

**Overall: Adequate for production with single-user contractors. Team access is now structurally supported at the database layer but has incomplete frontend coverage. Ready for Phase 3 (Data Integrity Hardening).**

---

## Section 2: What Is Already Strong

1. **Auth** — PKCE flow, email verification required, anonymous signups disabled, auto-provisioning via `handle_new_user()`.
2. **Edge Functions** — 110+ functions covering conversions, payments, QB sync, calendar, email/SMS. Well-separated.
3. **Encrypted tokens** — QB, Google, Outlook via `pgp_sym_encrypt()`. No secrets in frontend.
4. **Trigger automation** — Auto-numbering, status history, financial rollup triggers. All correct.
5. **Tenant isolation (DB layer)** — Phase 2 added `is_contractor_member()`, `is_contractor_admin()`, `get_user_contractor_id()` with proper indexes. Core 5 tables + 5 related tables now have team-aware RLS.
6. **Admin system** — `user_roles` + `has_role()` + `admin_audit_log`. Clean.
7. **Indexing** — Strong coverage: composite indexes on `contractor_users`, status indexes, FK indexes, unique constraints on `estimate_number`, `invoice_number`, `customer_number`.
8. **Linter results** — Only 4 warnings remain, all on intentionally public tables (change_order_views, estimate_views, lead_sources, signatures). Acceptable.

---

## Section 3: Architecture Checklist

| Category | Rating | Change from last review |
|---|---|---|
| System architecture | **Adequate** | No change |
| Multi-tenant design | **Adequate** | ↑ from Weak (Phase 2 completed) |
| Database design | **Adequate** | No change |
| Business logic design | **Adequate** | No change |
| Module design | **Adequate to Strong** | No change |
| Backend hardening | **Adequate** | ↑ from Weak (Phase 1 completed) |
| Performance/scale | **Adequate** | Slight ↑ (contractor_users indexes added) |
| Maintainability | **Adequate** | No change |
| Integration architecture | **Adequate** | No change |
| Environment/operations | **Adequate** | No change |

---

## Section 4: Top Weaknesses (Updated Priority)

### 1. `usePayments` still filters by `user_id` on frontend (Team Access Gap)
`usePayments` has `.eq('contractor_id', user.id)` which blocks team members from seeing payments. The RLS policy (`contractor_id = get_user_contractor_id(auth.uid())`) correctly allows team access, but the frontend filter overrides it.
**Impact:** Team members cannot see payment data despite DB-level access being granted.

### 2. Related table RLS still scoped by `user_id` only (Incomplete Team Access)
`estimate_assumptions`, `job_costs`, `job_photos`, `materials`, `signatures`, `tasks`, `notes`, `estimate_line_items` still use `auth.uid() = user_id` or `EXISTS(estimates.user_id = auth.uid())` patterns without team-aware policies.
**Impact:** Team members can see parent records (estimates, jobs) but not their children (line items, photos, tasks, materials).

### 3. Frontend-Only Financial Operations (Integrity Risk)
Invoice creation, manual payment recording, estimate approval are direct frontend mutations. No server-side validation.
**Impact:** No protection against invalid amounts or duplicate records.

### 4. No Status Transition Validation (Data Integrity)
`estimates.status` and `leads.status` are plain text. No trigger validates transitions.
**Impact:** Invalid statuses break workflows.

### 5. Missing Pagination (Scale Risk)
All list hooks fetch all records. No `.limit()` calls.
**Impact:** Degrades at 500+ records per contractor.

### 6. Inconsistent Hook Patterns (Maintainability)
`useJobs` and `useLeads` use `useState` + `useEffect`. `useEstimates`, `useInvoices`, `usePayments` use React Query. Mixed toast libraries (sonner vs shadcn).
**Impact:** Inconsistent caching/refetch behavior, confusing for developers.

### 7. No QuickBooks Sync Tracking (Integration Risk)
No sync log table, no idempotency, no duplicate prevention.
**Impact:** Potential duplicate invoices in QB.

---

## Section 5: Recommended Hardening Plan

### Phase 1 — Critical Security ✅ COMPLETED
### Phase 2 — Tenant Isolation Foundation ✅ COMPLETED

### Phase 2.5 — Complete Team Access (1-2 days)
- Fix `usePayments` to remove `.eq('contractor_id', user.id)` frontend filter (let RLS handle it)
- Add `is_contractor_member()`-based SELECT policies to child tables: `estimate_line_items`, `estimate_assumptions`, `job_costs`, `job_photos`, `materials`, `tasks`, `notes`, `signatures`
- These child tables can check team access via parent FK (e.g., `EXISTS(SELECT 1 FROM estimates WHERE id = estimate_id AND is_contractor_member(user_id))`)

### Phase 3 — Data Integrity Hardening (3-5 days)
- Add status transition validation triggers for estimates, jobs, invoices, leads
- Create enums for `estimates.status` and `leads.status`
- Move invoice creation to an Edge Function
- Add unique constraint on `invoice_number` per contractor (currently global unique)
- Add pagination (`.limit(100)`) to all list hooks

### Phase 4 — Integration Resilience (2-3 days)
- Create `quickbooks_sync_log` table
- Add idempotency and duplicate push prevention
- Add financial audit triggers for invoices and payments

### Phase 5 — Long-Term Cleanup (ongoing)
- Standardize all hooks to React Query
- Consolidate to sonner for toasts
- Break down Dashboard.tsx (1218 lines)
- Expand team roles beyond owner/admin/staff

---

## Section 6: What Should Not Be Changed

1. **Auth flow** — Working correctly.
2. **Edge Function structure** — Well-organized.
3. **Database triggers** — Auto-numbering, financial rollups, status history. All correct.
4. **Token encryption** — Solid pattern.
5. **Phase 2 RLS functions** — `is_contractor_member()`, `is_contractor_admin()`, `get_user_contractor_id()` are clean, indexed, and performant.
6. **Route structure** — Well-organized.
7. **Admin role system** — Works well.
8. **Indexing** — Already strong.

---

## Section 7: Specific Next Steps

1. **Immediate (Phase 2.5):** Fix `usePayments` frontend filter and add team-aware RLS to child tables. This completes the team access story so team members can actually use the platform.

2. **Then Phase 3:** Start with status enums and transition triggers (lowest risk, highest integrity value). Then add pagination to hooks. Then move invoice creation to Edge Function.

3. **For QB sync:** Create the log table first and start recording sync attempts before adding enforcement. Observability before control.

4. **For hook standardization:** Migrate `useJobs` first (most complex at 374 lines), then `useLeads` (290 lines). Convert to React Query with `.limit()` and pagination support.

