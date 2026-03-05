

## Plan: Comprehensive AI-Augmented Contractor Knowledge System

### Summary
Build an admin-controlled "AI Topic Rules" system that defines which contractor/trades topics the AI chatbots can answer on using external AI knowledge (beyond the internal knowledge base). When a user asks a question and the internal KB lacks a strong answer, the system falls back to AI — but only for admin-approved topics with configurable restrictions.

### What gets built

**1. New database table: `ai_topic_rules`**

Stores admin-defined topic categories the AI is allowed to draw external knowledge for.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| topic_name | text | e.g. "Roofing techniques", "OSHA safety regulations" |
| category | text | Grouping: trades, estimating, sales, project_management, business, materials, compliance |
| description | text | What this topic covers |
| custom_instructions | text | Guardrails/restrictions for this topic |
| is_enabled | boolean (default true) | Admin toggle |
| created_by | uuid FK profiles | |
| created_at / updated_at | timestamps | |

RLS: Read for authenticated, write restricted to admins via `has_role()`.

**2. Seed the table with a comprehensive starter set**

Pre-populate ~30-40 topic rules across categories, all enabled by default, covering:
- **Trades/Technical**: Electrical, plumbing, HVAC, roofing, concrete, framing, drywall, painting, flooring, landscaping, masonry, siding, windows/doors, insulation, demolition, excavation
- **Estimating**: Material takeoffs, labor costing, markup/margin, bid preparation, change order pricing
- **Project Management**: Scheduling, crew management, subcontractor coordination, punch lists, inspections, permitting
- **Sales**: Objection handling, closing techniques, follow-up strategies, proposal presentation, upselling
- **Business**: Licensing, insurance, bonding, cash flow, scaling, hiring, fleet management
- **Materials**: Pricing, sourcing, specifications, building codes, product comparisons
- **Customer Service**: Communication, dispute resolution, warranty management, reviews

Each entry includes custom_instructions restricting the AI from mentioning specific training brands/methodologies, keeping responses generic and practical.

**3. Admin UI: "AI Knowledge Topics" manager**

New tab inside the existing `HelpAdmin` component (alongside Articles and Knowledge Base tabs):
- Table view of all topics with toggle switches for enable/disable
- Add/edit/delete topics with name, category, description, and custom instructions
- Bulk enable/disable by category
- Clean, enterprise-grade card layout

**4. Update `help-chatbot` edge function**

After the knowledge base search, if results have low relevance (score below threshold):
1. Fetch enabled `ai_topic_rules` from database
2. Build a scoped system prompt: "You may ONLY answer on these topics: [list]. Follow these restrictions: [custom_instructions]"
3. Make the AI call with this augmented prompt
4. Label responses as "AI-assisted" vs "from knowledge base"

**5. Update `pocketbot-chat` edge function**

Same augmentation — fetch enabled topic rules and append them to the system prompt so Pocket Agent has a dynamically admin-controlled scope rather than the current hardcoded list.

### How the approval/restriction flow works
- Admin opens Help Center admin > "AI Knowledge Topics" tab
- Sees all pre-seeded topics organized by category
- Can toggle individual topics on/off before they go live
- Can add custom instructions per topic (e.g., "Do not recommend specific brand names for tools")
- Can add entirely new topics or remove ones that are irrelevant
- Changes take effect immediately — next chatbot query will use the updated rules

### Files to create/modify
- **New migration**: `ai_topic_rules` table + seed data + RLS policies
- **New component**: `src/components/admin/AITopicRulesManager.tsx`
- **Modify**: `src/components/admin/HelpAdmin.tsx` — add new tab for AI Topics
- **Modify**: `supabase/functions/help-chatbot/index.ts` — fetch topic rules, augment prompt
- **Modify**: `supabase/functions/pocketbot-chat/index.ts` — same augmentation

### Technical notes
- Uses existing Lovable AI gateway (no new API keys)
- Topic rules fetched server-side only — no client exposure
- No external training data ingestion needed — the AI models already have comprehensive trades/construction knowledge; the topic rules simply control what it's allowed to discuss
- The `search_knowledge` function continues to be the first source; AI augmentation is the fallback

