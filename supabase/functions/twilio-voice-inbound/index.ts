/**
 * Twilio Voice Webhook - AI Voice Assistant
 * 
 * This endpoint receives voice webhooks from Twilio and handles AI conversations
 * using Twilio's TwiML with <Gather> and callback patterns.
 * 
 * Flow:
 * 1. Caller calls → twilio-voice-inbound (greeting + gather)
 * 2. User speaks → Twilio transcribes → twilio-voice-inbound (AI response + gather)
 * 3. Repeat until call ends
 * 
 * Twilio Webhook URL: https://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-voice-inbound
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+1' + cleaned;
  }
  return cleaned;
}

/**
 * Look up contractor by Twilio phone number
 */
async function lookupContractorByPhoneNumber(supabase: any, toNumber: string) {
  const normalizedTo = normalizePhoneNumber(toNumber);
  
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('contractor_id, tenant_id, twilio_phone_number')
    .eq('twilio_phone_number', normalizedTo)
    .eq('active', true)
    .single();
  
  if (error) {
    console.log('No phone number record found for:', normalizedTo, error);
    return null;
  }
  
  return data;
}

/**
 * Get contractor AI profile
 */
async function getContractorAIProfile(supabase: any, contractorId: string) {
  const { data, error } = await supabase
    .from('contractor_ai_profiles')
    .select('*')
    .eq('contractor_id', contractorId)
    .single();
  
  if (error) {
    console.log('No AI profile found for contractor:', contractorId);
    return null;
  }
  
  return data;
}

/**
 * Get AI response using Lovable AI
 */
async function getAIResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return "I'm sorry, I'm having technical difficulties. Please call back later.";
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 150, // Keep responses short for phone
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      return "I'm sorry, could you repeat that?";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I didn't catch that. Could you please repeat?";
  } catch (error) {
    console.error('AI request failed:', error);
    return "I'm having trouble hearing you. Could you please repeat that?";
  }
}

/**
 * Build system prompt from AI profile
 */
