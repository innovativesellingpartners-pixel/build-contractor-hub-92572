
# Fix QuickBooks Connection Error

## Problem Identified

The "Failed to send a request to the Edge Function" error occurs because the `quickbooks-oauth-init` function **is not deployed**. It's missing from the configuration file that controls which edge functions get deployed.

## What Needs to Be Fixed

### 1. Register Missing Edge Functions

Add the following functions to the configuration:

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `quickbooks-oauth-init` | Starts the QuickBooks connection flow | Yes (user must be logged in) |
| `quickbooks-api` | Makes API calls to QuickBooks | Yes (user must be logged in) |

### 2. Update CORS Headers

The current CORS headers are incomplete. They need to include additional headers that the browser sends:

**Current (incomplete):**
```
authorization, x-client-info, apikey, content-type
```

**Required (complete):**
```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

### 3. Deploy the Functions

After making these changes, the functions will be automatically deployed.

## Files to Modify

1. **supabase/config.toml** - Add function registrations
2. **supabase/functions/quickbooks-oauth-init/index.ts** - Update CORS headers
3. **supabase/functions/quickbooks-api/index.ts** - Update CORS headers

## Expected Result

After these changes:
- Clicking "Connect QuickBooks Account" will successfully initiate the OAuth flow
- You'll be redirected to the QuickBooks authorization page
- After authorizing, you'll be redirected back to your dashboard with the connection established

---

## Technical Details

### Config.toml Additions
```toml
[functions.quickbooks-oauth-init]
verify_jwt = true

[functions.quickbooks-api]
verify_jwt = true
```

### CORS Header Update (both functions)
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

### Verification Steps
1. Deploy the updated functions
2. Test the QuickBooks connection flow
3. Verify the OAuth redirect works correctly
4. Confirm the connection is stored in the database
