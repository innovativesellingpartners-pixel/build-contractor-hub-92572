

# Redesign "What We Do" into "About Us"

## Overview
Transform the current What We Do page into a comprehensive About Us page with a contractor hero image background, updated content from the provided messaging, and rename the navigation tab from "What We Do" to "About Us." The light theme will be maintained throughout.

## Content Changes
The entire page content will be replaced with the provided myCT1 messaging, organized into these sections:
1. **Hero** with contractor hero image background (`hero-construction.jpg`), CT1 logo, and headline "Your Complete Business Command Center"
2. **Why Contractors Choose myCT1** section with detailed value proposition
3. **More Than Software** section listing inclusions (training, certifications, leads, insights, marketplace)
4. **A Nationwide Network** section with the closing message
5. **CTA** section to drive signups/demos

No dashes or emdashes will be used anywhere in the copy.

## Navigation Rename
All references to "What We Do" will be renamed to "About Us" in:
- `MainSiteHeader.tsx` (desktop nav link text)
- `MobileNav.tsx` (mobile nav link text)
- `NewLandingPage.tsx` (footer link text)
- `ForConsumers.tsx` (nav link text)

The route will remain `/what-we-do` (or optionally `/about-us`) to avoid breaking existing links.

## Visual Design
- **Hero background**: Use `hero-construction.jpg` with a light semi-transparent overlay to keep the light theme while showing the contractor imagery
- **CT1 logo** (`ct1-round-logo-new.png`) prominently placed in the hero
- Cards with the existing modern tech aesthetic (12-16px rounded corners, subtle shadows, soft borders)
- The "More Than Software" inclusions rendered as icon cards in a grid
- Light color palette maintained throughout (no dark sections)

## Technical Details

### Files Modified

1. **`src/pages/WhatWeDo.tsx`** (full rewrite)
   - Replace hero gradient background with `hero-construction.jpg` using a white/light overlay
   - Add CT1 round logo in hero
   - Replace all body content with the provided messaging sections
   - Use Lucide icons (GraduationCap, Award, Target, BarChart3, ShoppingBag) for the "More Than Software" feature cards
   - Keep existing imports for MainSiteHeader, FloatingTrialButton, Card, CardContent, Button, Link

2. **`src/components/MainSiteHeader.tsx`** (line 46)
   - Change link text from "What We Do" to "About Us"

3. **`src/components/MobileNav.tsx`** (link text change)
   - Change "What We Do" to "About Us"

4. **`src/components/NewLandingPage.tsx`** (footer link text)
   - Change "What We Do" to "About Us"

5. **`src/pages/ForConsumers.tsx`** (nav link text)
   - Change "What We Do" to "About Us"

### No route changes needed
The `/what-we-do` route path stays the same to preserve any existing links. Only the displayed label changes.
