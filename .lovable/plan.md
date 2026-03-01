

## Problem

The `profiles` table has 11 users with CT numbers (CT1000001–CT1000011), but the `contractors` table only has 1 row (CT1000009). The remaining 10 users have no entry in `contractors` or `contractor_users`, so they don't appear in contractor-related queries.

## Root Cause

The `contractors` table was introduced after users were already created. The existing user-creation flow assigns a `ct1_contractor_number` in `profiles` but does not create a corresponding `contractors` record or `contractor_users` mapping.

## Plan

### 1. Backfill existing users into the contractors table

Write a database migration that:
- For each profile with a `ct1_contractor_number` that does NOT already have a `contractors` row, creates a `contractors` record using the profile's `user_id` as the contractor `id`, and maps the CT number.
- Creates a corresponding `contractor_users` row (role: `owner`) for each.
- Skips CT1000009 since it already exists.

### 2. Auto-create contractor on new user signup

Update the `handle_new_user()` database trigger so that when a new user is created:
- A `contractors` row is automatically created.
- A `contractor_users` mapping (role: `owner`) is inserted.
- The `contractor_number` is auto-assigned by the existing trigger on `contractors`.

This ensures all future users are automatically populated in the contractors table.

### 3. Sync the CT numbers

Ensure the `contractor_number` on the `contractors` row matches the `ct1_contractor_number` on the `profiles` row for consistency. The backfill migration will use the profile's CT number as the contractor's `contractor_number`.

