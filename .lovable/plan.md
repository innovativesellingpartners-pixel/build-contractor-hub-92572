

## Fix: Google Sign-In `redirect_uri_mismatch` Error

### Root Cause
There are two issues:

1. **Build error** (`TS2307: Cannot find module '@lovable.dev/cloud-auth-js'`): The package `@lovable.dev/cloud-auth-js@^0.0.3` is listed in `package.json` but may not be resolving. This is an auto-generated file we cannot modify. We need to ensure the package installs correctly.

2. **`redirect_uri_mismatch`**: The Google OAuth flow is failing because the `scope` parameter is being passed via `extraParams`, which likely overrides or conflicts with the managed Lovable Cloud OAuth redirect configuration. The Lovable managed Google OAuth has specific redirect URIs configured, and passing custom scopes through `extraParams` can cause Google to reject the request.

### Important Limitation
Lovable Cloud's managed Google OAuth (`lovable.auth.signInWithOAuth`) handles standard sign-in scopes (openid, email, profile) automatically. However, **it does not support requesting additional API scopes** (like Calendar and Gmail) during the sign-in flow — those are custom API permissions beyond authentication.

### Revised Plan

**Step 1: Fix the Google Sign-In button to use standard scopes only**
- Remove the `extraParams.scope` and `access_type` parameters from the `lovable.auth.signInWithOAuth` call in `Auth.tsx`
- Keep it simple: just `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- This will fix the `redirect_uri_mismatch` error

**Step 2: Auto-connect Calendar & Gmail after sign-in using the existing manual flow**
- After a Google OAuth sign-in is detected in `AuthContext.tsx`, automatically trigger the existing `google-oauth-init` edge function with `type: 'both'` to request Calendar + Gmail scopes
- This uses the **existing** OAuth flow (which already has its own client ID/secret and redirect URIs configured) as a second step
- The user signs in once via Lovable managed OAuth, then gets silently redirected to grant Calendar/Gmail access

**Step 3: Alternative simpler approach — prompt user to connect after sign-in**
- After Google sign-in, show a one-time prompt: "Connect your Google Calendar & Gmail for full functionality"
- Clicking it triggers the existing manual connect flow with `type: 'both'`
- This avoids a double-redirect and keeps the UX clear

### Recommended Approach: Step 1 + Step 3
This is the most reliable approach:
1. Fix the sign-in button (remove extra scopes) → fixes the error
2. After first Google sign-in, show a banner/prompt to connect Calendar & Gmail in one click
3. The connect flow uses the existing `google-oauth-init`/`google-oauth-callback` edge functions which already have proper redirect URIs configured

### Files to modify
| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Remove `extraParams` with scope/access_type from Google sign-in call |
| `src/contexts/AuthContext.tsx` | Remove the auto-connect logic that calls `google-auto-connect` (it won't have Calendar/Gmail tokens from managed OAuth) |
| `supabase/functions/google-auto-connect/index.ts` | **Delete** — not needed since managed OAuth won't provide Calendar/Gmail tokens |

### What stays the same
- Existing email/password login
- Existing manual "Connect Google Calendar" and "Connect Gmail" flows
- The `google-oauth-init` and `google-oauth-callback` edge functions (these work and have proper redirect URIs)

