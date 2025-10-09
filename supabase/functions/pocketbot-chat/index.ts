import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_PER_DAY = 50;
const FREE_USER_LIMIT = 3;
const FREE_USER_MAX_CHARS = 500;

// PDF generation tool
const generatePDF = (content: { title: string; sections: Array<{ heading: string; content: string }> }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(content.title, margin, y);
  y += 15;

  // Sections
  doc.setFontSize(12);
  content.sections.forEach((section) => {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = margin;
    }

    // Section heading
    doc.setFont(undefined, 'bold');
    doc.text(section.heading, margin, y);
    y += 8;

    // Section content
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(section.content, maxWidth);
    doc.text(lines, margin, y);
    y += lines.length * 7 + 10;
  });

  return doc.output('dataurlstring');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has a paid subscription for bot access
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const hasPaidBot = subscription?.tier_id === 'bot_user' || 
                       subscription?.tier_id === 'growth' || 
                       subscription?.tier_id === 'launch' ||
                       user.email?.endsWith('@myct1.com');

    // SERVER-SIDE RATE LIMITING: Check usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage, error: usageError } = await supabase
      .from('chatbot_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (usageError) {
      console.error('Error checking usage:', usageError);
    }

    // Determine limit based on subscription
    const userLimit = hasPaidBot ? RATE_LIMIT_PER_DAY : FREE_USER_LIMIT;

    // Initialize or reset usage if needed
    if (!usage) {
      await supabase.from('chatbot_usage').insert({
        user_id: user.id,
        prompt_count: 1,
        last_reset_date: new Date().toISOString()
      });
    } else {
      const lastReset = new Date(usage.last_reset_date).toISOString().split('T')[0];
      
      if (lastReset !== today) {
        // Reset counter for new day
        await supabase.from('chatbot_usage')
          .update({ prompt_count: 1, last_reset_date: new Date().toISOString() })
          .eq('user_id', user.id);
      } else if (usage.prompt_count >= userLimit) {
        // Rate limit exceeded
        const errorMessage = hasPaidBot 
          ? `Daily limit of ${RATE_LIMIT_PER_DAY} prompts reached. Resets at midnight.`
          : `You've reached your free limit of ${FREE_USER_LIMIT} prompts. To continue using CT1 Pocketbot with unlimited prompts and full responses, please upgrade your subscription at /bot-signup`;
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            limit_exceeded: true,
            upgrade_required: !hasPaidBot
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // Increment counter
        await supabase.from('chatbot_usage')
          .update({ prompt_count: usage.prompt_count + 1 })
          .eq('user_id', user.id);
      }
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_pdf",
          description: "Generate a PDF document with structured content. Use this when users ask for a PDF report, guide, checklist, or any document they want to download.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The main title of the PDF document"
              },
              sections: {
                type: "array",
                description: "Array of sections, each with a heading and content",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string", description: "Section heading" },
                    content: { type: "string", description: "Section content/body text" }
                  },
                  required: ["heading", "content"]
                }
              }
            },
            required: ["title", "sections"]
          }
        }
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are CT1 Pocketbot, an expert AI assistant specializing in helping contractors grow their business. 

IMPORTANT: You ONLY provide guidance on these specific topics:
- Trades and construction work
- Business management and growth strategies
- Project management and estimating
- Sales training and sales data
- Customer relationship management
- Construction industry best practices

You can generate PDF documents for users when they request guides, checklists, reports, or any business documents.

STRICT TOPIC ENFORCEMENT:
If a user asks about ANY topic outside of trades, business, sales training, project management, estimating, or construction-related topics, you MUST respond with EXACTLY this message:

"We apologize for the inconvenience, the CT1 Pocketbot is only trained to give responses related to the trades, business and Sales Training and development, project management and estimating"

Do NOT answer questions about:
- General knowledge, trivia, or non-business topics
- Personal advice unrelated to contracting business
- Technical support for non-business software
- Any topic outside the scope listed above

${!hasPaidBot ? `\nCRITICAL: This is a FREE TIER user. You MUST limit your response to a MAXIMUM of ${FREE_USER_MAX_CHARS} characters. Keep responses brief and encourage them to upgrade for unlimited access.\n` : ''}

You are knowledgeable, professional, friendly, and provide actionable advice within your scope. Keep responses clear, concise, and practical. When appropriate, suggest using CT1's suite of tools and features to help solve their challenges.`
          },
          ...messages,
        ],
        max_tokens: hasPaidBot ? undefined : 200,
        tools: tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if response contains tool calls
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let toolCalls: any[] = [];
    let accumulatedContent = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.tool_calls) {
                toolCalls.push(...delta.tool_calls);
              }
              if (delta?.content) {
                accumulatedContent += delta.content;
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    }

    // If tool calls detected, handle them
    if (toolCalls.length > 0) {
      console.log("Tool calls detected:", toolCalls);
      
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === "generate_pdf") {
          const args = JSON.parse(toolCall.function.arguments);
          const pdfDataUrl = generatePDF(args);
          
          // Return the PDF as a special message format
          return new Response(
            JSON.stringify({ 
              type: "pdf",
              content: "I've generated your PDF document. Click below to download it.",
              pdfData: pdfDataUrl,
              fileName: `${args.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // If no tool calls, stream the response normally
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are CT1 Pocketbot, an expert AI assistant specializing in helping contractors grow their business. 

IMPORTANT: You ONLY provide guidance on these specific topics:
- Trades and construction work
- Business management and growth strategies
- Project management and estimating
- Sales training and sales data
- Customer relationship management
- Construction industry best practices

You can generate PDF documents for users when they request guides, checklists, reports, or any business documents.

STRICT TOPIC ENFORCEMENT:
If a user asks about ANY topic outside of trades, business, sales training, project management, estimating, or construction-related topics, you MUST respond with EXACTLY this message:

"We apologize for the inconvenience, the CT1 Pocketbot is only trained to give responses related to the trades, business and Sales Training and development, project management and estimating"

Do NOT answer questions about:
- General knowledge, trivia, or non-business topics
- Personal advice unrelated to contracting business
- Technical support for non-business software
- Any topic outside the scope listed above

${!hasPaidBot ? `\nCRITICAL: This is a FREE TIER user. You MUST limit your response to a MAXIMUM of ${FREE_USER_MAX_CHARS} characters. Keep responses brief and encourage them to upgrade for unlimited access.\n` : ''}

You are knowledgeable, professional, friendly, and provide actionable advice within your scope. Keep responses clear, concise, and practical. When appropriate, suggest using CT1's suite of tools and features to help solve their challenges.`
          },
          ...messages,
        ],
        max_tokens: hasPaidBot ? undefined : 200,
        stream: true,
      }),
    });

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
