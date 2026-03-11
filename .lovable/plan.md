

## Fix Touch Scrolling Across Contractor Hub & CRM

### Root Cause
The `SortableItem` component in `src/components/ui/sortable-grid.tsx` applies `touch-none` (CSS `touch-action: none`) to every tile **regardless of whether edit/drag mode is active**. This blocks the browser's native touch scroll on all cards and tiles. The `SortableListItem` has the same issue.

### Changes

**1. `src/components/ui/sortable-grid.tsx`**
- `SortableItem` (line 60): Only apply `touch-none` when `disabled` is false (drag mode active). When disabled, use `touch-auto` so normal scrolling works.
- `SortableListItem` (line 186): Same fix — only `touch-none` when not disabled.

**2. `src/components/contractor/crm/CT1CRM.tsx` (line 425-426)**
- Add `touch-action: pan-y` to the main scrollable content area to ensure vertical touch scrolling is always permitted.

**3. `src/components/contractor/crm/sections/MobileOptimizedWrapper.tsx`**
- Change `overflow-hidden` on the children container (line 36) to `overflow-visible` so nested scroll events propagate properly. Keep `overflow-x-hidden` to prevent horizontal overflow.

**4. Global CSS touch improvement — `src/index.css`**
- Add a utility rule: `.touch-scroll { touch-action: pan-y; -webkit-overflow-scrolling: touch; }` for reuse across scrollable containers.

### Result
Touching anywhere on the screen — including on tiles, cards, and content areas — will allow natural page scrolling on mobile, tablet, and desktop. Drag-and-drop only captures touch when the user is in Customize/edit mode.

