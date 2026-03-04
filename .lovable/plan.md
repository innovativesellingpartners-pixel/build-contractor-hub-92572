

# Vapi Assistant Sync Controller — Full Implementation Plan

## Overview

Build a structured prompt builder that enforces the required Vapi-compatible template sections, and a Forge sync edge function that pushes updated prompts after save.

## What Changes

### 1. Structured Prompt Generator Utility

Create `src/lib/generateVapiPrompt.ts` — a pure function that takes contractor AI profile fields and assembles a Vapi-compatible system prompt with all required sections:

- **Identity** — "You are Sarah, the professional receptionist for {Business Name}, a {Trade} contractor."
- **Business Context** — business description, services offered, service area
- **Trade Context** — trade type, services not offered
- **Call Handling Behavior** — gather caller info, qualify leads, book appointments, escalate emergencies
- **Tone Rules** — warm, confident, professional, never robotic, never mention AI
- **Qualification Logic** — pulled from `custom_instructions` field
- **Transfer / Escalation Rules** — forward to contractor phone when requested
- **Guardrails** — no legal advice, no price guessing, keep responses short

This function will be called on save to generate the final `custom_instructions` value from the individual profile fields, replacing the raw freeform textarea approach.

### 2. Update Admin VoiceAISettings.tsx

Replace the raw "Assistant Prompt" textarea (lines 484-496) with:
- A read-only preview of the generated prompt (collapsible)
- The prompt auto-generates from the existing form fields (business name, trade, services, etc.)
- An optional "Custom Qualification Instructions" textarea for the one customizable section
- A "Regenerate Prompt" button that rebuilds from current field values
- On save, the structured prompt is generated and stored in `custom_instructions`

### 3. Update Contractor ForgeSettings.tsx

Similarly replace the "Custom Instructions" textarea:
- Show the auto-generated prompt as a read-only preview
- Allow editing only the qualification/custom instructions section
- On save, regenerate the full structured prompt

### 4. New Edge Function: `forge-prompt-sync`

Create `supabase/functions/forge-prompt-sync/index.ts`:
- Accepts `{ contractor_id }` with auth (CT1_INTERNAL_API_KEY or user JWT)
- Reads the contractor's AI profile from `contractor_ai_profiles`
- Generates the structured prompt server-side
- Calls Forge's sync endpoint to PATCH the Vapi assistant:
  - Updates only `model.messages[0].content` 
  - Updates `firstMessage` to `"Hi, this is Sarah with {Business Name}."`
  - Preserves voice, tools, speaking plans
- Returns success/failure status

### 5. Trigger Sync on Save

In both `VoiceAISettings.tsx` (admin) and `ForgeSettings.tsx` (contractor), after successful database save, invoke `forge-prompt-sync` edge function with the contractor ID.

### 6. Database Column (Optional Addition)

Add a `qualification_instructions` text column to `contractor_ai_profiles` to separately store the contractor's custom qualification logic (the only editable prompt section). This keeps it distinct from the auto-generated `custom_instructions`. Requires a migration.

## Architecture Flow

```text
Contractor edits profile fields
       ↓
Save → generate structured prompt → store in DB
       ↓
Invoke forge-prompt-sync edge function
       ↓
Edge function reads profile → builds prompt
       ↓
POST to Forge sync endpoint
       ↓
Forge PATCHes Vapi assistant
  (model.messages[0].content + firstMessage only)
       ↓
Assistant behavior updates live
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/generateVapiPrompt.ts` | Create — prompt template builder |
| `src/components/admin/VoiceAISettings.tsx` | Modify — structured prompt UI + sync call |
| `src/components/contractor/forge/ForgeSettings.tsx` | Modify — structured prompt UI + sync call |
| `supabase/functions/forge-prompt-sync/index.ts` | Create — Forge/Vapi sync endpoint |
| DB migration | Add `qualification_instructions` column |

## Sync Endpoint Details

The edge function will need `CT1_INTERNAL_API_KEY` and `CT1_API_BASE_URL` secrets (both already configured) to authenticate with the Forge platform.

## Guardrails Enforced

- Contractors cannot remove required sections
- Identity name ("Sarah") is fixed
- Greeting format is fixed: `"Hi, this is Sarah with {Business Name}."`
- No raw JSON injection
- No tool instruction modification
- Prompt is always regenerated from structured fields, never freeform edited

