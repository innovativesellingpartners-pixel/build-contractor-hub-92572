# myCT1 Design System — Internal Style Guide

## Typography Scale

| Role           | Size           | Weight    | Tracking     | Notes                      |
|----------------|----------------|-----------|--------------|----------------------------|
| Page title     | text-2xl/3xl   | font-bold | tracking-tight | Sentence case, always `<h1>` |
| Section title  | text-lg/xl     | font-semibold | tracking-tight | `<h2>` or `<h3>`          |
| Subhead        | text-base      | font-semibold | default      | `<h4>`                    |
| Table header   | text-xs        | font-semibold | tracking-wide | Sentence case, NOT uppercase |
| Body text      | text-sm        | font-normal | default      | `text-foreground`          |
| Helper / meta  | text-xs        | font-medium | default      | `text-muted-foreground`    |
| Financial nums | any            | font-bold | tracking-tight | Always `tabular-nums`     |

**Key rule:** No forced uppercase. Use sentence case everywhere.

---

## Cards

- **Border radius:** `rounded-xl` (0.75rem)
- **Border:** `border border-border/40` (light) or `border-border/50`
- **Shadow:** `var(--shadow-card)` — subtle 1-3px layered shadow
- **Hover:** `var(--shadow-card-hover)` + `border-border` (full opacity)
- **Padding:** `p-5 sm:p-6` for Card content
- **Variants:** default (white), blue, green, purple, orange, gradient

Use the CSS utility class `card-interactive` for clickable cards.

---

## Tables

- **Header:** `bg-muted/40`, no bottom border on thead row, `text-xs font-semibold tracking-wide`
- **Rows:** `border-b border-border/40`, hover `bg-muted/30`
- **Cells:** `px-4 py-3.5` for comfortable row height
- **Money values:** Right-aligned, `tabular-nums tracking-tight`
- **Dividers:** Subtle `border-border/40`, no heavy borders

---

## Status Chips (Badges)

Use `<Badge>` with `rounded-full` pill style. Tinted backgrounds, never solid:

| Status     | Style                                                        |
|------------|--------------------------------------------------------------|
| New        | `bg-blue-500/10 text-blue-700 dark:text-blue-400`           |
| Active     | `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`  |
| Draft      | `bg-secondary text-secondary-foreground`                     |
| Sent       | `bg-blue-500/10 text-blue-700 dark:text-blue-400`           |
| Paid       | `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`  |
| Overdue    | `bg-red-500/10 text-red-700 dark:text-red-400`              |
| Warning    | `bg-amber-500/10 text-amber-700 dark:text-amber-400`        |
| Cancelled  | `bg-red-500/10 text-red-700 dark:text-red-400`              |

---

## Icons

Use `lucide-react` icons consistently:
- **Jobs:** `Briefcase`
- **Estimates:** `FileText`
- **Invoices:** `Receipt` or `FileText`
- **Customers:** `Users`
- **Leads:** `UserPlus`
- **Calls:** `Phone`
- **Calendar:** `Calendar`
- **Reports:** `BarChart3`
- **Accounting:** `DollarSign`
- **Attachments:** `Paperclip`
- **Notes:** `StickyNote`

Icon sizing: `h-4 w-4` in buttons/badges, `h-5 w-5` in avatars, `h-6-7 w-6-7` in dashboard tiles.

---

## Layout Spacing

| Context               | Value                          |
|-----------------------|--------------------------------|
| Page horizontal pad   | `px-4 sm:px-6 lg:px-8`        |
| Section vertical gap  | `space-y-5 sm:space-y-6`      |
| Card internal padding | `p-5 sm:p-6`                  |
| Row card padding      | `px-4 py-3.5`                 |
| Max content width     | `max-w-7xl mx-auto`           |
| Metric card grid      | `grid-cols-2 xl:grid-cols-4 gap-4` |

---

## Metric Cards

- Top accent line: 2px colored bar, opacity 50%
- Icon: 10×10 rounded-xl container with tinted bg
- Title: `text-xs font-medium text-muted-foreground`
- Value: `text-2xl font-bold tabular-nums`
- Trend: Rounded-full pill with color-coded bg

---

## Hover & Focus States

- **Cards:** Shadow lift from `shadow-card` → `shadow-card-hover`, border becomes fully opaque
- **Buttons:** Standard Tailwind hover variants, `active:scale-[0.98]`
- **Table rows:** `hover:bg-muted/30`
- **Row cards:** `hover:bg-card-hover hover:border-border/60`
- **Focus rings:** `ring-2 ring-primary/20`

---

## Empty States

- 14×14 rounded-2xl icon container, `bg-muted/50`
- Title: `text-base font-semibold`
- Description: `text-sm text-muted-foreground max-w-md`
- Optional CTA button below

---

## Loading States

- Skeleton: `rounded-xl bg-muted/50 animate-pulse`
- Row skeletons: `h-16 rounded-xl`
- Use 3 skeleton rows as placeholder

---

## Dark Mode

All tokens auto-switch via CSS variables. Key differences:
- Background: `220 16% 6%` (rich dark, not pure black)
- Cards: `220 14% 9%` with `0 0% 0% / 0.3` shadows
- Primary red bumped to 48% lightness for contrast
- Borders: `220 14% 22%` for subtle definition
