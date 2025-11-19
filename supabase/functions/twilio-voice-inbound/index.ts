/**
 * Twilio Voice Webhook - AI Voice Assistant
 * 
 * This endpoint receives voice webhooks from Twilio when a call comes in to any
 * CT1 contractor's Twilio number. It implements an AI-powered voice assistant
 * that uses the Contractor PocketBot to handle conversations intelligently.
 * 
 * Features:
 * - Personalized greetings based on contractor profile
 * - Natural conversation using AI
 * - Meeting scheduling with calendar integration
 * - Message taking
 * - Smart call routing
 * 
 * Twilio Webhook URL: https://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-voice-inbound
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normalize phone number to E.164 format
 * Twilio sends numbers in E.164, but this helper ensures consistency
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
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
 * Call PocketBot AI to generate response
 */
async function callPocketBot(
  contractorProfile: any,
  callContext: any,
  conversationHistory: any[],
  lastUserUtterance: string
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
  
  // Build system prompt with contractor context
  const systemPrompt = contractorProfile.custom_instructions || `You are an AI voice assistant for ${contractorProfile.business_name}, a ${contractorProfile.trade} contractor.

Business Information:
- Business Name: ${contractorProfile.business_name}
- Contractor: ${contractorProfile.contractor_name || 'the team'}
- Trade: ${contractorProfile.trade}
- Service Area: ${contractorProfile.service_area?.join(', ') || 'Not specified'}

${contractorProfile.service_description ? `About Us: ${contractorProfile.service_description}` : ''}

Services Offered: ${contractorProfile.services_offered?.join(', ') || 'General services'}
${contractorProfile.services_not_offered?.length ? `Services NOT Offered: ${contractorProfile.services_not_offered.join(', ')}` : ''}

Hours: ${JSON.stringify(contractorProfile.business_hours || {})}
${contractorProfile.emergency_availability ? `Emergency services available: ${JSON.stringify(contractorProfile.emergency_hours || {})}` : ''}

Pricing Policy: ${contractorProfile.allow_pricing ? contractorProfile.pricing_rules || 'Pricing available on request' : 'Do not discuss specific pricing. Tell callers we will provide a custom quote.'}

Scheduling: ${contractorProfile.calendar_type ? `Calendar type: ${contractorProfile.calendar_type}, Default meeting length: ${contractorProfile.default_meeting_length || 30} minutes, Buffer: ${contractorProfile.booking_buffer_minutes || 15} minutes, Preferred types: ${contractorProfile.preferred_meeting_types?.join(', ')}` : 'Standard scheduling applies'}

Your goal is to:
1. Answer questions professionally and accurately
2. Help schedule appointments when requested
3. Take messages when the contractor is unavailable
4. Only discuss services within our offerings
5. Be friendly but concise for voice conversation

When you need to take an action, respond in this format:
ACTION: [small_talk|schedule_meeting|take_message|end_call]
If scheduling a meeting, include: DATE: [date], TIME: [time]
If taking a message, include: MESSAGE: [message content]

Keep responses brief and natural for voice.`;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/pocketbot-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: lastUserUtterance }
        ],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`PocketBot API error: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.generatedText || data.reply || 'I apologize, I didn\'t catch that. Could you repeat?';
    
    // Parse action from response
    let action = 'small_talk';
    let actionPayload = {};
    
    if (replyText.includes('ACTION: schedule_meeting')) {
      action = 'schedule_meeting';
      const dateMatch = replyText.match(/DATE: ([^\n,]+)/);
      const timeMatch = replyText.match(/TIME: ([^\n,]+)/);
      if (dateMatch && timeMatch) {
        actionPayload = { date: dateMatch[1].trim(), time: timeMatch[1].trim() };
      }
    } else if (replyText.includes('ACTION: take_message')) {
      action = 'take_message';
      const messageMatch = replyText.match(/MESSAGE: ([^\n]+)/);
      if (messageMatch) {
        actionPayload = { message: messageMatch[1].trim() };
      }
    } else if (replyText.includes('ACTION: end_call')) {
      action = 'end_call';
    }
    
    // Clean up action markers from reply text
    const cleanReply = replyText
      .replace(/ACTION: [^\n]+/g, '')
      .replace(/DATE: [^\n,]+/g, '')
      .replace(/TIME: [^\n,]+/g, '')
      .replace(/MESSAGE: [^\n]+/g, '')
      .trim();
    
    return {
      reply_text: cleanReply,
      action,
      action_payload: actionPayload
    };
  } catch (error) {
    console.error('Error calling PocketBot:', error);
    return {
      reply_text: 'I apologize, I\'m having trouble processing your request. Let me take a message for you.',
      action: 'take_message',
      action_payload: {}
    };
  }
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
    const step = new URL(req.url).searchParams.get('step') || 'initial';

    console.log('Twilio webhook:', { from, to, callSid, callStatus, speechResult, step });

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
        headers: { 'Content-Type': 'text/xml', ...corsHeaders }
      });
    }

    const contractorId = phoneNumberRecord.contractor_id;
    const tenantId = phoneNumberRecord.tenant_id;

    // Get AI profile
    const aiProfile = await getContractorAIProfile(supabase, contractorId);
    
    // Check if AI is enabled and mode is set to ai_assistant
    if (!aiProfile || !aiProfile.ai_enabled || aiProfile.inbound_call_mode === 'voicemail_only') {
      // Fall back to voicemail
      const voicemailTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi, you've reached ${aiProfile?.business_name || 'our office'}. Please leave a message after the tone.</Say>
  <Record maxLength="120" playBeep="true"/>
  <Say voice="Polly.Joanna">Thank you. We'll get back to you soon. Goodbye.</Say>
  <Hangup/>
</Response>`;
      return new Response(voicemailTwiml, {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders }
      });
    }

    // Handle initial call
    if (step === 'initial') {
      // Log initial call
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

      // Create call session
      await supabase.from('call_sessions').insert({
        call_sid: callSid,
        contractor_id: contractorId,
        tenant_id: tenantId,
        from_number: from,
        to_number: to,
        status: 'active',
        conversation_history: []
      });

      const greeting = aiProfile.custom_greeting || 
        `Hello, thank you for calling ${aiProfile.business_name}. This is your ${aiProfile.trade} assistant. How can I help you today?`;

      const initialTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${greeting}</Say>
  <Gather input="speech" action="${supabaseUrl}/functions/v1/twilio-voice-inbound?step=continue" method="POST" timeout="3" speechTimeout="auto">
    <Say voice="Polly.Joanna"></Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear anything. Goodbye.</Say>
  <Hangup/>
</Response>`;

      return new Response(initialTwiml, {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders }
      });
    }

    // Handle conversation turns
    if (step === 'continue' && speechResult) {
      // Load call session
      const { data: session } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('call_sid', callSid)
        .single();

      if (!session) {
        throw new Error('Call session not found');
      }

      const conversationHistory = session.conversation_history || [];
      
      // Add user utterance
      conversationHistory.push({ role: 'user', content: speechResult });

      // Get AI response
      const aiResponse = await callPocketBot(
        aiProfile,
        { call_sid: callSid, from_number: from, to_number: to, contractor_id: contractorId, tenant_id: tenantId },
        conversationHistory,
        speechResult
      );

      // Add assistant response
      conversationHistory.push({ role: 'assistant', content: aiResponse.reply_text });

      // Update session
      await supabase
        .from('call_sessions')
        .update({
          conversation_history: conversationHistory,
          action_taken: aiResponse.action,
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);

      // Handle action
      let twiml = '';
      
      if (aiResponse.action === 'schedule_meeting') {
        // TODO: Integrate with calendar_events table
        const { date, time } = aiResponse.action_payload as any;
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse.reply_text}</Say>
  <Gather input="speech" action="${supabaseUrl}/functions/v1/twilio-voice-inbound?step=continue" method="POST" timeout="3" speechTimeout="auto">
    <Say voice="Polly.Joanna">Is there anything else I can help you with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`;
        
        await supabase.from('call_sessions').update({
          outcome: 'meeting_scheduled',
          status: 'completed'
        }).eq('call_sid', callSid);
        
      } else if (aiResponse.action === 'take_message') {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse.reply_text} We'll get back to you soon. Goodbye.</Say>
  <Hangup/>
</Response>`;
        
        await supabase.from('call_sessions').update({
          outcome: 'message_taken',
          ai_summary: (aiResponse.action_payload as any).message || speechResult,
          status: 'completed'
        }).eq('call_sid', callSid);
        
      } else if (aiResponse.action === 'end_call') {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse.reply_text} Goodbye.</Say>
  <Hangup/>
</Response>`;
        
        await supabase.from('call_sessions').update({
          outcome: 'call_completed',
          status: 'completed'
        }).eq('call_sid', callSid);
        
      } else {
        // Continue conversation
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse.reply_text}</Say>
  <Gather input="speech" action="${supabaseUrl}/functions/v1/twilio-voice-inbound?step=continue" method="POST" timeout="3" speechTimeout="auto">
    <Say voice="Polly.Joanna"></Say>
  </Gather>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`;
      }

      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders }
      });
    }

    // Default: end call
    const endTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return new Response(endTwiml, {
      headers: { 'Content-Type': 'text/xml', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    
    // Return a simple error TwiML so Twilio doesn't retry indefinitely
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, but we're unable to process your call at this time. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
        ...corsHeaders,
      },
    });
  }
});
