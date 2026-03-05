import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a real-time sales coach for contractors in the trades industry (HVAC, plumbing, electrical, roofing, general construction, etc.). You are listening to a live conversation between a contractor/salesperson and a prospective customer.

Your job is to provide 2-3 short, natural dialogue suggestions the contractor can say NEXT based on what was just said. Focus on:

1. **Objection Handling** — If the customer raises a price concern, timeline worry, or competitor comparison, provide a rebuttal that reframes the value.
2. **Value Framing** — Help the contractor articulate the value of their work (quality, warranty, experience, materials, licensing).
3. **Closing Techniques** — When buying signals appear, suggest assumptive closes, urgency builders, or next-step language.
4. **Discovery Questions** — If the conversation is early-stage, suggest questions to uncover pain points, budget, timeline, and decision-making process.

Rules:
- Keep each suggestion under 2 sentences — these must be speakable in real-time.
- Write in first person as if the contractor would say it.
- Be natural and conversational, not scripted or robotic.
- Adapt tone to the conversation — casual for homeowners, professional for GCs/commercial.
- If you detect a buying signal, prioritize closing suggestions.
- If you detect hesitation, prioritize trust-building and value propositions.

Return your response as a JSON object with a "suggestions" array, each with a "text" field and a "type" field (one of: "objection", "value", "close", "discovery", "rapport").`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, latestSegment } = await req.json();

    if (!transcript && !latestSegment) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Here is the rolling conversation transcript so far:
---
${transcript || "(No prior context)"}
---

The latest thing just said was:
"${latestSegment}"

Based on this conversation, provide 2-3 dialogue suggestions the contractor/salesperson should say next. Return as JSON with a "suggestions" array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_sales_suggestions",
              description: "Provide 2-3 dialogue suggestions for the contractor to say next.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The suggested dialogue line" },
                        type: {
                          type: "string",
                          enum: ["objection", "value", "close", "discovery", "rapport"],
                          description: "The type of sales technique"
                        },
                      },
                      required: ["text", "type"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_sales_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment.", suggestions: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached.", suggestions: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    // Extract tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // Return empty suggestions if parsing fails
      }
    }

    return new Response(
      JSON.stringify({ suggestions: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sales coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", suggestions: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
