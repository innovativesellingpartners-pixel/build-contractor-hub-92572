

# Rename All Remaining "Pocketbot" References to "Pocket Agent"

## Summary
There are still **349 references** to "Pocketbot" / "Pocket Bot" / "PocketBot" across **15 files** that were missed in the initial rename. This plan covers renaming all of them.

## Files to Update

### Component Files (user-facing text + variable names)

1. **`src/components/contractor/Pocketbot.tsx`** - The main Pocket Agent component
   - Rename export `Pocketbot` to `PocketAgent`
   - Update greeting text: "CT1 Pocketbot" to "CT1 Pocket Agent"
   - Update toast messages ("sign in to use the Pocketbot", "CT1 Pocketbot subscription")
   - Update all UI headings ("CT1 Pocketbot" titles)

2. **`src/components/contractor/FloatingPocketbot.tsx`** - Floating chat widget
   - Rename export `FloatingPocketbot` to `FloatingPocketAgent`
   - Rename interface `FloatingPocketbotProps` to `FloatingPocketAgentProps`
   - Update localStorage keys: `ct1_pocketbot_prompts` to `ct1_pocket_agent_prompts`, `ct1_pocketbot_position` to `ct1_pocket_agent_position`
   - Update all UI text referencing "Pocketbot"
   - Keep the `pocketbot_full_access` database column reference as-is (database column name)

3. **`src/components/GlobalPocketbot.tsx`** - Global floating button
   - Rename export `GlobalPocketbot` to `GlobalPocketAgent`
   - Update state variables: `showPocketbot` to `showPocketAgent`
   - Update comments

4. **`src/components/Dashboard.tsx`** - Main dashboard
   - Update import path to use renamed components
   - Rename state: `pocketbotOpen` to `pocketAgentOpen`, `pocketbotPosition` to `pocketAgentPosition`
   - Update aria-label: "Open CT1 Pocketbot" to "Open CT1 Pocket Agent"
   - Update all handler references

5. **`src/components/contractor/crm/CT1CRM.tsx`** - CRM component
   - Rename prop `onOpenPocketbot` to `onOpenPocketAgent`

6. **`src/components/contractor/PersonalTasks.tsx`** - Tasks component
   - Update text: 'say "Add a task" in Pocketbot' to 'say "Add a task" in Pocket Agent'
   - Update aria-label: "Created via Pocketbot" to "Created via Pocket Agent"
   - Keep `source === 'pocketbot'` check (database value)

7. **`src/components/admin/UserManagement.tsx`** - Admin user management
   - Update label text: "Full Pocketbot Access" to "Full Pocket Agent Access"
   - Update description text
   - Keep `pocketbot_full_access` field references (database column)

8. **`src/components/admin/VoiceAISettings.tsx`** - Voice AI settings
   - Update placeholder/default `voice_id` from `'pocketbot'` to `'pocket-agent'`

9. **`src/components/Marketplace.tsx`** - Marketplace
   - Update text: "PocketBots handle routine tasks" to "Pocket Agents handle routine tasks"

10. **`src/components/admin/PocketbotAccessManagement.tsx`** - Admin access management
    - Rename component and update all UI text from "Pocketbot" to "Pocket Agent"

### Page Files

11. **`src/pages/Pricing.tsx`** - Pricing page
    - Update "Pocket Bot" to "Pocket Agent" in feature lists
    - Update add-on id from `"pocketbot"` to `"pocket-agent"`

12. **`src/pages/Subscribe.tsx`** - Subscribe page
    - Update "Pocket Bot" to "Pocket Agent" in feature descriptions

13. **`src/pages/BotSignup.tsx`** - Bot signup page
    - Update any remaining "Pocketbot" references

### App Router

14. **`src/App.tsx`** - Main app routes
    - Update import for renamed `GlobalPocketbot` to `GlobalPocketAgent`

### Edge Function

15. **`supabase/functions/pocketbot-chat/index.ts`** - Backend function
    - Update system prompt text from "Pocketbot" to "Pocket Agent" (the function name/path stays `pocketbot-chat` since renaming edge function paths is a breaking change)

## What Will NOT Change (Database References)
- The database column `pocketbot_full_access` in the `profiles` table stays as-is (renaming DB columns is risky and the column name is internal)
- The `types.ts` file is auto-generated and cannot be edited
- The edge function URL path `/pocketbot-chat` stays the same (renaming would break existing calls)
- The `source === 'pocketbot'` check in PersonalTasks stays to match existing database values

## Execution
All 15 files will be updated in parallel since they are independent.
