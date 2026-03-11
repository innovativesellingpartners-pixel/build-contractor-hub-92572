

# myCT1 Backend Architecture Audit Report

---

## Section 1: Architecture Summary

myCT1 is a multi-tenant SaaS platform for contractors built on React/Vite with a Lovable Cloud (Supabase) backend. The tenant model uses a **hybrid user_id / contractor_id** approach:

- A `contractors` table holds business entities, auto-provisioned on signup via the `handle_new_user()` trigger
- A `contractor_users` junction table maps users to contractors with roles (`owner`, `admin`, `staff`)
- **However**, the majority of core business tables (`estimates`, `jobs`, `invoices`, `leads`, `customers`) use a direct `user_id` column referencing `auth.users(id)` rather than `contractor_id`
- A smaller set of tables (`payments`, `calls`, `calendar_events`, `phone_numbers`, `expenses`) use `contractor_id`
- Some tables (`calls`, `call_sessions`, `phone_numbers`) have a `tenant_id` column that appears partially adopted

The platform has 110+ tables, 381 RLS policies, 100+ Edge Functions, and extensive indexing. Secrets are properly stored server-side. No service role keys are exposed in frontend code.

---

## Section 2: Checklist Results

### MULTI-TENANT ARCHITECTURE

| Check | Result |
|---|---|
| Every core table includes tenant_id or organization_id | **FAIL** — Most tables use `user_id` (the auth user ID), not a proper `tenant_id`. Only 3 tables have `tenant_id`, and it's nullable. |
| Foreign keys link records to the correct tenant | **PARTIAL** — FK links exist but point to `auth.users` via `user_id`, not to a `contractors` table. This works for single-user tenants but breaks for multi-user teams. |
| No queries allow cross-tenant access | **PARTIAL** — RLS prevents cross-user access, but the `has_full_access()` function grants read on all rows to `@myct1.com` emails (checked by email domain, not role). |
| Data isolation enforced at database layer | **PASS** — RLS is enabled on all 110+ tables. |
| Tenant ownership validated during create/update | **PARTIAL** — `with_check` clauses enforce `auth.uid() = user_id` on inserts but don't validate contractor membership. |
| Users belong to exactly one tenant unless designed otherwise | **PASS** — `contractor_users` has a unique constraint on `(user_id, contractor_id, role)`. |

**Key Weakness**: The platform was designed as a single-owner-per-business model where `user_id = contractor_id`. The `contractor_users` table exists for team support, but RLS policies on core tables (estimates, jobs, invoices, leads, customers) still check `auth.uid() = user_id`, meaning team members (admin, staff) **cannot see their contractor's data**. This is the single biggest architectural gap.

### ROW LEVEL SECURITY

| Table | RLS Enabled | Policy Quality | Issue |
|---|---|---|---|
| estimates | Yes | **Medium** | `user_id`-scoped only; team members excluded. Public token policy `public_token IS NOT NULL` exposes ALL estimates that have a token. |
| jobs | Yes | **Medium** | `user_id`-scoped. `has_full_access()` grants all `@myct1.com` emails read access (domain check, not role check). |
| invoices | Yes | **Medium** | `user_id`-scoped only. No admin/super_admin explicit policies for update/delete. |
| payments | Yes | **Medium** | Uses `contractor_id` (correct), but no team-member read policy. |
| customers | Yes | **Medium** | `user_id`-scoped. Duplicate delete policies exist. |
| leads | Yes | **Medium** | `user_id`-scoped only. |
| user_roles | Yes | **Strong** | Proper admin/super_admin gating; delete limited to super_admin. INSERT `with_check` not visible — verify it requires admin. |
| change_orders | Yes | **Medium** | Good cross-table check via `jobs.user_id`, but no team support. |
| portal_participants | Yes | **Weak** | `Anyone can view portal participants` with `qual: true` — exposes all participants to any visitor. |
| signatures | Yes | **Medium** | `Anyone can create signatures` — no auth required for INSERT. Intended for public estimate signing but should validate the estimate's public_token. |
| invoice_payment_sessions | Yes | **Weak** | `Allow public read for payment sessions` with `qual: true` — all payment sessions readable by anyone. |

