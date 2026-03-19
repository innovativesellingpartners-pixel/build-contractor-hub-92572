

# Automatic Estimate Translation for Customer Delivery

## Overview
When a contractor sends an estimate, the system will automatically translate all free-text fields into the customer's preferred language before delivery. The contractor's original version remains untouched. This builds on the existing translation infrastructure (edge function, glossary, `TranslationPreviewDialog`).

## What Already Exists
- `translate-document` edge function (Lovable AI + construction glossary)
- `useDocumentTranslation` hook
- `TranslationPreviewDialog` component (manual translate button on estimate detail)
- `preferred_language` field on `profiles` table
- `preferred_language` field on `customers` table
- `trade_specific` JSONB field on estimates (already stores `translated_content`)

## Plan

### 1. Database: Add translation storage to estimates
Migration to add columns to `estimates`:
- `translated_content` (JSONB) -- stores translated field values keyed by field name
- `translated_language` (text) -- e.g. "en"
- `original_language` (text) -- e.g. "es"
- `translated_at` (timestamptz)

This replaces the current approach of nesting inside `trade_specific`.

### 2. Update `send-estimate` edge function
Before sending the email:
1. Fetch the contractor's `preferred_language` from `profiles`
2. Fetch the customer's `preferred_language` from `customers` (default "en") or use a new `customer_language` field on the estimate itself
3. If languages differ, call the `translate-document` function internally (or inline the same AI gateway logic) to translate: `title`, `description`, `project_description`, `scope_objective`, `assumptions_and_exclusions`, all line item descriptions, `terms_payment_schedule`, `warranty_text`, and `notes`
4. Store the translated content on the estimate record (`translated_content`, `translated_at`, etc.)
5. Use the translated text in the email HTML instead of originals
6. If translation fails, return an error -- never send a half-translated estimate

### 3. Update `PublicEstimate.tsx` (customer-facing page)
When rendering the public estimate page:
- Check if `translated_content` exists on the estimate
- If yes, display translated values for all text fields (title, description, line items, scope, terms, etc.)
- Keep all numbers, dates, amounts, names, addresses unchanged
- Add a small "Translated from Spanish" note at the bottom

### 4. Update `generate-estimate-pdf` edge function
- Same logic: if `translated_content` exists, use translated text in the PDF output
- Keep amounts, dates, names unchanged

### 5. UI: Add "Customer Language" to estimate detail/form
- On `EstimateDetailViewBlue.tsx`, add a "Customer Language" dropdown (English/Spanish) that saves to the estimate record (new `customer_language` column, default "en")
- On `EstimateBuilder.tsx`, add the same dropdown in the form
- Show a "Translated to English" badge on the estimate card/detail when `translated_at` is set

### 6. Auto-translate on Send flow
Modify `handleSendEstimate` in `EstimatesSection.tsx` and the `send-estimate` edge function:
- When contractor clicks Send, if contractor language != customer language:
  1. Call translate-document to get translations
  2. Show `TranslationPreviewDialog` with the results so contractor can review/edit
  3. On confirm, save translated content and proceed with send
  4. On cancel, abort send
- If languages match, send directly (no translation step)

### 7. SMS send flow
Same pattern for `send-estimate-sms`: use translated content if available.

## Technical Details

**New estimate columns** (migration):
```sql
ALTER TABLE estimates ADD COLUMN customer_language text DEFAULT 'en';
ALTER TABLE estimates ADD COLUMN translated_content jsonb;
ALTER TABLE estimates ADD COLUMN original_language text;
ALTER TABLE estimates ADD COLUMN translated_language text;
ALTER TABLE estimates ADD COLUMN translated_at timestamptz;
```

**Fields to translate** (text only, never amounts/dates/names):
- `title`, `description`, `project_description`, `scope_objective`
- `assumptions_and_exclusions`, `warranty_text`, `terms_payment_schedule`
- Each line item's `description` / `item_description`
- `notes`

**Fields never translated**: `client_name`, `client_email`, `client_phone`, `client_address`, `site_address`, amounts, quantities, dates, estimate number, contractor info.

**Send flow change**: The translation preview dialog intercepts the send action when languages differ, requiring contractor approval before sending.

**Caching**: Once translated and stored on the estimate, resending reuses the stored translation unless content has changed (compare a hash of translatable fields).

## Files to Create/Edit
- **Create**: Migration for new estimate columns
- **Edit**: `supabase/functions/send-estimate/index.ts` -- use translated content in email
- **Edit**: `src/pages/PublicEstimate.tsx` -- render translated content
- **Edit**: `src/components/contractor/crm/sections/EstimatesSection.tsx` -- intercept send with translation preview
- **Edit**: `src/components/contractor/crm/sections/EstimateDetailViewBlue.tsx` -- add customer language dropdown, translated badge, update translation dialog flow
- **Edit**: `src/components/contractor/crm/EstimateBuilder.tsx` -- add customer language dropdown
- **Edit**: `supabase/functions/generate-estimate-pdf/index.ts` -- use translated content in PDF

