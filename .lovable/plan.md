

# Assign Lead to Contractor (Admin Feature)

## Problem
There is no UI or mechanism for an admin to reassign a lead from one contractor to another. Leads are tied to a contractor via `user_id`, which maps to the contractor's owner user ID (since `handle_new_user()` creates contractor records with `id = user.id`). To "assign a lead to a contractor," an admin needs to change the lead's `user_id` to the target contractor's owner ID.

## Plan

### 1. Add admin UPDATE policy on leads
Currently, admins can only SELECT leads — they cannot update them. We need an RLS policy allowing admins to update any lead.

```sql
CREATE POLICY "Admins can update all leads"
ON public.leads FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
```

### 2. Add "Assign to Contractor" UI in AdminLeads
- Fetch the list of contractors from the `contractors` table (id, business_name, contractor_number).
- Add an "Assign" button or a contractor selector column in the admin leads table/edit dialog.
- When an admin selects a contractor, update the lead's `user_id` to the contractor's `id` (which is the owner's user ID per `handle_new_user()`).
- Show the currently assigned contractor name in the table (already partially done via the `profiles` join — will enhance to show the contractor business name).

### 3. Update AdminLeads component
- Add a `SearchableSelect` dropdown (reusing existing component) in the edit flow or as an inline action, populated with contractors.
- On selection, call `supabase.from('leads').update({ user_id: selectedContractorId }).eq('id', leadId)`.
- Invalidate the query cache to refresh the list.

### Files to modify
- **Database**: One migration adding the admin UPDATE policy on leads
- **`src/components/admin/AdminLeads.tsx`**: Add contractor assignment UI (button/dropdown per lead row or in the edit dialog)

