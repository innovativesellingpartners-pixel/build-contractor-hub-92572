

## Problem Analysis

The logout flow has a race condition causing users to briefly see the pricing/subscribe page before reaching the login page:

1. **`signOut()` in `AuthContext.tsx`** sets `loading=true` and clears user state, then calls `supabase.auth.signOut()`.
2. The `onAuthStateChange` listener fires from the Supabase sign-out event and **sets `loading=false`**.
3. Now `ProtectedRoute` sees `loading=false` + `user=null` → redirects to **`/subscribe`** (the pricing page).
4. Only after that does `window.location.replace('https://myct1.com/auth')` attempt to navigate away — but the subscribe page already flashed.

Additionally, the redirect URL is hardcoded to `https://myct1.com/auth`, which doesn't work in preview environments.

## Plan

### 1. Fix `ProtectedRoute.tsx` — redirect to `/auth` instead of `/subscribe`
Change `<Navigate to="/subscribe" replace />` → `<Navigate to="/auth" replace />`. This way, even if the race condition occurs, users see the login page (not pricing).

### 2. Fix `signOut()` in `AuthContext.tsx` — use relative redirect and prevent race condition
- Replace `window.location.replace('https://myct1.com/auth')` with `window.location.replace('/auth')` so it works in all environments.
- Move the redirect **before** `supabase.auth.signOut()` to prevent the `onAuthStateChange` callback from triggering the ProtectedRoute redirect. Or alternatively, keep `loading=true` by not letting `onAuthStateChange` override it during sign-out (add a sign-out flag).

The simplest approach: add a `signingOut` ref that prevents `onAuthStateChange` from setting `loading=false`, and use a relative `/auth` URL.

### Files to modify
- `src/contexts/AuthContext.tsx` — add signing-out guard + fix redirect URL
- `src/components/ProtectedRoute.tsx` — redirect to `/auth` instead of `/subscribe`

