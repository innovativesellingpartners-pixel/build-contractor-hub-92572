# Asset Audit — src/assets/ images > 50 KB (excluding SVGs)

Generated: 2026-04-02

## Criteria
- Files in `src/assets/` larger than 50 KB
- Excludes `.svg` files
- Notes whether the file is imported by a component (logo/branding files are flagged but included)

---

## Imported Assets (used in components)

| File | Size | Imported By |
|------|------|-------------|
| `ct1-round-logo-new.png` | 1,689 KB | CoursePlayer, TrainingHub, TrainingModulePage, AdminLayout, AdminSidebar, ContractorOnboarding, QuickBooksIntegration, BackNavigation, BottomNav, CT1CRM, CrmNavHeader, GeneratePortalLinkDialog, ProvenJobsTheme, BlogPodcast, ForConsumers, PaymentSuccess, PublicChangeOrder, WhatWeDo, ContractorCRMGuide |
| `ct1-onboarding-logo.png` | 1,689 KB | ContractorOnboarding |
| `ct1-powered-by-logo.png` | 1,558 KB | CustomerPortal, PublicEstimate |
| `contractor-icon.png` | 1,420 KB | UserManagement |
| `forgeailogo.png` | 221 KB | CallsSection |
| `forgeailogo2.png` | 123 KB | CallsSection |
| `podcast-thumbnail.png` | 1,022 KB | BlogPodcast |
| `joe-cipriano.png` | 422 KB | CoreValues, ForConsumers |
| `hero-crm-business.jpg` | 396 KB | CoreValues, ContractorCRMGuide |
| `hero-construction-aerial.jpg` | 347 KB | TradesWeServe |
| `hero-construction.jpg` | 168 KB | WhatWeDo |
| `training-video-thumbnail.png` | 95 KB | TrainingHub |
| `training-process.jpg` | 73 KB | TrainingHub |
| `training-selling.jpg` | 72 KB | TrainingHub |
| `training-communication.jpg` | 69 KB | TrainingHub |
| `training-leadership.jpg` | 59 KB | TrainingHub |
| `training-performance.jpg` | 55 KB | TrainingHub |

## Unused Assets > 50 KB (not imported by any component)

| File | Size |
|------|------|
| `ct1-header-logo.png` | 2,233 KB |
| `ct1-logo-main.png` | 1,685 KB |
| `ct1-logo-circle.png` | 1,544 KB |
| `ct1-round-logo.png` | 1,533 KB |
| `ct1-main-logo.png` | 1,489 KB |
| `ct1-chat-bubble.png` | 1,406 KB |
| `constructeam-logo-circle.png` | 702 KB |
| `constructeam-ct1-logo.png` | 702 KB |
| `llc-hero-bg.jpg` | 390 KB |
| `hero-tech-dashboard.jpg` | 218 KB |
| `hero-training-platform.jpg` | 205 KB |
| `hero-jobs-management.jpg` | 175 KB |
| `hero-accounting-finance.jpg` | 175 KB |
| `hero-estimating-software.jpg` | 174 KB |
| `hero-reporting-dashboard.jpg` | 169 KB |
| `hero-voice-ai.jpg` | 166 KB |
| `hero-communication-hub.jpg` | 158 KB |
| `hero-home.jpg` | 153 KB |
| `constructeam-logo.png` | 152 KB |
| `hero-leads-generation.jpg` | 134 KB |
| `hero-crm-dashboard.jpg` | 130 KB |
| `screenshots/jobs-detail.jpg` | 101 KB |
| `screenshots/crm-customer-dashboard.jpg` | 85 KB |
| `screenshots/training-video-player.jpg` | 84 KB |
| `screenshots/estimating-builder.jpg` | 82 KB |
| `screenshots/crm-job-tracker.jpg` | 82 KB |
| `ct1-logo.png` | 78 KB |
| `screenshots/training-course-library.jpg` | 78 KB |
| `screenshots/reporting-job-profitability.jpg` | 74 KB |
| `screenshots/jobs-board.jpg` | 74 KB |
| `ct1-logo-color.png` | 72 KB |
| `screenshots/reporting-revenue-dashboard.jpg` | 71 KB |
| `screenshots/accounting-pnl.jpg` | 71 KB |
| `screenshots/leads-dashboard.jpg` | 70 KB |
| `screenshots/training-team-dashboard.jpg` | 64 KB |
| `screenshots/accounting-dashboard.jpg` | 61 KB |
| `screenshots/crm-pipeline-view.jpg` | 58 KB |
| `vonage-logo.png` | 57 KB |
| `screenshots/communication-timeline.jpg` | 55 KB |
| `screenshots/communication-followup.jpg` | 53 KB |
| `screenshots/jobs-scheduling.jpg` | 52 KB |
| `screenshots/leads-detail.jpg` | 51 KB |

## Summary

- **Total assets > 50 KB**: 58 files
- **Imported by components**: 17 files (~8.0 MB total)
- **Unused / not imported**: 41 files (~12.6 MB total)
- **Largest file**: `ct1-header-logo.png` (2.2 MB, unused)
- **Most-imported file**: `ct1-round-logo-new.png` (1.7 MB, 19 components)

## Recommendations

1. **Delete unused assets** — 41 files totaling ~12.6 MB are bundled but never imported.
2. **Move large hero/photo images to storage** — Hero backgrounds and photos (joe-cipriano, podcast-thumbnail, etc.) should be served from the CDN-backed storage bucket rather than bundled.
3. **Convert PNGs to WebP** — Logo PNGs are extremely large (1–2 MB each); WebP versions would be 50–90% smaller.
4. **Deduplicate logos** — Multiple near-identical CT1 logo variants exist; consolidate to 1–2 canonical versions.
