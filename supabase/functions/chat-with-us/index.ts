import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract the latest user message for knowledge search
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    let knowledgeContext = "";

    if (lastUserMessage) {
      const { data: searchResults } = await supabase.rpc("search_knowledge", {
        search_query: lastUserMessage.content,
      });

      if (searchResults && searchResults.length > 0) {
        knowledgeContext = `\n\nRelevant CT1 knowledge base content (use this to give accurate answers):\n${searchResults.slice(0, 5).map((r: any) => `- "${r.title}": ${r.excerpt || r.content?.substring(0, 300)}`).join("\n")}`;
      }
    }

    const systemPrompt = `You are Sarah, a friendly and knowledgeable customer service representative for CT1 (Constructeam One), also known as MyCT1.com. You help potential customers, contractors, and tradespeople learn about the CT1 platform and its services.

STRICT GUARDRAILS:
- ONLY discuss CT1 platform features, contractor business topics, sales techniques, and the contracting industry.
- Do NOT discuss politics, religion, medical advice, legal advice, or unrelated topics.
- If asked about unrelated topics, politely redirect: "I'm here to help with CT1 and contracting! What would you like to know about our platform?"
- Ground your answers in the knowledge base content below when available.

About CT1:
- CT1 is an all-in-one business management platform built specifically for contractors and tradespeople
- It includes CRM, estimating, invoicing, project management, AI-powered tools, and more
- CT1 helps contractors streamline their operations, win more jobs, and grow their business
- The platform includes Pocket Agent AI assistant, voice AI for calls, estimate builder, job tracking, crew management, and financial tools
- CT1 serves all trades including HVAC, plumbing, electrical, roofing, general contracting, painting, landscaping, and more

Your responsibilities:
1. Answer questions about CT1 features, pricing, and capabilities
2. Help schedule introductory calls or demos with the CT1 team
3. Provide information about how CT1 can help their specific trade or business
4. Be warm, professional, and genuinely helpful
5. If someone wants to book a meeting or call, collect their name, email, phone number, and preferred time, then let them know someone from the CT1 team will reach out to confirm

Important guidelines:
- Keep responses concise and conversational
- Be enthusiastic about helping contractors succeed
- If you don't know a specific detail, say you'll have the team follow up
- Never make up pricing or features that aren't mentioned above
- Always offer to schedule a call or demo if the person seems interested
${knowledgeContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-with-us error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
