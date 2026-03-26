

# Update Help Center & AI Agents with New Feature Documentation

## Summary
Three AI systems need updated knowledge about the 8 features built today: the **Help Chatbot** (help-chatbot edge function), the **Chat With Us** agent (chat-with-us edge function), and the **Pocket Agent** (pocketbot-chat edge function). Additionally, new knowledge base entries should be seeded into the `knowledge_base_entries` table so the search-based knowledge retrieval picks them up automatically.

## Current State
- **help-chatbot**: Has a large hardcoded system prompt with CT1 platform knowledge (lines 66–261). Missing all 8 new features.
- **chat-with-us**: Has a brief system prompt (lines 32–60) with high-level CT1 description. Missing new features.
- **pocketbot-chat**: Has the most comprehensive system prompt (lines 468–696) covering CRM, trades, estimating, etc. Missing all 8 new features.
- All three also query `knowledge_base_entries` and `help_articles` via `search_knowledge` RPC for dynamic context. Seeding entries there ensures even future questions get grounded answers.

## Plan

### 1. Seed knowledge base entries for all new features
Insert ~8-10 entries into `knowledge_base_entries` via a database migration, covering:
- **Customer Review & Reputation Management** — how to send review requests, monitor ratings, Google Review redirect for 4-5 stars, public review page
- **Profit Margin & Job Costing Alerts** — how alerts trigger, threshold levels (warning/over-budget/critical), notification bell, job cost tracker
- **Subcontractor & Vendor Portal** — adding subs/vendors, assigning subs to jobs, bid comparison, insurance tracking
- **Multi-User Team Access** — creating team members, role-based permissions, permission matrix, how sub-users see owner's data
- **Business Performance Scorecard** — KPI dashboard, metrics explained, date range filters, action items
- **AI Material Estimating** — how to use AI estimate generation
- Each entry will have: `title`, `content` (detailed markdown with step-by-step instructions), `category`, `keywords[]`, `is_active: true`

### 2. Update help-chatbot system prompt
Add new sections to the comprehensive platform knowledge block (after line ~237 "More Menu"):
- **Reviews & Reputation** section
- **Profit Margin & Job Cost Alerts** section
- **Subcontractors & Vendors** section
- **Team Management & Sub-Users** section
- **Business Performance Scorecard** section
- **AI Estimate Assistant** section
- Update the **Navigation** section to include new tabs (Reviews, Subs & Vendors, Team, Scorecard)
- Update **Common Workflows** with new workflows (send review request, check job margins, add sub to job, invite team member, view scorecard)

### 3. Update chat-with-us system prompt
Add a comprehensive feature list to the "About CT1" section (lines 40-45) that includes all new features so the public-facing chat agent can discuss them accurately when prospects ask.

### 4. Update pocketbot-chat system prompt
Add to the "CT1 PLATFORM KNOWLEDGE" section (after line ~512 area):
- **REVIEWS & REPUTATION MANAGEMENT** block
- **JOB COST ALERTS & PROFIT MONITORING** block
- **SUBCONTRACTORS & VENDORS** block
- **TEAM MANAGEMENT (Sub-Users)** block
- **BUSINESS SCORECARD** block
- Update the DASHBOARD & CRM section references to mention new nav items

### 5. Verify knowledge search integration
The `search_knowledge` RPC already searches both `help_articles` and `knowledge_base_entries` by keyword matching. The seeded entries in step 1 will automatically surface in all three AI agents since they all call this RPC before generating responses.

## Technical Details

- **Migration SQL**: Will use `INSERT INTO public.knowledge_base_entries (title, content, category, keywords, is_active, source)` for ~8-10 comprehensive entries
- **Edge function edits**: 3 files modified — `help-chatbot/index.ts`, `chat-with-us/index.ts`, `pocketbot-chat/index.ts`
- System prompt additions are ~200-300 lines total across the 3 functions
- No new tables, no schema changes, no new dependencies

## Files to Create/Edit
- `supabase/migrations/[timestamp]_seed_new_feature_knowledge.sql` (new)
- `supabase/functions/help-chatbot/index.ts` (edit system prompt)
- `supabase/functions/chat-with-us/index.ts` (edit system prompt)
- `supabase/functions/pocketbot-chat/index.ts` (edit system prompt)

