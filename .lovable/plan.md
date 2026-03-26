

# Migrate All Edge Functions to Origin-Restricted CORS

## Summary

Update all 113 edge functions under `supabase/functions/` to replace wildcard CORS (`Access-Control-Allow-Origin: *`) with the origin-restricted `buildCorsHeaders(req)` from `_shared/cors.ts`. No logic changes — CORS header references only.

## Two Patterns to Fix

**Pattern A (102 functions)** — Local `const corsHeaders = { ... }` block:
- Delete the local `const corsHeaders` declaration
- Add `import { buildCorsHeaders } from '../_shared/cors.ts';`
- Replace all `corsHeaders` usages with `buildCorsHeaders(req)`

**Pattern B (11 functions)** — Import from shared:
- Change `import { corsHeaders } from '../_shared/cors.ts'` → `import { buildCorsHeaders } from '../_shared/cors.ts'`
- Replace all `corsHeaders` usages with `buildCorsHeaders(req)`

## Replacement Rules (applied identically in every file)

| Before | After |
|---|---|
| `const corsHeaders = { ... };` | *(deleted)* |
| `import { corsHeaders } from '../_shared/cors.ts'` | `import { buildCorsHeaders } from '../_shared/cors.ts'` |
| `return new Response(null, { headers: corsHeaders })` | `return new Response(null, { headers: buildCorsHeaders(req) })` |
| `headers: { ...corsHeaders, 'Content-Type': ... }` | `headers: { ...buildCorsHeaders(req), 'Content-Type': ... }` |
| `{ headers: corsHeaders }` | `{ headers: buildCorsHeaders(req) }` |

## Important Notes

- `_shared/cors.ts` is NOT modified — it already has the correct `buildCorsHeaders` function
- `buildCorsHeaders(req)` requires the `req` parameter, which is available in every handler since all functions receive `req: Request`
- Some functions use `serve(async (req) => ...)`, others use `Deno.serve(async (req) => ...)` — both have `req` in scope
- Functions like `elevenlabs-stream-handler` and `twilio-stream-handler` that have CORS headers also get updated (CORS is separate from their OpenAI API usage)

## Files Modified

All 113 `index.ts` files under `supabase/functions/` (excluding `_shared/`). Each file gets the same mechanical transformation — no behavioral changes.

## Risk Assessment

- **Low risk** — purely mechanical string replacement of header references
- The `buildCorsHeaders` function already allows all the same Lovable preview domains plus production domains
- If any origin is missed, `buildCorsHeaders` falls back to the primary domain (`myct1.com`), which the browser will enforce

