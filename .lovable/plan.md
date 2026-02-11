

# Accounting and QuickBooks Integration Review

## Current State Assessment

The integration is well-structured with a solid foundation: OAuth 2.0 flow, encrypted token storage, automatic token refresh, and a comprehensive set of 9 report views (Overview, P&L, Balance Sheet, Sales/Invoices, Payments, Expenses, Customers, Vendors, Aging). Here are the issues and improvements identified:

---

## Issues Found

### 1. Duplicate/Conflicting OAuth Callback Functions
There are TWO callback functions that serve the same purpose:
- `quickbooks-callback` -- redirects to `https://myct1.com/crm?qb_connected=true`
- `quickbooks-oauth-callback` -- redirects to the Lovable app URL with `?qb_connected=true`

The `quickbooks-connect` function points to `https://myct1.com/api/quickbooks/callback`, so only `quickbooks-callback` is actively used. The `quickbooks-oauth-callback` is orphaned and uses a different redirect URI pointing to the Supabase function URL itself. This should be cleaned up.

### 2. OAuth Callback Redirect Goes to Wrong Page
`quickbooks-callback` redirects to `https://myct1.com/crm?qb_connected=true`, but the toast handler that shows the "QuickBooks Connected!" success message lives in `BankingView.tsx`, which is on the `/dashboard` route under the Accounting section (Banking tab). Users won't see the success toast because they land on `/crm` instead of `/dashboard`.

### 3. Disconnect Doesn't Revoke Tokens with Intuit
The `quickbooks-disconnect` function only clears the local database fields (profile columns) but never calls Intuit's token revocation endpoint (`https://developer.api.intuit.com/v2/oauth2/tokens/revoke`). This leaves the OAuth grant active on Intuit's side, which is a security concern.

### 4. Disconnect Doesn't Clear `quickbooks_connections` Table
The disconnect function clears fields on the `profiles` table but doesn't delete the row from the `quickbooks_connections` table where the encrypted tokens are actually stored. This means the `quickbooks-api` function could still retrieve stale tokens via `get_quickbooks_tokens`.

### 5. Auth Pattern Inconsistency
`quickbooks-connect` calls `supabaseClient.auth.getUser()` without passing the token explicitly, while `quickbooks-api` correctly calls `userClient.auth.getUser(token)`. Per the project's established pattern (documented in memory), the token should always be passed explicitly to prevent "Auth session missing" errors.

### 6. Error Messages Are Generic
When QuickBooks API calls fail (e.g., expired subscription, rate limiting, company mismatch), the error messages shown to users are generic ("We're having trouble syncing..."). The QB API returns specific error codes that could provide better guidance.

### 7. No Last-Sync Timestamp Display
The sync button exists but there's no visible indicator of when data was last refreshed. Users can't tell if they're looking at data from 5 minutes ago or 5 days ago.

### 8. QBAging Still Uses Horizontal Tabs
The `QBAging` component still uses `TabsList` / `TabsTrigger` for the AR/AP toggle, which contradicts the recent conversion of all navigation to dropdown selects. (Though this is a minor 2-option toggle, so tabs may be acceptable here.)

---

## Proposed Improvements

### Phase 1: Fix Critical Issues

**1a. Fix OAuth callback redirect**
Update `quickbooks-callback` to redirect to the correct route (`/dashboard?tab=banking&qb_connected=true`) so users see the success toast.

**1b. Fix disconnect to revoke tokens properly**
Update `quickbooks-disconnect` to:
- Retrieve encrypted tokens from `quickbooks_connections` before deleting
- Call Intuit's revocation endpoint with the access token
- Delete the `quickbooks_connections` row
- Then clear the profile fields

**1c. Fix auth pattern in `quickbooks-connect`**
Pass the JWT token explicitly to `getUser(token)` to match the project's established pattern.

### Phase 2: UX Improvements

**2a. Add last-synced timestamp**
Show a "Last synced: X minutes ago" indicator next to the Sync button in the QuickBooksReportsHub header.

**2b. Better error messages**
Parse QuickBooks API error responses in the `quickbooks-api` function and return user-friendly messages (e.g., "Your accounting subscription may have expired" for 403 errors, "Rate limit reached, please try again in a moment" for 429).

**2c. Remove orphaned `quickbooks-oauth-callback` function**
Delete the unused duplicate callback function to reduce confusion.

---

## Technical Details

### Disconnect Token Revocation (Phase 1b)
```text
quickbooks-disconnect flow:
1. Authenticate user
2. Retrieve tokens via get_quickbooks_tokens RPC
3. POST to https://developer.api.intuit.com/v2/oauth2/tokens/revoke
   with token=<access_token> (best-effort, don't fail if Intuit is down)
4. DELETE from quickbooks_connections WHERE user_id = contractorId
5. UPDATE profiles SET qb_realm_id = null, ... WHERE id = contractorId
6. Return success
```

### Auth Fix (Phase 1c)
```text
// Before (quickbooks-connect):
await supabaseClient.auth.getUser();

// After:
const token = authHeader.replace('Bearer ', '');
await supabaseClient.auth.getUser(token);
```

### Last-Synced Display (Phase 2a)
Query `profiles.qb_last_sync_at` and display relative time (e.g., "5 min ago") next to the Sync button. Update this timestamp after each successful sync.

### Files to modify:
- `supabase/functions/quickbooks-disconnect/index.ts` -- token revocation + connections cleanup
- `supabase/functions/quickbooks-connect/index.ts` -- auth pattern fix
- `supabase/functions/quickbooks-callback/index.ts` -- redirect URL fix
- `supabase/functions/quickbooks-api/index.ts` -- better error messages
- `src/components/accounting/quickbooks/QuickBooksReportsHub.tsx` -- last-synced indicator
- Delete: `supabase/functions/quickbooks-oauth-callback/index.ts`

