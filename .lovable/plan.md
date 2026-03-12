

## Auto-Hide Bottom Nav on Scroll

**Problem**: The fixed bottom navigation bar covers buttons and functionality at the bottom of job detail pages and other CRM views.

**Solution**: Hide the bottom nav when the user scrolls down, show it when they scroll up — a common mobile pattern (like iOS Safari's toolbar behavior). This gives full access to page content while keeping navigation easily accessible.

### Changes

**1. Create `useScrollDirection` hook** (`src/hooks/useScrollDirection.ts`)
- Track scroll direction (up/down) using a scroll event listener
- Return `isScrollingDown` boolean
- Include a small threshold (~10px) to prevent jitter
- Accept a ref to the scroll container (since CRM content scrolls inside a div, not the window)

**2. Update `BottomNav.tsx`**
- Accept an optional `hidden` prop
- Add a CSS transition: `translate-y-full` when hidden, `translate-y-0` when visible
- Smooth transition (~300ms) for polish

**3. Update `CT1CRM.tsx`**
- Add `useScrollDirection` on the main scrollable content div
- Pass the `hidden` state to `BottomNav`
- When nav is hidden, reduce the bottom padding on main content so the full page height is usable

This pattern preserves all existing functionality — the nav reappears instantly when the user scrolls up even slightly.