### AUTHENTICATION AND ROLES

| Check | Result |
|---|---|
| Supabase Auth used | **PASS** |
| User records map to platform users | **PASS** — `handle_new_user()` trigger creates profile + contractor + owner mapping |
| Roles exist for contractor teams | **PARTIAL** — `contractor_users.role` supports `owner/admin/staff` only. Missing: Office Manager, Sales Rep, Estimator, Project Manager, Technician, Accounting |
| Roles stored in database | **PASS** — `user_roles` table (admin/super_admin) + `contractor_users.role` (team roles) |
| Role checks enforced in backend | **PARTIAL** — `has_role()` function used in RLS. But Edge Functions use `getUser()` and check user ID, not team role. |
| Admin privileges limited | **PASS** — super_admin gated for destructive ops |
| Role escalation prevented | **PARTIAL** — `user_roles` INSERT policy `with_check` should be verified. Admin can update roles but not clear if admin can self-escalate to super_admin. |

**Weakness**: Two separate role systems exist (`user_roles` for platform roles, `contractor_users` for team roles) with no coordination. The `has_full_access()` function bypasses roles entirely by checking email domain.

### BACKEND BUSINESS LOGIC

| Action | Server-side? | Risk |
|---|---|---|
| Converting estimate to job | **PASS** — Edge Function `convert-estimate-to-job` with service role |
| Converting lead to customer/job | **PASS** — Edge Functions exist |
| Generating invoices | **FAIL** — No `generate-invoice` Edge Function found; likely frontend-only insert |
| Approving estimates | **FAIL** — No server-side approval; status changes done via frontend `update()` |
| Recording payments | **PARTIAL** — Webhook-based payments are server-side; manual payment recording is likely frontend |
| Syncing with QuickBooks | **PASS** — Multiple Edge Functions (`quickbooks-api`, `quickbooks-invoices`, etc.) |
| Changing user roles | **PASS** — `admin-update-user-role` Edge Function |
| Tenant-level settings | **FAIL** — Profile/contractor updates appear to be direct frontend mutations |

### DATABASE STRUCTURE

| Check | Result |
|---|---|
| Proper foreign keys | **PASS** — Extensive FK relationships visible in types |
| Correct indexing | **PASS** — Rich index coverage including composite and partial indexes |
| Normalized structure | **PASS** — Good normalization with junction tables |
| Enums/constrained status values | **PARTIAL** — `invoice_status`, `job_status`, `change_order_status` use enums. But `estimates.status` and `leads.status` are plain `text` — no constraint. |
| Timestamps on major tables | **PASS** — All core tables have `created_at` and `updated_at` |
| Soft delete | **PASS** — Hard deletes gated by super_admin role |

### DATA INTEGRITY

| Check | Result |
|---|---|
| Orphan record prevention | **PARTIAL** — FK with `ON DELETE CASCADE` on some tables but not verified universally |
| Duplicate invoices | **PARTIAL** — `generate_invoice_number()` auto-increments but no unique constraint visible on `invoice_number` |
| Duplicate QB pushes | **Unknown** — No `quickbooks_sync_records` table found; sync status tracking unclear |
| Invalid status transitions | **FAIL** — No server-side state machine. Status can be set to any value from frontend. |
| Broken FK relationships | **Low risk** — FK constraints enforce referential integrity |

**Workflow integrity**:
- Lead → Estimate: No server-enforced link
- Estimate → Job: Server-enforced via Edge Function (good)
- Job → Invoice: Frontend-created, no server validation
- Invoice → Payment: Webhook path is solid; manual path is weak
- Invoice → QB sync: Edge Function path exists

### QUICKBOOKS INTEGRATION

| Check | Result |
|---|---|
| Tokens stored server-side | **PASS** — `pgp_sym_encrypt()` with encryption key |
| No secrets in frontend | **PASS** — No service role keys or QB secrets found in `src/` |
| Webhook validation | **Unknown** — No QB webhook handler found |
| Retry logic | **Unknown** — Not visible in current review |
| Sync status tracking | **FAIL** — No `quickbooks_sync_records` table exists |
| Duplicate sync prevention | **FAIL** — No idempotency mechanism found |
| Error logging | **PARTIAL** — Console logs in Edge Functions but no structured error table |

