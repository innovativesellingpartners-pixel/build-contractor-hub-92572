

# Drag-and-Drop Dashboard & Navigation Customization

## Overview

This plan enables CT1 users to customize the order of items on both the **CRM Dashboard tiles** and the **Bottom Navigation bar** by dragging and dropping them according to their personal priorities. The order will persist across sessions.

---

## Current State

### Dashboard (`CRMDashboard.tsx`)
- 8 module tiles (Calendar, Jobs, Estimates, Emails, Invoices, Calls, Customers, Accounting)
- Static order defined in `mainModules` array
- Rendered in a 2-column grid on mobile, 3-column on desktop

### Bottom Navigation (`BottomNav.tsx`)
- 4 visible buttons (CRM, Calls, Emails, Leads) + Menu hamburger
- Static order defined in `bottomNavItems` array
- Slide-out menu contains all 16 navigation items

### Storage
- No drag-and-drop library currently installed
- `profiles` table exists but has no layout preferences column
- Similar drag pattern exists for chat button (in `Dashboard.tsx` lines 99-209)

---

## Implementation Approach

### Phase 1: Add Drag-and-Drop Library

Install `@dnd-kit` - a modern, lightweight, accessible drag-and-drop toolkit for React:

```text
Dependencies to add:
├── @dnd-kit/core       (base DnD functionality)
├── @dnd-kit/sortable   (list reordering)
└── @dnd-kit/utilities  (helper functions)
```

**Why @dnd-kit?**
- Touch-friendly (critical for mobile)
- Lightweight (~20KB gzipped)
- Accessible (keyboard navigation)
- No legacy peer dependencies

---

### Phase 2: Create Reusable Sortable Components

#### New File: `src/components/ui/sortable-grid.tsx`

A reusable wrapper component that enables drag-and-drop reordering:

```text
SortableGrid
├── DndContext (provides drag context)
├── SortableContext (manages sortable items)
└── SortableItem (individual draggable items)
    ├── useSortable hook
    ├── Drag handle indicator
    └── Visual feedback during drag
```

Key features:
- Works on touch devices (mobile-first)
- Visual "lift" effect when dragging
- Drop indicator shows target position
- Smooth animations on reorder

---

### Phase 3: Persist User Preferences

#### Option A: LocalStorage (Immediate, no schema change) ✅ Recommended

```typescript
// Storage keys
'ct1_dashboard_tile_order'    // Dashboard tiles order
'ct1_bottomnav_order'         // Bottom nav order
'ct1_menu_order'              // Slide-out menu order

// Format: array of section IDs
["jobs", "estimates", "calendar", "emails", ...]
```

