

## Plan: Add Sales Coach Mode to Pocket Agent

### Overview
Add a "Sales Coach" tab to the existing FloatingPocketAgent chat window. The current chat functionality remains completely untouched — Sales Coach is a separate tab that users can switch to when they want live conversation coaching.

### Architecture

```text
┌─ FloatingPocketAgent (existing) ──────────┐
│  [Header - unchanged]                      │
│  [Chat | Sales Coach]  ← new tab toggle    │
│                                            │
│  Chat tab: existing chat (no changes)      │
│  Sales Coach tab: SalesCoachMode component │
│    ├─ Scrolling transcript panel            │
│    ├─ AI suggestion cards                  │
│    └─ Mic start/stop controls              │
└────────────────────────────────────────────┘
```

### Changes

**1. New: `src/components/contractor/SalesCoachMode.tsx`**
- Uses `useScribe` from `@elevenlabs/react` for real-time mic transcription (VAD commit strategy)
- On each committed transcript segment, calls the new `sales-coach` edge function with rolling context (~2000 chars)
- Displays scrolling transcript and 2-3 AI suggestion cards that update after each segment
- Start/Stop listening button with active mic indicator

**2. New: `supabase/functions/elevenlabs-scribe-token/index.ts`**
- Generates single-use token for ElevenLabs realtime transcription using existing `ELEVENLABS_API_KEY` secret
- Endpoint: `POST /v1/single-use-token/realtime_scribe`

**3. New: `supabase/functions/sales-coach/index.ts`**
- Accepts `{ transcript, latestSegment }` 
- Uses Lovable AI (`google/gemini-3-flash-preview`) with a contractor sales coaching prompt
- Returns 2-3 short, actionable dialogue suggestions (non-streaming JSON response)
- Prompt focuses on objection handling, value framing, closing techniques for trades/construction

**4. Modify: `src/components/contractor/FloatingPocketbot.tsx`**
- Add a simple two-tab toggle ("Chat" | "Sales Coach") below the header
- When "Sales Coach" is selected, render `SalesCoachMode` instead of the chat messages/input area
- Paywall and header logic unchanged — Sales Coach respects same `hasFullAccess` check
- All existing chat state, streaming, voice-to-text, drag behavior remain untouched

### What stays the same
- All existing chat functionality (messages, streaming, voice input, PDF downloads)
- Drag/position behavior
- Paywall/subscription logic
- Header design and minimize/close controls

