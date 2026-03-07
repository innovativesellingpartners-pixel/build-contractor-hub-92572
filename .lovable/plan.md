

## Google Sign-In + Auto-Connect Calendar & Gmail

### What we're building
Two authentication paths on the login page:
1. **"Sign in with Google"** button — uses Lovable Cloud managed Google OAuth to authenticate the user into the platform, then automatically saves their Google tokens to both `calendar_connections` and `email_connections` tables so Calendar and Gmail work immediately.
2. **Existing email/password** — unchanged; users connect Google Calendar/Gmail manually from within the platform as they do today.

### How it works

**Auth page (`src/pages/Auth.tsx`)**
- Add a "Sign in with Google" button (with Google icon) above the email/password form, separated by an "or" divider.
- Uses `lovable.auth.signInWithOAuth("google", ...)` with additional scopes for Calendar and Gmail access via `extraParams`.
- On return, the `AuthContext` picks up the session automatically.

**Post-login auto-connect (`src/contexts/AuthContext.tsx`)**
- After detecting a Google OAuth sign-in (check `session.user.app_metadata.provider === 'google'`), call a new edge function `google-auto-connect` passing the provider token from the session.
- This only runs once per login (guard with a ref or sessionStorage flag).

**New edge function: `supabase/functions/google-auto-connect/index.ts`**
- Receives the user's `provider_token` and `provider_refresh_token` from the session.
- Fetches Google user info to get email.
- Upserts into both `calendar_connections` and `email_connections` with the tokens, same pattern as the existing `google-oauth-callback`.
- Returns success/failure JSON.

**Edge function updates**
- `google-oauth-init` and `google-oauth-callback` remain unchanged — they continue to serve manual connect flows for email/password users.

### Files to create/modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add "Sign in with Google" button using `lovable.auth.signInWithOAuth("google")` |
| `src/contexts/AuthContext.tsx` | After Google OAuth login, invoke `google-auto-connect` edge function with provider tokens |
| `supabase/functions/google-auto-connect/index.ts` | **New** — accepts provider tokens, upserts both calendar and email connections |
| `supabase/config.toml` | Add `[functions.google-auto-connect]` with `verify_jwt = false` |

### Important details
- The Lovable Cloud managed Google OAuth handles the sign-in identity. The `provider_token` and `provider_refresh_token` on the session carry the Google access/refresh tokens which we reuse for Calendar/Gmail.
- We need to request extra scopes (`calendar.readonly`, `calendar.events`, `gmail.readonly`, `gmail.send`, `gmail.compose`) via the `scopes` parameter in `signInWithOAuth`.
- If `provider_refresh_token` is null (re-login without consent), we skip auto-connect and let the user connect manually from the platform — avoids broken connections.

### Flow
1. User clicks "Sign in with Google" on login page
2. Google consent screen shows Calendar + Gmail scopes
3. User grants access → redirected back → Lovable Cloud creates/logs in the user
4. `AuthContext` detects Google provider → calls `google-auto-connect` edge function
5. Edge function saves tokens to both connection tables
6. User lands on dashboard with Calendar and Gmail already connected
7. Toast: "Google Calendar & Gmail connected automatically"

