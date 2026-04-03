

# Phase 1: Admin Demo Workspace — Routes, Access Control, Seed Data Shell

## Approach

Create a **dedicated demo contractor account** (a real user record with seeded data). The Demo Workspace pages will reuse existing contractor UI components by wrapping them in a `DemoContext` provider that overrides `effectiveUserId` to the demo account's ID. This means zero changes to existing components, queries, or RLS policies.

## What changes and what doesn't

**Unchanged**: All existing routes, components, hooks, RLS policies, database schema for production tables, admin pages, contractor pages, and public pages.

**New additions only**: New files, new admin sidebar entry, new routes under `/admin/demo/*`, one new DB table, one seed script.

---

## 1. Database: Feature flag + demo audit log

**Migration 1** — `admin_feature_flags` table:

```sql
CREATE TABLE public.admin_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write
CREATE POLICY "Admins manage flags" ON public.admin_feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Seed the flag
INSERT INTO public.admin_feature_flags (flag_name, enabled) VALUES ('admin_demo_workspace_enabled', true);
```

**Migration 2** — `demo_access_log` table:

```sql
CREATE TABLE public.demo_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.demo_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read demo logs" ON public.demo_access_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
```

## 2. Demo Data Seed (Edge Function)

**New edge function**: `supabase/functions/seed-demo-data/index.ts`

- Accepts POST from admin users only (validates service role)
- Creates or resets a dedicated demo contractor account with a known UUID
- Seeds ~20 leads (all stages), ~15 customers, ~10 estimates (draft→signed), ~8 jobs (all statuses), ~12 invoices (paid/unpaid/overdue), payments, expenses
- All data tied to the demo contractor's `user_id` so existing RLS scopes it automatically
- Idempotent: deletes existing demo data first, then re-inserts

## 3. DemoContext Provider

**New file**: `src/contexts/DemoContext.tsx`

- Provides `isDemoMode`, `demoUserId`, and an `effectiveUserId` override
- When active, all hooks that use `effectiveUserId` from `AuthContext` will resolve to the demo user
- Wraps only demo workspace routes — no impact on any other route

## 4. New Admin Pages (all under `/admin/demo/*`)

**New files**:

| File | Purpose |
|------|---------|
| `src/components/admin/demo/DemoWorkspace.tsx` | Layout shell with "Demo Workspace – Internal Use Only" badge |
| `src/components/admin/demo/DemoDashboard.tsx` | Overview: module cards linking to each demo section |
| `src/components/admin/demo/DemoSection.tsx` | Generic wrapper that renders existing contractor components inside DemoContext |
| `src/components/admin/demo/DemoResetPanel.tsx` | Reset button + scenario controls |
| `src/components/admin/demo/DemoScenarios.tsx` | Pre-built scenario cards (Phase 2 interactive, Phase 1 static descriptions) |

## 5. Routing Changes

**File**: `src/App.tsx` — add inside the existing `<Route path="/admin">` block:

```
<Route path="demo" element={<DemoWorkspace />}>
  <Route index element={<DemoDashboard />} />
  <Route path="crm" element={<DemoSection module="crm" />} />
  <Route path="estimates" element={<DemoSection module="estimates" />} />
  <Route path="jobs" element={<DemoSection module="jobs" />} />
  <Route path="invoices" element={<DemoSection module="invoices" />} />
  <Route path="reports" element={<DemoSection module="reports" />} />
  <Route path="reset" element={<DemoResetPanel />} />
</Route>
```

These are nested inside the existing `AdminProtectedRoute`, so they inherit admin-only access. `DemoWorkspace` adds an additional super_admin check + feature flag check.

## 6. Admin Sidebar Update

**File**: `src/components/admin/AdminSidebar.tsx` — add one entry:

```typescript
{ to: '/admin/demo', icon: Monitor, label: 'Demo Workspace' }
```

Conditionally rendered only when `admin_demo_workspace_enabled` flag is true (queried via react-query).

## 7. Access Control (layered)

1. `AdminProtectedRoute` (existing) — blocks non-admins
2. `DemoWorkspace` component — checks `isSuperAdmin` from `useAdminAuth()` + checks feature flag from DB
3. `demo_access_log` — logs every entry to Demo Workspace with user_id and timestamp

## Files created/modified summary

| Action | File |
|--------|------|
| Create | `src/contexts/DemoContext.tsx` |
| Create | `src/components/admin/demo/DemoWorkspace.tsx` |
| Create | `src/components/admin/demo/DemoDashboard.tsx` |
| Create | `src/components/admin/demo/DemoSection.tsx` |
| Create | `src/components/admin/demo/DemoResetPanel.tsx` |
| Create | `src/components/admin/demo/DemoScenarios.tsx` |
| Create | `src/hooks/useFeatureFlag.ts` |
| Create | `supabase/functions/seed-demo-data/index.ts` |
| Modify | `src/App.tsx` (add 8 route lines) |
| Modify | `src/components/admin/AdminSidebar.tsx` (add 1 nav item) |
| DB Migration | `admin_feature_flags` table |
| DB Migration | `demo_access_log` table |

**Zero changes** to any existing contractor component, hook, context, RLS policy, or production data path.

