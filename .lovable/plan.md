

## Security Audit Remediation Plan

### Context
The audit scored Security at 52/100. The report estimates fixing these issues will bring it to ~85/100. I've verified each finding against the actual codebase. Here's what needs to change, grouped by priority.

---

### P0 — Critical (Immediate)

**1. .env File Exposure — No Action Needed**
The audit flags the `.env` file. However, on Lovable Cloud this file is auto-generated and contains only the public anon key (which is designed to be public). The service role key is stored securely as a secret and is never in the `.env`. This finding is a false positive for your hosting setup — no code change required.

**2. Add Content Security Policy (CSP) to `index.html`**
Add a CSP meta tag to lock down script/style/connection sources. This prevents XSS payload injection.
- File: `index.html`
- Add meta tag allowing `'self'`, Supabase domains, Google Fonts, and trusted CDNs

---

### P1 — High Severity

**3. Sanitize `markdownToHtml()` output in `HelpArticleView.tsx`**
The `markdownToHtml()` function has a dangerous bypass: if content contains HTML tags, it returns raw unsanitized HTML. Two fixes needed:
- File: `src/lib/markdownToHtml.ts` — Remove the HTML passthrough bypass (lines 8-11)
- File: `src/components/help/HelpArticleView.tsx` — Wrap both `dangerouslySetInnerHTML` calls with `DOMPurify.sanitize()`

**4. Restrict CORS to production domains**
Currently `Access-Control-Allow-Origin: '*'` on all 116 edge functions.
- File: `supabase/functions/_shared/cors.ts` — Use an allowlist of origins (`https://myct1.com`, preview domains) with a fallback. Also add the missing CORS headers the audit noted.

---

### P2 — Medium Severity

**5. Create `AdminProtectedRoute` component**
Admin routes currently only check if a user is logged in, not their role. Any authenticated user could see the admin UI shell.
- New file: `src/components/AdminProtectedRoute.tsx` — Check `useAdminAuth()` and redirect non-admins to `/dashboard`
- File: `src/App.tsx` — Replace `<AdminLayout />` wrapper with `<AdminProtectedRoute>`

**6. Configure QueryClient with sensible defaults**
Currently using `new QueryClient()` with no config, causing 3 retries on failed requests.
- File: `src/App.tsx` — Add `defaultOptions` with `retry: 1`, `staleTime: 30_000`, `gcTime: 300_000`

**7. Gate auth debug logs behind DEV flag**
`Auth.tsx` has 19 `console.log` calls that leak OAuth flow details in production.
- File: `src/pages/Auth.tsx` — Replace all `console.log` calls with a dev-only wrapper

---

### P1 — Performance (High Impact)

**8. Add React.lazy() route-level code splitting**
All 50+ page components are eagerly imported, creating a large initial bundle. This is the biggest performance win.
- File: `src/App.tsx` — Convert all page imports to `React.lazy()` with a `Suspense` fallback. Keep critical paths (landing, auth, dashboard) eager; lazy-load everything else.

---

### Files Changed Summary

| File | Change |
|------|--------|
| `index.html` | Add CSP meta tag |
| `supabase/functions/_shared/cors.ts` | Restrict origins to production domains |
| `src/lib/markdownToHtml.ts` | Remove HTML passthrough bypass |
| `src/components/help/HelpArticleView.tsx` | Add DOMPurify sanitization |
| `src/components/AdminProtectedRoute.tsx` | New file — role-gated route wrapper |
| `src/App.tsx` | QueryClient config, React.lazy() splitting, AdminProtectedRoute |
| `src/pages/Auth.tsx` | Gate console.log behind `import.meta.env.DEV` |

### Not Addressable in Lovable (Informational)
- **pgBouncer connection pooling** — managed by Lovable Cloud infrastructure
- **Supabase SDK version standardization** — edge function imports use esm.sh; will standardize to npm: specifiers
- **react-signature-canvas alpha** — functional; replacing risks breaking the signature feature
- **SheetJS CDN source** — no npm alternative without AGPL licensing issues
- **Asset CDN migration** — requires external CDN setup outside Lovable

