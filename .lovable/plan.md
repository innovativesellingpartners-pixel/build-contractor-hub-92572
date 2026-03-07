

## Problem Analysis

There are **two separate issues** preventing Google Sign-In from working:

### Issue 1: Custom Domain OAuth Flow
When running on `myct1.com` (custom domain, not `*.lovable.app`), the `lovable.auth.signInWithOAuth` library redirects the user to `/~oauth/initiate` on the custom domain. After Google auth completes, the Lovable auth-bridge redirects back to the **preview URL** (`build-contractor-hub-92572.lovable.app`) instead of `myct1.com`. The user lands on the preview URL, the session is set there, but the user's browser is on `myct1.com` -- so the session is lost.

The library source confirms: when NOT in an iframe, it does `window.location.href = /~oauth/initiate?...` which triggers a full page redirect through Lovable's auth bridge. On custom domains this breaks.

**Fix:** Detect custom domain and bypass the Lovable auth bridge entirely. Use `supabase.auth.signInWithOAuth` directly with `skipBrowserRedirect: true`, then manually redirect to Google. The callback will come back to the Supabase auth callback URL which properly redirects to `myct1.com`.

### Issue 2: New Users Without Subscriptions
When a Google user has no existing CT1 account, the `handle_new_user` trigger auto-creates a profile + contractor record, but **no subscription** is created. The dashboard loads but with zero feature access (all tier features return `false`). The user is effectively in a dead state.

**Fix:** After Google sign-in establishes a session, check if the user has an active subscription. If not, redirect them to `/trial-signup` with their Google email prefilled to complete the 30-day trial setup.

---

## Implementation Plan

### Step 1: Fix Google OAuth on Custom Domain

**File: `src/pages/Auth.tsx`**

Modify the Google sign-in handler to detect if running on a custom domain:
- **Custom domain** (`myct1.com`): Use `supabase.auth.signInWithOAuth("google", { redirectTo: origin + "/auth", skipBrowserRedirect: true })` then manually redirect via `window.location.href = data.url`
- **Lovable domain** (`*.lovable.app`): Keep using `lovable.auth.signInWithOAuth("google", ...)` as-is

Remove the `completeOAuthCallback` useEffect (lines 39-73) -- it was a workaround that doesn't apply. Instead, rely on Supabase's built-in callback handling which parses the URL hash/code params via `onAuthStateChange` in `AuthContext.tsx`.

### Step 2: Add Subscription Check After Google Sign-In

**File: `src/pages/Auth.tsx`**

After the `user` state is detected (existing `useEffect` on line 32), enhance the redirect logic:
1. If `user` exists, query `subscriptions` for an active record
2. If active subscription exists → redirect to `/dashboard` (current behavior)
3. If no active subscription → redirect to `/trial-signup?email={user.email}&from=google` so the trial page can prefill the email and skip the password field

### Step 3: Enhance Trial Signup for Google Users

**File: `src/pages/TrialSignup.tsx`**

- Read `email` and `from=google` query params
- If `from=google`: prefill email (read-only), hide password field (user already authenticated via Google), auto-detect name from `user.user_metadata`
- On submit: skip `signUp()` call (user already exists), just create profile + subscription records for the existing `user.id`

### Step 4: Update Service Worker

**File: `public/sw.js`**

Add `'/~oauth'` to the `EXCLUDED_URLS` array so the service worker never caches OAuth-related routes.

---

## Technical Details

**Custom domain detection:**
```typescript
const isCustomDomain = 
  !window.location.hostname.includes("lovable.app") &&
  !window.location.hostname.includes("lovableproject.com") &&
  !window.location.hostname.includes("localhost");
```

**Subscription check query:**
```typescript
const { data: sub } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle();
```

**Auth callback redirect URL** must be added to the backend's allowed redirect list: `https://myct1.com/auth` (via the auth settings).

**Files changed:** `src/pages/Auth.tsx`, `src/pages/TrialSignup.tsx`, `public/sw.js`

**No database changes required** -- existing tables and triggers handle everything.