**Pros:** No database change, instant sync, works offline
**Cons:** Device-specific (won't sync across devices)

#### Option B: Database Column (Future enhancement)

Add `layout_preferences JSONB` column to `profiles` table for cross-device sync.

---

### Phase 4: Update Dashboard Component

#### Modified: `src/components/contractor/crm/sections/CRMDashboard.tsx`

```text
Changes:
┌─────────────────────────────────────────────────────┐
│ 1. Import DnD components                            │
│ 2. Add state for tile order                         │
│ 3. Load order from localStorage on mount            │
│ 4. Wrap tile grid with SortableContext              │
│ 5. Add drag handles to each tile                    │
│ 6. Save new order on drag end                       │
│ 7. Add "Reset to Default" button                    │
└─────────────────────────────────────────────────────┘
```

Visual indicator for edit mode:
- Long-press or dedicated "Customize" button activates edit mode
- Tiles show drag handles (6-dot grip icon)
- Cancel/Save buttons appear at top

---

### Phase 5: Update Bottom Navigation

#### Modified: `src/components/contractor/crm/BottomNav.tsx`

```text
Changes:
┌─────────────────────────────────────────────────────┐
│ 1. Add "Customize Nav" option in slide-out menu     │
│ 2. Customization mode:                              │
│    - All 4 bottom slots become sortable             │
│    - User can swap which items appear               │
│ 3. Slide-out menu items also reorderable            │
│ 4. Save preferences to localStorage                 │
└─────────────────────────────────────────────────────┘
```

Customize flow:
1. Open menu → tap "Customize Navigation"
2. Bottom nav shows all available items as selectable/draggable
3. Top 4 slots = what appears on bottom bar
4. Save → returns to normal nav with new order

---

## Technical Details

### Drag-and-Drop Hook Usage

```typescript
// In CRMDashboard.tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';

const [tileOrder, setTileOrder] = useState<string[]>(() => {
  const saved = localStorage.getItem('ct1_dashboard_tile_order');
  return saved ? JSON.parse(saved) : mainModules.map(m => m.id);
});

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = tileOrder.indexOf(active.id as string);
    const newIndex = tileOrder.indexOf(over.id as string);
    const newOrder = arrayMove(tileOrder, oldIndex, newIndex);
    setTileOrder(newOrder);
    localStorage.setItem('ct1_dashboard_tile_order', JSON.stringify(newOrder));
  }
};
```

### Touch-Friendly Configuration

```typescript
// Sensors for both mouse and touch
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // 8px movement to start drag
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }, // Long-press to start
  })
);
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/sortable-grid.tsx` | Reusable sortable grid wrapper |
| `src/hooks/useLayoutPreferences.ts` | Hook to manage layout preferences |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/contractor/crm/sections/CRMDashboard.tsx` | Add sortable tiles + edit mode |
| `src/components/contractor/crm/BottomNav.tsx` | Add sortable nav items + customize mode |
| `package.json` | Add @dnd-kit dependencies |

---

## User Experience Flow

### Dashboard Customization

```text
┌─────────────────────────────────────────────────────────┐
│  MyCT1 Dashboard           [Customize] [Reset Default]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ ⋮⋮ Calendar │  │ ⋮⋮  Jobs    │  │ ⋮⋮ Estimates│     │
│  │    📅       │  │    💼       │  │    📄       │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ ⋮⋮ Emails   │  │ ⋮⋮ Invoices │  │ ⋮⋮  Calls   │     │
│  │    📧       │  │    🧾       │  │    📞       │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ⋮⋮ = Drag handle (appears in edit mode)               │
└─────────────────────────────────────────────────────────┘
```

### Bottom Nav Customization

```text
Normal Mode:                    Customize Mode:
┌───────────────────────┐      ┌───────────────────────┐
│ CRM │Calls│Emails│Leads│ ≡   │  [Save]  [Cancel]     │
└───────────────────────┘      ├───────────────────────┤
                               │ Drag items to reorder │
                               │ ┌─────────────────────┤
                               │ │ 1. CRM     ⋮⋮       │
                               │ │ 2. Calls   ⋮⋮       │
                               │ │ 3. Emails  ⋮⋮       │
                               │ │ 4. Leads   ⋮⋮       │
                               │ └─────────────────────┤
                               └───────────────────────┘
```

---

## Acceptance Criteria

- [ ] Dashboard tiles are draggable on both mobile and desktop
- [ ] Bottom nav items can be reordered
- [ ] Order persists after page refresh
- [ ] Order persists after browser close/reopen
- [ ] "Reset to Default" restores original order
- [ ] Touch gestures work on iOS Safari and Android Chrome
- [ ] No horizontal overflow or layout breaking during drag
- [ ] Visual feedback during drag (shadow, scale)
- [ ] Accessible via keyboard (tab + arrow keys)

---

## Estimated Scope

| Component | Effort |
|-----------|--------|
| Add @dnd-kit dependencies | ~5 min |
| Create sortable-grid component | ~20 min |
| Create useLayoutPreferences hook | ~10 min |
| Update CRMDashboard with drag | ~25 min |
| Update BottomNav with drag | ~25 min |
| Mobile testing & polish | ~15 min |
| **Total** | **~1.5 hours** |