function buildSystemPrompt(aiProfile: any): string {
  if (aiProfile.custom_instructions) {
    return aiProfile.custom_instructions + `

CRITICAL VOICE RULES:
- Keep responses SHORT (1-3 sentences max) - this is a phone call
- Sound warm and human, not robotic
- Use contractions naturally (I'm, you're, we'll)
- Ask ONE question at a time
- NEVER use emojis, markdown, or special formatting
- NEVER mention you're an AI unless directly asked`;
  }

  return `You are a friendly AI voice assistant for ${aiProfile.business_name}, a ${aiProfile.trade} business.

Business Information:
- Business Name: ${aiProfile.business_name}
- Contact: ${aiProfile.contractor_name || 'the team'}
- Trade: ${aiProfile.trade}
- Service Area: ${aiProfile.service_area?.join(', ') || 'Not specified'}

${aiProfile.service_description ? `About: ${aiProfile.service_description}` : ''}
Services: ${aiProfile.services_offered?.join(', ') || 'General services'}

YOUR JOB:
1. Greet callers warmly
2. Understand what they need (ask clarifying questions)
3. Either schedule an appointment OR take a voicemail message
4. Get their name and callback number

CRITICAL VOICE RULES:
- Keep responses SHORT (1-3 sentences max) - this is a phone call
- Sound warm and human, not robotic
- Use contractions naturally (I'm, you're, we'll)
- Ask ONE question at a time
- NEVER use emojis, markdown, or special formatting
- NEVER mention you're an AI unless directly asked`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const formData = await req.text();
    const params = new URLSearchParams(formData);
    
    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const callSid = params.get('CallSid') || '';
    const callStatus = params.get('CallStatus') || '';
    const speechResult = params.get('SpeechResult') || '';
    const digits = params.get('Digits') || '';

    console.log('Twilio webhook:', { from, to, callSid, callStatus, hasSpeech: !!speechResult });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up contractor
    const phoneNumberRecord = await lookupContractorByPhoneNumber(supabase, to);
    
    if (!phoneNumberRecord) {
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, this number is not currently configured. Please contact support.</Say>
  <Hangup/>
</Response>`;
      return new Response(errorTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    const contractorId = phoneNumberRecord.contractor_id;
    const tenantId = phoneNumberRecord.tenant_id;

    // Get AI profile
    const aiProfile = await getContractorAIProfile(supabase, contractorId);
    
    // Check if AI is enabled - if not, go to voicemail
    if (!aiProfile || !aiProfile.ai_enabled || aiProfile.inbound_call_mode === 'voicemail_only') {
      const voicemailTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi, you've reached ${aiProfile?.business_name || 'our office'}. Please leave a message after the tone.</Say>
  <Record maxLength="120" playBeep="true" action="https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-recording-callback"/>
  <Say voice="Polly.Joanna">Thank you. We'll get back to you soon. Goodbye.</Say>
  <Hangup/>
</Response>`;
      return new Response(voicemailTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // Check if we should ring contractor first
    const forwardTimeout = Math.min(aiProfile.forward_timeout_seconds || 0, 15);
    const contractorPhone = aiProfile.contractor_phone;

    if (forwardTimeout > 0 && contractorPhone && !speechResult) {
      console.log(`Ringing contractor ${contractorPhone} for ${forwardTimeout}s before AI`);

      await supabase.from('calls').insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: contractorId,
        tenant_id: tenantId,
        routing_status: 'forwarding_to_contractor',
        forwarded_to_contractor: true,
      });

      const fallbackUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-fallback`;
      const dialTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="${forwardTimeout}" action="${fallbackUrl}" callerId="${to}">
    <Number>${contractorPhone}</Number>
  </Dial>
</Response>`;

      return new Response(dialTwiml, {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders },
      });
    }

    // Get or create call session
    let { data: session } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .single();

    if (!session) {
      // First interaction - create session and greet
      const { data: newSession } = await supabase
        .from('call_sessions')
        .insert({
          call_sid: callSid,
          contractor_id: contractorId,
          tenant_id: tenantId,
          from_number: from,
          to_number: to,
          status: 'active',
          conversation_history: []
        })
        .select()
        .single();
      
      session = newSession;

      // Log the call
      await supabase.from('calls').insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: contractorId,
        tenant_id: tenantId,
        routing_status: 'ai_handling',
        ai_handled: true,
      });

      // Return greeting with gather
      const greeting = aiProfile.custom_greeting || 
        `Hi there! Thanks for calling ${aiProfile.business_name}. This is ${aiProfile.contractor_name ? aiProfile.contractor_name + "'s assistant" : 'our virtual assistant'}. How can I help you today?`;

      const actionUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-inbound`;
      const greetingTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear anything. Please call back if you need assistance. Goodbye!</Say>
  <Hangup/>
</Response>`;

      return new Response(greetingTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // Continuing conversation - process speech and respond
    if (speechResult) {
      console.log('User said:', speechResult);
      
      // Get conversation history
      const history = session.conversation_history || [];
      
      // Add user message
      history.push({ role: 'user', content: speechResult });

      // Get AI response
      const systemPrompt = buildSystemPrompt(aiProfile);
      const aiResponse = await getAIResponse(systemPrompt, history.slice(-10), speechResult);
      
      console.log('AI response:', aiResponse);

      // Add assistant message
      history.push({ role: 'assistant', content: aiResponse });

      // Update session
      await supabase
        .from('call_sessions')
        .update({ 
          conversation_history: history,
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);

      // Check if conversation is ending
      const lowerResponse = aiResponse.toLowerCase();
      const isEnding = lowerResponse.includes('goodbye') || 
                       lowerResponse.includes('have a great day') ||
                       lowerResponse.includes('take care');

      const actionUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-inbound`;
      
      if (isEnding) {
        // End the call
        await supabase
          .from('call_sessions')
          .update({ 
            status: 'completed',
            ai_summary: await generateSummary(history, aiProfile.business_name),
            updated_at: new Date().toISOString()
          })
          .eq('call_sid', callSid);

        await supabase
          .from('calls')
          .update({ 
            call_status: 'completed',
            ai_summary: await generateSummary(history, aiProfile.business_name),
            updated_at: new Date().toISOString()
          })
          .eq('call_sid', callSid);

        const endTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
  <Hangup/>
</Response>`;
        return new Response(endTwiml, {
          headers: { 'Content-Type': 'application/xml', ...corsHeaders }
        });
      }

      // Continue conversation
      const continueTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="8" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">Are you still there?</Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">If you're done, just say goodbye. Otherwise, how can I help?</Say>
  </Gather>
  <Say voice="Polly.Joanna">It seems like you've stepped away. Feel free to call back anytime. Goodbye!</Say>
  <Hangup/>
</Response>`;

      return new Response(continueTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // No speech detected - prompt again
    const actionUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-inbound`;
    const promptTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">I'm still here. How can I help you?</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear a response. Please call back if you need assistance. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(promptTwiml, {
      headers: { 'Content-Type': 'application/xml', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in twilio-voice-inbound:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, there was an error processing your call. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'application/xml', ...corsHeaders }
    });
  }
});

/**
 * Generate a summary of the conversation
 */
async function generateSummary(history: Array<{ role: string; content: string }>, businessName: string): Promise<string> {
  if (history.length === 0) return '';
  
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return '';

  try {
    const transcript = history.map(m => 
      `${m.role === 'user' ? 'Caller' : 'Assistant'}: ${m.content}`
    ).join('\n');

    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: 'Summarize this phone call in 2-3 sentences. Focus on: what the caller needed, what was discussed, and any action items or next steps.'
        }, {
          role: 'user',
          content: `Call to ${businessName}:\n\n${transcript}`
        }],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
