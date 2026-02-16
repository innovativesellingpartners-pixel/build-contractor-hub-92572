
# Redesign Product and Feature Pages to Mirror About Us Layout

## Problem
The About Us page has a clean, consistent design with specific patterns (Badge hero, gradient background, stats grid, two-column alternating sections, card grids, gradient CTA). The 14 product and feature pages each use different, inconsistent layouts -- custom headers instead of `MainSiteHeader`, different hero styles, different section backgrounds, different CTA sections, and inconsistent spacing.

## About Us Page Layout Pattern (the template)

1. **Header**: Uses `MainSiteHeader` (shared site header)
2. **Hero Section**: `py-20 bg-gradient-to-br from-background to-muted/30` with centered `Badge` (icon + text), large `text-5xl` heading with `text-primary` accent span, `text-xl` description paragraph, followed by a 4-column stats grid of `Card` components
3. **Two-Column Story Section**: `py-20 bg-background` with `lg:grid-cols-2` -- text on left (heading, paragraphs), staggered 2x2 card grid on right with icons
4. **Values/Features Grid**: `py-20 bg-muted/30` with centered heading, `md:grid-cols-2 lg:grid-cols-4` card grid with icon, title, description
5. **CTA Section**: `py-20 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground` with heading, description, two buttons (primary inverted + outline)
6. **Footer**: `PublicFooter`

## Pages to Redesign (14 total)

### Feature Pages (9)
- `src/pages/features/CRM.tsx`
- `src/pages/features/Jobs.tsx`
- `src/pages/features/Estimating.tsx`
- `src/pages/features/Reporting.tsx`
- `src/pages/features/VoiceAI.tsx`
- `src/pages/features/Insurance.tsx`
- `src/pages/features/Leads.tsx`
- `src/pages/features/Training.tsx`
- `src/pages/features/QuickBooks.tsx`

### Product Pages (5)
- `src/pages/products/PocketbotProduct.tsx` (already redesigned -- will verify alignment)
- `src/pages/products/VoiceAIProduct.tsx`
- `src/pages/products/TierGrowth.tsx`
- `src/pages/products/TierLaunch.tsx`
- `src/pages/products/TierMarket.tsx`

## Changes Per Page

Each page will be restructured to follow this exact skeleton while keeping its unique content/data:

1. **Replace any custom header** with `MainSiteHeader` (some pages like CRM have their own inline header)
2. **Hero section**: Centered layout with `Badge` component (page icon + label), `text-5xl` bold heading with `text-primary` accent, `text-xl` subtitle, 4-column stats grid below -- using `py-20 bg-gradient-to-br from-background to-muted/30`
3. **Two-column section**: `py-20 bg-background` with `lg:grid-cols-2` layout -- descriptive text on one side, staggered card grid or feature cards on the other
4. **Features/values card grid**: `py-20 bg-muted/30` with centered heading, grid of cards using `card-ct1` class with centered icons, bold titles, descriptions
5. **CTA section**: `py-20 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground` with two buttons ("Get Started" linking to pricing/auth + "Contact Us" linking to contact)
6. **Footer**: `PublicFooter` (already present on all pages)

## Technical Details

- All pages will use the same imports: `Badge` from `@/components/ui/badge`, `Card`/`CardContent`, `Button`, `MainSiteHeader`, `PublicFooter`, `FloatingTrialButton`, `Link`
- Same CSS class patterns: `py-20` section spacing, `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` container, `card-ct1` card styling, `text-5xl` hero headings
- Same gradient patterns: `bg-gradient-to-br from-background to-muted/30` for hero, `bg-muted/30` for alternating sections, `bg-gradient-to-r from-primary to-primary-hover` for CTA
- The data/content (features, stats, descriptions) stays the same for each page -- only the layout structure changes
- Tier pages (Growth, Launch, Market) will keep their pricing info but present it within the About Us layout framework (stats grid can show price, included features count, etc.)
- Pages with contact form dialogs (Jobs, Estimating, etc.) will keep that functionality but integrate the trigger buttons into the standardized CTA section

## Execution Order
All 14 pages will be updated in parallel since they are independent files with no cross-dependencies.
