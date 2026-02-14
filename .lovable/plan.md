

# Redesign App Install Page with Step-by-Step Visual Instructions

## What Changes

Rebuild the `/app-install` page to match the clean, card-based step-by-step layout shown in the Coursiv reference screenshots. The current page uses a numbered list inside a card -- the new design will use individual visual step cards with relevant icons, platform-specific instructions, and a prominent "Got it" button.

## Design

The page will feature:
- CT1 logo and a headline like "Add CT1 to Your Home Screen"
- A subtitle: "You can use CT1 like a regular app. Please follow these quick and easy steps below:"
- A phone mockup image placeholder on the right (decorative, using the CT1 logo)
- Individual step cards, each with a colored icon on the left and bold title + description on the right
- A completion message at the bottom with CT1 branding: "Done! You can now open CT1 anytime from your Home Screen"
- A full-width "Got it" button that navigates back to the dashboard
- Platform detection (iOS Safari, Android Chrome, Desktop Chrome/Edge, Mac Safari) with tailored steps for each

### Platform-Specific Steps

**iOS (Safari)**
1. Tap the Share icon (square with arrow) -- show share icon
2. Scroll down and tap "Add to Home Screen" -- show plus-in-box icon
3. Tap "Add" in the top right corner -- show Add badge

**Android (Chrome)**
1. Tap the three-dot menu icon -- show ellipsis icon
2. Tap "Install app" or "Add to Home screen" -- show download icon
3. Tap "Install" -- show check icon

**Desktop (Chrome/Edge)**
1. Look for the install icon in the address bar -- show monitor icon
2. Click "Install" -- show download icon
3. CT1 will open as a standalone app -- show check icon

**Mac (Safari)**
1. Click File in the menu bar -- show menu icon
2. Click "Add to Dock" -- show plus icon
3. CT1 will appear in your Dock -- show check icon

## Technical Details

### File to Modify
- `src/pages/AppInstall.tsx` -- Complete redesign with new layout

### Implementation
- Detect platform (iOS, Android, Mac Safari, Desktop Chrome/Edge) using user agent
- Render step cards using a mapped array of `{ icon, title, description }` per platform
- Each step card: rounded border, icon circle on the left, bold title + muted description on the right
- Use Lucide icons: `MoreHorizontal`, `Share`, `PlusSquare`, `Download`, `Monitor`, `Menu`, `CheckCircle`
- "Got it" button at the bottom styled as a full-width primary button
- Keep existing `beforeinstallprompt` logic for browsers that support native install prompts
- Already-installed detection remains unchanged
- Responsive: looks great on mobile (primary use case) and desktop