### SECRETS AND SECURITY

| Check | Result |
|---|---|
| Service role key in frontend | **PASS** — Not found |
| API secrets in client code | **PASS** — Not found |
| Integration credentials in browser | **PASS** — Not found |
| `has_full_access()` bypass | **HIGH RISK** — Grants full read to anyone with `@myct1.com` email. An attacker who signs up with a `@myct1.com` email (if email verification is off) gets read access to ALL jobs, customers, leads. |
| Public estimate token policy | **MEDIUM RISK** — `public_token IS NOT NULL` means every estimate with a generated token is world-readable. Should verify token value in query. |

### AUDIT LOGGING

| Action | Logged? |
|---|---|
| User role changes | **PASS** — `log_admin_action` trigger + `admin_audit_log` table |
| Job status changes | **PASS** — `log_job_status_change` trigger + `job_status_history` table |
| Estimate status changes | **PASS** — `log_estimate_status_change` trigger + `estimate_status_history` table |
| Invoice edits | **FAIL** — No audit trail |
| QB sync attempts | **FAIL** — No structured logging |
| Financial record deletion | **FAIL** — No audit trail for payment/invoice deletion |
| Estimate edits (content) | **FAIL** — Only status changes logged, not field-level edits |

### PERFORMANCE

**Indexes present for**: `contractor_id`, `user_id`, `job_id`, `customer_id`, `status`, `created_at` on most tables. Composite indexes exist for calendar availability and call routing. Partial indexes used for filtered queries (e.g., `idx_ai_actions_pending`).

**Potential degradation**:
- `has_full_access()` performs a query against `auth.users` on every policy evaluation — this scales poorly
- `has_role()` is used in many policies — already optimized with `SECURITY DEFINER` and `STABLE`
- Portal token existence checks (`EXISTS SELECT FROM customer_portal_tokens`) on public-facing queries could slow at scale

### ENVIRONMENTS AND DEPLOYMENT

| Check | Result |
|---|---|
| Separate test/production | **PASS** — Lovable Cloud provides test and live environments |
| Safe deployment | **PASS** — Publish deploys code + schema from test to live |
| Version control | **PASS** — GitHub sync available |
| Rollback | **PARTIAL** — Git-based rollback for code; no database migration rollback mechanism |

---

## Section 3: Risk List (Ranked by Severity)

1. **CRITICAL — `has_full_access()` email-domain bypass**: Anyone who creates an account with `@myct1.com` email gets read access to all jobs, customers, leads. This should be replaced with a proper role check.

2. **CRITICAL — Team members cannot access business data**: RLS policies check `user_id = auth.uid()` but team members (admin/staff via `contractor_users`) have a different `user_id`. A staff member added to a contractor cannot see any estimates, jobs, leads, or customers.

3. **HIGH — Public estimate exposure**: The policy `public_token IS NOT NULL` makes any estimate with a generated token readable by the entire internet without knowing the token value. Should be `public_token = requested_token`.

4. **HIGH — `portal_participants` and `invoice_payment_sessions` are world-readable**: These tables have `qual: true` SELECT policies, exposing data to unauthenticated users.

5. **HIGH — No status transition validation**: Estimate, job, invoice, and lead statuses can be set to arbitrary values from the frontend. No state machine enforces valid transitions.

6. **HIGH — Invoice creation is frontend-only**: No server-side validation for invoice generation. Financial records should be created through protected backend logic.

7. **MEDIUM — No QuickBooks sync tracking**: No idempotency or duplicate prevention for QB sync operations. Could result in duplicate invoices in QuickBooks.

8. **MEDIUM — Missing audit trails for financial operations**: Invoice edits, payment deletions, and QB sync attempts are not logged.

9. **MEDIUM — Inconsistent tenant scoping column**: Mix of `user_id`, `contractor_id`, and `tenant_id` across tables creates confusion and increases risk of bugs during team feature expansion.

