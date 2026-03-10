

## Problem

The `section-cta` class uses `--gradient-black` for its background, but in **light mode** that variable is defined as a near-white gradient (`hsl(210 20% 98%)` to `hsl(210 16% 94%)`). The text is `text-primary-foreground` (white), making everything invisible.

Three issues in this section:
1. **"Ready to One-Up Your Business?"** — white text on light gray background
2. **"Start Building Today" button** — `bg-background text-primary` with no border, looks like floating text
3. **"Explore The Network" button** — `border-background text-background` = white border/text on light gray

## Fix

**1. Fix `--gradient-black` in light mode** (src/index.css, line 85)

Change the light-mode `--gradient-black` to an actual dark gradient so the CTA section has a dark background in both modes:

```css
--gradient-black: linear-gradient(135deg, hsl(220 14% 12%), hsl(220 14% 18%));
```

This makes the section dark in both light and dark mode, which is the intended design (it's a CTA section meant to stand out). The existing white text, white-bordered buttons, and white-background "Start Building Today" button will all become visible.

**2. Add visible border to "Start Building Today" button** (src/components/NewLandingPage.tsx, line 663)

Add `border-2 border-primary` so it reads as a clickable button even on varied backgrounds.

No other files need changes. The `text-primary-foreground` on the heading/paragraph, and `border-background text-background` on "Explore The Network" will all work correctly once the background is dark.

