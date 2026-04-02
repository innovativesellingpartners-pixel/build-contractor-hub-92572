

# Data Isolation Security Audit & Hardening

## Current State (Good News)

After a thorough audit of all RLS policies, the core business tables are **already well-protected**:

- **leads, customers, estimates, jobs, invoices, payments, expenses, daily_logs, materials, change_orders, crews, crew_members** — all have RLS enabled with `auth.uid() = user_id` scoping
- Admin/super_admin access is gated via `has_role()` security definer functions
- Team access uses `is_contractor_member()` which validates shared contractor membership
- INSERT policies all enforce `with_check` constraints tying records to the authenticated user
- Tables with `SELECT true` are only reference/catalog data (trades, templates, courses, marketplace) — appropriate

## Identified Gaps to Fix

### 1. `crews` table — missing team visibility
The `crews` table only has a single `ALL` policy for `auth.uid() = user_id`. Unlike other tables, it lacks:
- `is_contractor_member()` SELECT policy for team members
- Admin SELECT policy

**Fix:** Add team member and admin SELECT policies matching the pattern used on all other tables.

### 2. `photo_reports` — overly permissive SELECT
Has `SELECT true` which means anyone can read all photo reports. Should be scoped to the owner or accessed via a token-based mechanism.

**Fix:** Review if this is intentional for public sharing (likely token-gated in practice). If not, add user scoping.

### 3. `change_order_history` — overly permissive SELECT  
Has `SELECT true`. Should be scoped to users who own the related change order/job.

**Fix:** Add user-scoped SELECT policy via job ownership check.

### 4. Frontend verification
Confirm that no frontend queries bypass RLS by manually filtering (which the memory says should not happen per `rls-scoping-standard`). Quick scan of data hooks for any `.eq('user_id', ...)` patterns that could mask RLS issues.

## What This Does NOT Change
- No visual or UI changes
- No design or layout changes  
- No performance impact
- Purely database-layer security hardening

## Files Modified
- 1 database migration (add missing policies for `crews`, `photo_reports`, `change_order_history`)
- Possibly minor frontend hook cleanup if manual scoping found

