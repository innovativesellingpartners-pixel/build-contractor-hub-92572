

## Add Privacy Policy & Terms Links to Desktop Sidebars

### What
Add small "Privacy Policy" and "Terms of Service" links to the bottom of every desktop sidebar so they're always one click away when presenting the platform.

### Where (3 places)

1. **`src/components/admin/AdminSidebar.tsx`** — Add links below the `<nav>` block, pinned to the bottom of the sidebar.

2. **`src/components/Dashboard.tsx` → `UnifiedHubSidebar`** (desktop sidebar for non-CRM sections, ~line 985-1026) — Add links at the bottom of the `<aside>`.

3. **`src/components/Dashboard.tsx` → `SidebarNav`** (desktop sidebar for hub sections, ~line 1048-1232) — Add links at the bottom of the `<nav>`.

### How
- Create a small reusable `LegalLinks` component (or just inline it) with two `<Link>` elements pointing to `/legal/privacy` and `/legal/terms`.
- Styled as small, muted text (`text-xs text-muted-foreground`) with hover effect, separated by a dot or pipe.
- Placed at the very bottom of each sidebar with `mt-auto` so they stick to the bottom.
- Desktop only — no changes to mobile nav.

### Files Modified
- `src/components/admin/AdminSidebar.tsx`
- `src/components/Dashboard.tsx`

