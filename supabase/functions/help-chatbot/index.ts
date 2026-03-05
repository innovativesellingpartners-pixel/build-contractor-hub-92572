import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userName, companyName, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use unified knowledge search
    const { data: searchResults } = await supabase.rpc('search_knowledge', {
      search_query: message,
    });

    const articlesContext = searchResults && searchResults.length > 0
      ? `\n\nRelevant knowledge base results (use these to answer the question):\n${searchResults.map((r: any) => `- [${r.source}] "${r.title}": ${r.excerpt || r.content?.substring(0, 300)}...`).join('\n')}`
      : '\n\nNo directly matching articles found in the knowledge base. Answer based on your knowledge of the CT1 platform.';

    const systemPrompt = `You are the CT1 Help Bot, a friendly and knowledgeable assistant for the CT1 Contractor Hub - a CRM and business management platform for contractors.

STRICT GUARDRAILS:
- ONLY answer questions about the CT1 platform, contractor business practices, sales techniques, and the contracting industry.
- Do NOT discuss politics, religion, medical advice, legal advice, or any topics unrelated to contracting and CT1.
- If asked about unrelated topics, politely redirect: "I'm here to help with CT1 and your contracting business. What can I help you with on the platform?"
- Ground your answers in the knowledge base content when available.
- If no matching content exists and you're unsure, suggest contacting support.

Your role is to:
1. Answer questions about using the CT1 Contractor Hub
2. Guide users through common workflows and features
3. Help with sales techniques and objection handling for contractors
4. Troubleshoot technical issues
5. Direct users to relevant help articles when available

Key features in CT1 Contractor Hub:
- Dashboard: Overview of leads, jobs, estimates, and key metrics
- Leads: Track potential customers and opportunities
- Customers: Manage customer profiles and contact information
- Estimates: Create and send professional estimates/proposals
- Jobs: Track active jobs, tasks, change orders, and project progress
- Invoices: Generate and send invoices, track payments
- Phone/Voice AI: Business phone number with AI-powered call handling
- QuickBooks: Sync accounting data with QuickBooks
- Calendar: Schedule meetings and appointments
- Reports: View business analytics and performance metrics
- Crew Management: Manage crews, assign members to jobs
- Documents: Upload and manage contractor documents

Navigation in the app:
- The main dashboard has a sidebar with sections: Dashboard, CRM (Leads, Customers, Jobs, Estimates, Invoices), Calls, Calendar, Reports, and More
- The "More" section contains: Profile Settings, Phone Setup, Bank Connection, QuickBooks, Insurance, Help Center

Guidelines:
- Be concise but thorough
- Use the user's name (${userName || 'there'}) when appropriate
- Reference specific UI elements and buttons by name
- If you find relevant articles in the context, mention them
- If you can't answer, suggest contacting support
- Be warm and professional - you represent CT1

${companyName ? `The user's company is: ${companyName}` : ''}

${articlesContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          message: "I'm receiving a lot of requests right now. Please try again in a moment.",
          suggestSupport: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          message: "I'm temporarily unavailable. Please contact support for immediate assistance.",
          suggestSupport: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I apologize, I couldn't process your request.";
    
    const lowerMessage = message.toLowerCase();
    const suggestSupport = 
      lowerMessage.includes('not working') ||
      lowerMessage.includes('bug') ||
      lowerMessage.includes('error') ||
      lowerMessage.includes('broken') ||
      lowerMessage.includes('help me') ||
      lowerMessage.includes('speak to') ||
      lowerMessage.includes('talk to') ||
      aiMessage.includes('contact support') ||
      aiMessage.includes('reach out to');

    return new Response(JSON.stringify({ 
      message: aiMessage,
      suggestSupport,
      searchResults: searchResults?.slice(0, 5) || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Help chatbot error:', error);
    return new Response(JSON.stringify({ 
      message: "I'm having trouble connecting right now. Please try again or contact support if the issue persists.",
      suggestSupport: true,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
