

# Tighten Up the Contact Page Design

## Problem
The contact page has excessive spacing between sections and cards, double-padding on card components, and the CT1 logo is missing from the hero area. This makes the page feel stretched and disconnected.

## Changes (single file: `src/pages/Contact.tsx`)

### 1. Add the CT1 logo to the hero section
- Place the round CT1 logo (`ct1-round-logo-new.png`) prominently above the "Contact Us" badge in the hero, centered and sized at roughly 64x64px.

### 2. Reduce section padding
- Hero section: `py-20` down to `py-12`
- Contact Form section: `py-20` down to `py-12`
- Office Locations section: `py-20` down to `py-12`
- FAQ section: `py-20` down to `py-12`
- Section heading bottom margins (`mb-16`) down to `mb-8` or `mb-10`

### 3. Fix double-padding on contact method cards
- The cards currently have `p-6` on the `<Card>` AND `pt-6` on `<CardContent>` inside, which creates excessive internal spacing.
- Remove the outer `p-6` from `<Card>` and keep `CardContent` with `p-4 pt-4` for a compact look.
- Same fix for FAQ cards and the office location card.

### 4. Tighten the grid and gaps
- Contact form/info grid gap: `gap-12` down to `gap-8`
- Contact methods grid: `gap-6` down to `gap-4`
- Right column spacing: `space-y-8` down to `space-y-4`
- FAQ card spacing: `space-y-6` down to `space-y-4`

### 5. Reduce heading text sizes slightly
- Section h2 headings: `text-4xl` down to `text-3xl` for a tighter vertical rhythm
- Subtext: `text-xl` down to `text-lg`

No new files or dependencies are needed. All changes are within `src/pages/Contact.tsx`.

