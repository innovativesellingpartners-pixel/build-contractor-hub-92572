

# Mobile Layout Optimization for Maximum Contractor Viewport

## Problems Identified

1. **Top area wastes space**: The mobile search bar header (`border-b bg-card px-3 py-2`) sits permanently at the top, eating vertical space on every section view.
2. **Bottom nav is too tall and clunky**: The `BottomNav` is `h-16` (64px) fixed at the bottom, plus safe-area padding. Even with the scroll-to-hide behavior, the padding toggle (`pb-28` vs `pb-6`) is jarring.
3. **Content padding is excessive**: The main content area has `pb-28` when nav is visible — that's 112px of dead space at the bottom.

## Changes (3 files, no visual redesign)

### 1. Slim down BottomNav (`src/components/contractor/crm/BottomNav.tsx`)

- Reduce nav height from `h-16` to `h-12` (48px) — saves 16px
- Reduce icon size from `h-5 w-5` to `h-4 w-4` and text from `text-xs` to `text-[10px]`
- Reduce button padding from `px-3 py-2` to `px-2 py-1`
- Tighten active state scale from `scale-110` to `scale-105`
- Result: a compact nav bar that still has clear tap targets but uses ~30% less vertical space

### 2. Optimize main content area (`src/components/contractor/crm/CT1CRM.tsx`)

- Move the search bar from a fixed header into a collapsible element that hides with scroll (same `isScrollingDown` flag)
- Reduce bottom padding from `pb-28` (nav visible) to `pb-16`, and from `pb-6` (nav hidden) to `pb-2`
- Remove the top search bar border-b chrome when scrolling down to reclaim ~40px at top
- Ensure the scroll container uses the full viewport height

### 3. Adjust PageShell default padding (`src/components/ui/page-shell.tsx`)

- Reduce mobile `pb-20` to `pb-14` to match the slimmer bottom nav

## Technical Details

- All changes are CSS/className only — no logic, routing, or data changes
- The `useScrollDirection` hook already handles show/hide; we extend its usage to the search bar
- BottomNav `hidden` prop and transition remain identical, just with smaller dimensions
- Safe-area-inset-bottom handling stays in place for notched devices

