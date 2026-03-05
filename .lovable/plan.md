

# CT1 Knowledge Base & AI-Powered Help System

## Current State

You already have the foundation:
- **34 published help articles** in `help_articles` table across 14 categories
- **HelpAdmin** panel for managing articles (create/edit/publish)
- **Help Chatbot** (`help-chatbot` edge function) that searches articles via basic `ilike` text matching and feeds results as context to the AI
- **Chat With Us** public bot (`chat-with-us` edge function) — has NO knowledge base access, only a hardcoded system prompt

### Problems
1. **Search is basic** — `ilike` text matching misses semantic queries like "how do I send an estimate" when the article says "email a proposal"
2. **Chat With Us bot is blind** — no access to your knowledge base at all
3. **No sales training content** — the system only has platform how-to articles, no sales methodology, objection handling, closing techniques
4. **No content scoping** — nothing prevents the AI from going off-topic (politics, etc.)
5. **No way to bulk-add training content** — admins must create articles one at a time

## Plan

### 1. New Database Table: `knowledge_base_entries`

A dedicated table for sales training content, platform tips, and FAQ entries that supplements `help_articles`:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `category` | enum | `platform_howto`, `sales_training`, `objection_handling`, `scripts`, `faq`, `best_practices` |
| `title` | text | Entry title |
| `content` | text | Full content (markdown) |
| `keywords` | text[] | Search keywords for better matching |
| `tags` | text[] | Filterable tags |
| `is_active` | boolean | Whether included in AI context |
| `created_by` | uuid | Admin who created it |
| `created_at` / `updated_at` | timestamps | Standard |

RLS: Super admins can CRUD. Authenticated users can read active entries.

### 2. Unified Knowledge Search Function

Create a database function `search_knowledge(query text)` that searches BOTH `help_articles` and `knowledge_base_entries` using:
- `ilike` on title, content, excerpt
- Keyword array matching (`&&` operator on `keywords` column)
- Ranked results with relevance scoring

This replaces the basic `ilike` in the chatbot.

### 3. Update `help-chatbot` Edge Function

- Call the new unified search function instead of raw `ilike`
- Expand the system prompt to include sales training context
- Add strict guardrails: "Only answer questions about the CT1 platform, contractor business practices, and sales techniques. Do not discuss politics, religion, or topics unrelated to contracting and CT1."
- Increase `max_tokens` from 500 to 800 for more detailed answers

### 4. Update `chat-with-us` Edge Function

- Add knowledge base search before calling the AI (same pattern as help-chatbot)
- Inject matching articles/entries as context so Sarah can reference actual platform docs
- Add the same content guardrails

### 5. Admin Knowledge Base Manager UI

New tab in `HelpAdmin.tsx` called "Knowledge Base":
- Table view of all entries with category filter
- Create/edit/delete entries with markdown editor
- Bulk import via CSV/paste (title, category, content per row)
- Toggle active/inactive
- Preview how the AI would use the entry

### 6. Pre-Seed Sales Training Content

Insert ~20 starter entries covering:
- How to send an estimate (step-by-step)
- How to follow up on a lead
- Objection handling scripts ("too expensive", "need to think about it")
- How to use the CRM pipeline effectively
- How to read reports and improve close rate
- Common feature walkthroughs

## Files to Create/Modify

| File | Action |
|------|--------|
| DB migration | Create `knowledge_base_entries` table + `search_knowledge` function |
| `supabase/functions/help-chatbot/index.ts` | Update search + guardrails |
| `supabase/functions/chat-with-us/index.ts` | Add knowledge base search + guardrails |
| `src/components/admin/HelpAdmin.tsx` | Add "Knowledge Base" tab |
| `src/components/admin/KnowledgeBaseManager.tsx` | New — CRUD UI for KB entries |
| `src/components/help/HelpChatbot.tsx` | Update to use unified search |
| DB seed data | Insert starter sales training entries |

## How It Works End-to-End

```text
Contractor asks: "How do I send an estimate?"
        ↓
Search knowledge_base_entries + help_articles
        ↓
Finds: "Sending an Estimate" article + "Estimate Follow-Up Script" training entry
        ↓
AI receives both as context + strict guardrails
        ↓
AI responds with step-by-step instructions from YOUR content
        ↓
Off-topic questions get: "I can only help with CT1 and contracting topics"
```

## Guardrails

- AI system prompts explicitly restrict to CT1 platform, contracting, and sales topics only
- No politics, no medical advice, no legal advice, no unrelated topics
- All answers grounded in knowledge base content when available
- Fallback to "contact support" when no matching content exists

