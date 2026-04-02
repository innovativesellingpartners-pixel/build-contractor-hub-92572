

# Two Code-Only Changes

## Change 1: Migrate useLeads to React Query

Rewrite `src/hooks/useLeads.ts` to use `useQuery` and `useMutation` from `@tanstack/react-query`, matching the `useEstimates.ts` pattern:

- **Leads query**: `useQuery({ queryKey: ['leads', user?.id], ... })` with the existing `.is('archived_at', null).is('converted_to_job_id', null)` filters. `enabled: !!user?.id`.
- **Sources query**: Separate `useQuery({ queryKey: ['lead-sources'], ... })`.
- **Mutations** (`addLead`, `updateLead`, `deleteLead`, `archiveLead`, `duplicateLead`, `updateLeadStatus`, `convertToCustomer`): Each becomes a `useMutation` that invalidates `['leads']` on success and shows toast via `sonner`.
- **Exported interface stays identical**: `leads`, `sources`, `loading`, `addLead`, `updateLead`, `deleteLead`, `updateLeadStatus`, `convertToCustomer`, `archiveLead`, `duplicateLead`, `refreshLeads`. Mutation functions are exposed via `.mutateAsync` so callers that `await` them continue to work. `refreshLeads` maps to `queryClient.invalidateQueries({ queryKey: ['leads'] })`.

No other files change. All existing consumers continue working without modification.

## Change 2: Remove jsPDF from pocketbot-chat

In `supabase/functions/pocketbot-chat/index.ts`:

1. **Remove** line 3: `import { jsPDF } from "npm:jspdf@2.5.2";`
2. **Remove** lines 11-47: the `generatePDF` function definition.
3. **Remove** lines 199-228: the `generate_pdf` tool definition from the `tools` array.
4. **Remove** lines 789-804: the `if (name === "generate_pdf") { ... }` handler block inside the tool call loop.

All other logic (chat response, other tool handlers, rate limiting) remains untouched.

## Files Modified
- `src/hooks/useLeads.ts` — full rewrite to React Query
- `supabase/functions/pocketbot-chat/index.ts` — remove jsPDF import, generatePDF function, generate_pdf tool definition, and its call-site handler

