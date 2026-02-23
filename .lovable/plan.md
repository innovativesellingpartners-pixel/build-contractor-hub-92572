
# Fix: Lead-to-Job Conversion Failing for Super Admin

## Root Cause

The `convert-lead-to-job` edge function filters leads by `user_id = authenticated_user.id` (line 53). However, the **Admin Leads** page (`AdminLeads.tsx`) fetches ALL leads across all users without a `user_id` filter. When you (a super_admin) click "Convert to Job" on a lead belonging to a **different contractor**, the edge function can't find the lead because it only looks for leads owned by your account.

The specific lead causing errors (`68be2239...` - "Victoria Gordon") belongs to user `c6eadcd8...`, but you're authenticated as `7ffdd1df...`.

## Fix

Update the `convert-lead-to-job` edge function to:

1. First check if the authenticated user is a **super_admin**
2. If super_admin, fetch the lead **without** the `user_id` filter, then use the **lead's own `user_id`** as the owner for the created job and customer
3. If not a super_admin, keep the existing behavior (filter by authenticated user's ID)

### Technical Details

**File: `supabase/functions/convert-lead-to-job/index.ts`**

- After authenticating the user, check their role in `user_roles` table
- If super_admin, query the lead by ID only (no user_id filter)
- Use the lead's `user_id` (not `auth.uid()`) as the `user_id` for the new customer and job records
- This ensures data ownership stays with the original contractor

**File: `supabase/config.toml`**

- Add explicit `convert-lead-to-job` entry (currently missing, uses defaults)

No database changes required.
