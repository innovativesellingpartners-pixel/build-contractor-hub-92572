# myCT1 Backend Architecture Audit Report

## Status: APPROVED — Review complete, no changes made

---

## Section 1: Architecture Summary

myCT1 is a multi-tenant SaaS platform for contractors built on React/Vite with a Lovable Cloud (Supabase) backend. The tenant model uses a **hybrid user_id / contractor_id** approach:

- A `contractors` table holds business entities, auto-provisioned on signup via the `handle_new_user()` trigger
- A `contractor_users` junction table maps users to contractors with roles (`owner`, `admin`, `staff`)
- Most core business tables use `user_id` rather than `contractor_id`
- Some tables use `contractor_id` or `tenant_id` inconsistently

---

## Improvement Roadmap

### Phase 1 — Critical Security Fixes (Week 1) ✅ COMPLETED
- [x] Remove `has_full_access()` email-domain bypass function
- [x] Replace with proper `has_role(auth.uid(), 'admin')` checks
- [x] Fix `estimates` public token RLS policy (`public_token IS NOT NULL` → removed, uses Edge Function)
- [x] Fix `change_orders` public token RLS policy → created `get-public-change-order` Edge Function
- [x] Lock down `portal_participants` and `invoice_payment_sessions` world-readable policies
- [x] Fix `customer_portal_tokens` UPDATE policy → `update_portal_token_last_accessed()` function
- [x] Fix `profiles` portal token policy chain
- [x] Fix `estimate_templates` account visibility to require authentication
- [x] Verify email confirmation required for signup (confirmed)
- [x] Verify anonymous signups disabled (confirmed)

### Phase 2 — Team Access Foundation (Week 2-3)
- [ ] Create `get_user_contractor_id(uuid)` security definer function
- [ ] Add contractor-scoped SELECT policies to core tables (estimates, jobs, invoices, leads, customers, payments)
- [ ] Add contractor-scoped INSERT/UPDATE policies
- [ ] Test with multi-user contractor accounts

### Phase 3 — Data Integrity Hardening (Week 3-4)
- [ ] Add status transition validation triggers for estimates, jobs, invoices, leads
- [ ] Create enums for `estimates.status` and `leads.status`
- [ ] Move invoice creation to an Edge Function
- [ ] Add unique constraint on `invoice_number`
- [ ] Add `quickbooks_sync_log` table with idempotency key

### Phase 4 — Audit and Observability (Week 4-5)
- [ ] Add audit triggers for invoices, payments (INSERT/UPDATE/DELETE)
- [ ] Add structured QB sync logging
- [ ] Add financial deletion audit trail
- [ ] Clean up duplicate RLS policies

### Phase 5 — Team Roles Expansion (Week 5-6)
- [ ] Expand `contractor_users.role` to include granular team roles
- [ ] Create role-based RLS policies
- [ ] Add role-based UI gating
- [ ] Document the permission matrix

### Phase 6 — Performance Optimization (Ongoing)
- [ ] Replace `has_full_access()` auth.users query with cached role check
- [ ] Monitor slow queries as data grows
- [ ] Consider materialized views for reporting dashboards

---

## Top 10 Risks (by severity)

1. **CRITICAL** — `has_full_access()` email-domain bypass
2. **CRITICAL** — Team members cannot access business data (user_id-scoped RLS)
3. **HIGH** — Public estimate exposure (public_token IS NOT NULL)
4. **HIGH** — `portal_participants` and `invoice_payment_sessions` world-readable
5. **HIGH** — No status transition validation
6. **HIGH** — Invoice creation is frontend-only
7. **MEDIUM** — No QuickBooks sync tracking
8. **MEDIUM** — Missing audit trails for financial operations
9. **MEDIUM** — Inconsistent tenant scoping columns
10. **LOW** — `estimates.status` and `leads.status` are untyped text
