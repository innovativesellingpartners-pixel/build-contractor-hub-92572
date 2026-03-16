

# Fix: "Estimate not found or link has expired"

## Root Cause

The `public_token` column on the `estimates` table has **no default value**. When a new estimate is created, `public_token` is `null`. The UI then builds a link like `/estimate/null`, which sends the literal string `"null"` to the edge function, causing the UUID parse error seen in the logs.

## Fix

### 1. Database migration
- Add a default of `gen_random_uuid()` to the `public_token` column on `estimates` so all **new** estimates automatically get a token.
- Backfill any **existing** estimates that have a null `public_token`.

```sql
ALTER TABLE public.estimates 
  ALTER COLUMN public_token SET DEFAULT gen_random_uuid()::text;

UPDATE public.estimates 
  SET public_token = gen_random_uuid()::text 
  WHERE public_token IS NULL;
```

### 2. Frontend safeguard
- In `useEstimates.ts` `createEstimate`, explicitly set `public_token: crypto.randomUUID()` in the insert payload as a belt-and-suspenders measure.
- Also do the same in `useChangeOrders.ts` and `useInvoices.ts` if they have the same pattern.

### 3. UI guard
- Where links are built (e.g., share/send dialogs), add a null check so a link is never rendered with "null" as the token.

