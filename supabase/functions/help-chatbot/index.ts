import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, userName, companyName, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are the CT1 Help Bot, a friendly and knowledgeable assistant for the CT1 Contractor Hub - a CRM and business management platform for contractors.

Your role is to:
1. Answer questions about using the CT1 Contractor Hub
2. Guide users through common workflows and features
3. Troubleshoot technical issues
4. Direct users to relevant help articles when available

Key features in CT1 Contractor Hub:
- Dashboard: Overview of leads, jobs, estimates, and key metrics
- Leads: Track potential customers and opportunities
- Customers: Manage customer profiles and contact information
- Estimates: Create and send professional estimates/proposals
- Jobs: Track active jobs, tasks, change orders, and project progress
- Invoices: Generate and send invoices, track payments
- Phone/Voice AI: Business phone number with AI-powered call handling
- QuickBooks: Sync accounting data with QuickBooks
- Bank Connection: Connect bank accounts via Plaid for payments
- Calendar: Schedule meetings and appointments
- Reports: View business analytics and performance metrics

Navigation in the app:
- The main dashboard has a sidebar with sections: Dashboard, CRM (Leads, Customers, Jobs, Estimates, Invoices), Calls, Calendar, Reports, and More
- The "More" section contains: Profile Settings, Phone Setup, Bank Connection, QuickBooks, Insurance, Help Center

Guidelines:
- Be concise but thorough - aim for 2-3 sentences per response
- Use the user's name (${userName || 'there'}) when appropriate
- Reference specific UI elements and buttons by name
- If you find relevant articles in the context, mention them
- If you can't answer, suggest contacting support
- Be warm and professional - you represent CT1

${companyName ? `The user's company is: ${companyName}` : ''}

${context}`;

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
        max_tokens: 500,
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
    
    // Determine if we should suggest support based on the response
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
      suggestSupport 
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
      status: 200, // Return 200 so the frontend can show the fallback message
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
