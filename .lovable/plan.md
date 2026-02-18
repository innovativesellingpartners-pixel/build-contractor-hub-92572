

# Business Suite Module Pages

## Overview
Each of the 9 module cards on the Business Suite page will link to its own dedicated, branded landing page. Some pages already exist (Training, CRM, Leads) and need route connections. Others need to be created from scratch (Accounting, Communication). All pages will follow the same proven layout template used by Training and CRM pages, and will include placeholder screenshot sections for CRM module screenshots.

## Current State
- **Already have pages AND routes**: Training, CRM, Leads
- **Have pages but missing `/business-suite/` routes**: Estimating, Jobs, Voice AI, Reporting
- **No page exists at all**: Accounting, Communication

## What Will Be Built

### 1. New Feature Pages (2 new pages)

**Accounting** (`src/pages/features/Accounting.tsx`)
- Hero with badge, headline, stats (e.g., "Save 10+ hrs/week", "Real-Time P&L")
- Two-column story section describing financial tracking, job costing, expense management
- Screenshot placeholder sections showing accounting dashboard, invoice views, profit reports
- Features grid: Invoice Management, Expense Tracking, Job Costing, Profit & Loss, Payment Processing, Tax Reports, Budget Tracking, Financial Dashboards
- CTA section

**Communication** (`src/pages/features/Communication.tsx`)
- Hero with badge, headline, stats (e.g., "Unified Inbox", "100% Message Capture")
- Two-column story section about centralized communication
- Screenshot placeholder sections showing email integration, call logs, message threads
- Features grid: Email Integration, Call Tracking, SMS/Text, Message Templates, Auto Follow-ups, Communication History, Team Messaging, Customer Portal
- CTA section

### 2. Screenshot Sections
Each page (new and existing) will include a dedicated "See It In Action" section with bordered, rounded screenshot placeholder areas. These will use styled div containers with descriptive labels where actual CRM screenshots can be dropped in later. This keeps the pages ready for real screenshots without blocking the launch.

### 3. Route Updates (`src/App.tsx`)
Add missing `/business-suite/` routes:
- `/business-suite/accounting` -> Accounting
- `/business-suite/estimating` -> Estimating
- `/business-suite/jobs` -> Jobs
- `/business-suite/communication` -> Communication
- `/business-suite/voice-ai` -> VoiceAI
- `/business-suite/reporting` -> Reporting

### 4. Branding Consistency
Every page will use:
- `MainSiteHeader` component (with CT1 logo)
- `PublicFooter` component
- `FloatingTrialButton`
- Hero background image with backdrop-blur overlay
- CT1 primary color accents
- Same card styling (`card-ct1` class)
- Badge components for section labels
- Consistent CTA section with "Get Started Today" and "Contact Us" buttons

## Technical Details

### Files to Create
- `src/pages/features/Accounting.tsx`
- `src/pages/features/Communication.tsx`

### Files to Modify
- `src/App.tsx` - Add 6 new route entries and imports
- `src/pages/features/Estimating.tsx` - Add screenshot showcase section
- `src/pages/features/Jobs.tsx` - Add screenshot showcase section
- `src/pages/features/VoiceAI.tsx` - Add screenshot showcase section
- `src/pages/features/Reporting.tsx` - Add screenshot showcase section
- `src/pages/features/Training.tsx` - Add screenshot showcase section
- `src/pages/features/CRM.tsx` - Add screenshot showcase section

### Page Template Structure
Each page follows this section order:
1. Header (MainSiteHeader)
2. Hero Section (background image, badge, h1, subtitle, 4 stat cards)
3. Two-Column Story (text left, feature mini-cards right)
4. Screenshot Showcase ("See It In Action" - 2-3 bordered screenshot placeholders with captions)
5. Features Grid (8 feature cards in 4-column layout)
6. CTA Section (gradient background, heading, two buttons)
7. Footer (PublicFooter)

