

# Darken Borders & Modernize Design System

This is a large, system-wide UI update touching theme tokens and core UI primitives. Here is the implementation plan.

---

## Phase 1: Update Global Theme Tokens (`src/index.css`)

**Border/divider tokens** — update to match requested specs:

- **Light mode**: `--border` from current `214 14% 85%` → `213 18% 59%` (equivalent to `#94A3B8` / slate-400)
- **Dark mode**: `--border` from current `220 14% 22%` → `215 19% 35%` (equivalent to `#475569` / slate-600)

Add new tokens for table-specific header borders:
- `--border-strong` — same values as `--border` but used semantically for 2px header borders

No changes needed for typography (Inter already set), radius (`--radius: 0.75rem` ≈ 12px already correct), or spacing (already using 8px-aligned scale).

## Phase 2: Update Core UI Components

### `src/components/ui/table.tsx`
- **TableHeader**: Add `border-b-2 border-border` (2px bottom border on header)
- **TableRow**: Change `border-border/40` → `border-border` (full opacity)
- **TableBody**: Ensure last row still has no bottom border
- **TableHead**: Add `sticky top-0 z-10 bg-muted/40` for sticky headers

### `src/components/ui/separator.tsx`
- Change from `bg-border` to full-opacity `bg-border` (already correct once token updated)

### `src/components/ui/card.tsx`
- Change `border-border/50` → `border-border` (full opacity on default variant)

### `src/components/ui/input.tsx`
- Already uses `border-border/60` — change to `border-border` for consistency

## Phase 3: Add Focus & Accessibility Styles (`src/index.css`)

Add a global focus-visible utility:
```css
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

Ensure all interactive elements (buttons, inputs, table rows) have visible focus rings meeting WCAG AA.

## Phase 4: Audit & Update Component Consumers

Search for inline `border-border/XX` patterns across all components and normalize to `border-border`. Key areas:
- Invoice line item editors
- CRM list views
- Reporting tables and panels
- Modal/sheet/dialog borders
- Form field groups and separators

This will be a targeted search-and-replace across components that override border opacity.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update `--border` token values for light/dark; add focus-visible rule |
| `src/components/ui/table.tsx` | Stronger borders, sticky headers, 2px header border |
| `src/components/ui/card.tsx` | Full-opacity border |
| `src/components/ui/input.tsx` | Full-opacity border |
| `src/components/ui/separator.tsx` | Already inherits from token — no change needed |
| Various consumer components | Normalize `border-border/XX` → `border-border` |

## What This Does NOT Change
- Font family (already Inter)
- Spacing scale (already 8px-aligned)
- Border radius (already 12px)
- Component structure or layouts
- Report filter bars, pagination, empty states (those are separate feature additions beyond a token/border update)

