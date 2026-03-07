

## Plan: Auto-connect Gmail & Calendar after Google Sign-In + Trial Signup

### Problem
Currently, platform sign-in (via Supabase Auth Google OAuth) and Gmail/Calendar connections (via custom `google-oauth-init` / `google-oauth-callback` edge functions) are completely separate flows. A user who signs in with Google still has to manually connect their Gmail and Calendar afterwards.

### Approach
After a Google OAuth user completes trial signup (or is detected as a paying customer), automatically trigger the Gmail and Calendar connection flows using the Google identity tokens already available from the sign-in session.

**However, there's a fundamental limitation:** The platform Google sign-in uses Supabase Auth's OAuth flow, which only requests `openid email profile` scopes. Gmail and Calendar require additional scopes (`gmail.readonly`, `gmail.send`, `calendar.events`, etc.) and a **refresh token** (which requires `access_type=offline` + `prompt=consent`). The sign-in token cannot be reused for API access.

### Recommended Solution: Post-signup auto-initiation

After trial signup completes (or after a paying Google user lands on dashboard), automatically kick off both Gmail and Calendar OAuth flows sequentially:

1. **Modify `TrialSignup.tsx`** — After successful trial creation, instead of just showing contractor setup, also call `google-oauth-init` for both `email` and `calendar` types and redirect the user through the consent flow.

2. **Create a new edge function `google-oauth-init-combined`** — A single OAuth init that requests **both** Gmail and Calendar scopes together, so the user only goes through one consent screen instead of two. The callback would save both connections at once.

3. **Modify `google-oauth-callback`** — Add handling for a `type=both` state that saves both email and calendar connections from a single token exchange.

### Implementation Steps

1. **New edge function `google-oauth-init-combined/index.ts`**
   - Combines Gmail + Calendar scopes into a single OAuth request
   - Creates an `oauth_states` entry with `type='both'`
   - Returns the authorization URL

2. **Update `google-oauth-callback/index.ts`**
   - Add a `type === 'both'` branch that saves to both `email_connections` and `calendar_connections` tables from the same token exchange

3. **Update `TrialSignup.tsx`**
   - After successful trial creation and before/during contractor setup, call the combined init function and redirect to Google consent
   - This way the user consents once for Gmail + Calendar access

4. **Update `Auth.tsx` subscription check**
   - For paying Google users who already have a subscription but no Gmail/Calendar connections, prompt or auto-redirect to the combined OAuth flow on dashboard load

### Key Details
- Single consent screen for both Gmail and Calendar (better UX)
- Uses `access_type=offline` and `prompt=consent` to get refresh tokens
- Scopes: `gmail.readonly gmail.send gmail.compose calendar.readonly calendar.events openid email profile`
- Stores tokens in both `email_connections` and `calendar_connections` tables
- Falls back gracefully if user declines — they can connect later from Connections Hub

### Files to Create/Modify
- **Create:** `supabase/functions/google-oauth-init-combined/index.ts`
- **Modify:** `supabase/functions/google-oauth-callback/index.ts` — add `type === 'both'` handling
- **Modify:** `src/pages/TrialSignup.tsx` — auto-trigger combined OAuth after signup
- **Modify:** `src/pages/Auth.tsx` — for existing paying Google users, check if connections exist and prompt if not

