

# Update Edge Function AI Models — Optimization Plan

## Summary

Update 8 edge functions to use the recommended AI models from the optimization plan. Two functions (`elevenlabs-stream-handler`, `twilio-stream-handler`) use direct OpenAI APIs with a separate API key and will be left unchanged to avoid breaking their integrations.

## Changes

### Upgrade to `openai/gpt-5-mini` (better reasoning/tool-calling)

| Function | Current Model | Why |
|---|---|---|
| `pocketbot-chat` (2 calls) | `gemini-2.5-flash` | CRM tool-calling needs stronger reasoning |

### Upgrade to `google/gemini-3-flash-preview` (better structured extraction)

| Function | Current Model | Why |
|---|---|---|
| `estimate-assistant` | `gemini-2.5-flash` | Better JSON extraction |
| `extract-job-details` | `gemini-2.5-flash` | Better structured output |

### Downgrade to `google/gemini-2.5-flash-lite` (cost savings, simple tasks)

| Function | Current Model | Why |
|---|---|---|
| `summarize-scope-notes` | `gemini-2.5-flash` | Simple summarization task |
| `twilio-voice-inbound` (2 calls) | `gemini-2.5-flash` | Low-latency voice responses |

### Keep unchanged

| Function | Current Model | Why |
|---|---|---|
| `crm-ai-search` | `gemini-3-flash-preview` | Already optimal |
| `chat-with-us` | `gemini-3-flash-preview` | Already optimal |
| `help-chatbot` | `gemini-3-flash-preview` | Already optimal |
| `sales-coach` | `gemini-3-flash-preview` | Already optimal |
| `translate-document` | `gemini-3-flash-preview` + `gemini-2.5-pro` | Already optimal |
| `elevenlabs-stream-handler` | Direct OpenAI `gpt-4o-mini` | Uses separate OPENAI_API_KEY, not Lovable AI gateway — leave as-is |
| `twilio-stream-handler` | Direct OpenAI realtime API | Uses separate OPENAI_API_KEY — leave as-is |

## Technical Details

- **Files modified**: 5 edge function files, model string changes only
- **No logic changes** — just swapping model identifiers
- **No schema or migration changes needed**
- All changes use models available through the Lovable AI gateway