10. **LOW — `estimates.status` and `leads.status` are untyped text**: Unlike `invoice_status` and `job_status` which use enums, these allow arbitrary values.

---

## Section 4: Recommended Improvements

1. **Replace `has_full_access()` with a proper role check**: Create a platform admin role instead of checking email domain. This is a security vulnerability that should be patched immediately.

2. **Add contractor-scoped RLS policies**: For every core table, add a policy that allows access when `user_id IN (SELECT cu.user_id FROM contractor_users cu WHERE cu.contractor_id = (SELECT contractor_id FROM contractor_users WHERE user_id = auth.uid()))`. Wrap this in a `SECURITY DEFINER` function to avoid recursion and performance issues.

3. **Fix the public estimate token policy**: Change from `public_token IS NOT NULL` to require the token value as a query parameter, or add a separate public endpoint via Edge Function.

4. **Lock down `portal_participants` and `invoice_payment_sessions`**: Replace `true` SELECT policies with proper scoping (via portal token or contractor_id).

5. **Add server-side status transition validation**: Create a database trigger or Edge Function that validates status changes against an allowed transition map for estimates, jobs, invoices, and leads.

6. **Move invoice creation to an Edge Function**: Add server-side validation for amount calculations, duplicate prevention, and auto-numbering integrity.

7. **Create a `quickbooks_sync_log` table**: Track sync attempts with status, timestamps, entity type, entity ID, QB ID, and error details. Use this for idempotency checks.

8. **Add audit triggers for financial tables**: Log all INSERT, UPDATE, DELETE on `invoices`, `payments`, and `estimates` (content changes, not just status).

9. **Standardize tenant scoping**: Migrate all core tables to use `contractor_id` consistently. Add a `get_user_contractor_id()` security definer function for use in RLS policies.

10. **Expand team roles**: Add granular roles (Office Manager, Sales Rep, Estimator, Project Manager, Technician, Accounting) to `contractor_users` and create role-based RLS policies.

---

## Section 5: Suggested Improvement Roadmap

**Phase 1 — Critical Security Fixes (Week 1)**
- Remove `has_full_access()` function and all policies using it
- Replace with proper `has_role(auth.uid(), 'admin')` checks
- Fix the `estimates` public token RLS policy
- Lock down `portal_participants` and `invoice_payment_sessions` policies
- Verify `user_roles` INSERT `with_check` prevents non-admin role creation

**Phase 2 — Team Access Foundation (Week 2-3)**
- Create `get_user_contractor_id(uuid)` security definer function
- Add contractor-scoped SELECT policies to all core tables (estimates, jobs, invoices, leads, customers, payments)
- Add contractor-scoped INSERT/UPDATE policies using the same function
- Test with multi-user contractor accounts

**Phase 3 — Data Integrity Hardening (Week 3-4)**
- Add status transition validation triggers for estimates, jobs, invoices, leads
- Create enums for `estimates.status` and `leads.status`
- Move invoice creation to an Edge Function
- Add unique constraint on `invoice_number`
- Add `quickbooks_sync_log` table with idempotency key

**Phase 4 — Audit and Observability (Week 4-5)**
- Add audit triggers for invoices, payments (INSERT/UPDATE/DELETE)
- Add structured QB sync logging
- Add financial deletion audit trail
- Review and clean up duplicate RLS policies (e.g., duplicate DELETE policies on `customers`)

**Phase 5 — Team Roles Expansion (Week 5-6)**
- Expand `contractor_users.role` to include granular team roles
- Create role-based RLS policies (e.g., Estimator can only see estimates)
- Add role-based UI gating to match backend restrictions
- Document the permission matrix

**Phase 6 — Performance Optimization (Ongoing)**
- Replace `has_full_access()` auth.users query with a cached role check
- Add connection pooling configuration review
- Monitor slow queries as data grows
- Consider materialized views for reporting dashboards

Each phase is designed to be independently deployable without breaking existing functionality. Phase 1 is urgent and should be prioritized above all feature work.

