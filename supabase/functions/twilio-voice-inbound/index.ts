/**
 * Twilio Voice Webhook - AI Voice Assistant with Real-time Streaming
 * 
 * This endpoint receives voice webhooks from Twilio and initiates a bidirectional
 * audio stream for real-time AI conversation using OpenAI Realtime API.
 * 
 * Features:
 * - Real-time bidirectional audio streaming
 * - Personalized AI assistant per contractor
 * - Uses contractor's custom prompt and voice settings
 * - Handles interruptions naturally
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

    console.log('Twilio webhook:', { from, to, callSid, callStatus });

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
    
    // Check if AI is enabled
    if (!aiProfile || !aiProfile.ai_enabled || aiProfile.inbound_call_mode === 'voicemail_only') {
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

    // Log call
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

    // Create call session with AI profile data
    await supabase.from('call_sessions').insert({
      call_sid: callSid,
      contractor_id: contractorId,
      tenant_id: tenantId,
      from_number: from,
      to_number: to,
      status: 'active',
      conversation_history: []
    });

    // Build the system prompt from AI profile
    const systemPrompt = aiProfile.custom_instructions || `You are an AI voice assistant for ${aiProfile.business_name}, a ${aiProfile.trade} contractor.

Business Information:
- Business Name: ${aiProfile.business_name}
- Contractor: ${aiProfile.contractor_name || 'the team'}
- Trade: ${aiProfile.trade}
- Service Area: ${aiProfile.service_area?.join(', ') || 'Not specified'}

${aiProfile.service_description ? `About Us: ${aiProfile.service_description}` : ''}

Services Offered: ${aiProfile.services_offered?.join(', ') || 'General services'}
${aiProfile.services_not_offered?.length ? `Services NOT Offered: ${aiProfile.services_not_offered.join(', ')}` : ''}

Hours: ${JSON.stringify(aiProfile.business_hours || {})}
${aiProfile.emergency_availability ? `Emergency services available: ${JSON.stringify(aiProfile.emergency_hours || {})}` : ''}

Pricing Policy: ${aiProfile.allow_pricing ? aiProfile.pricing_rules || 'Pricing available on request' : 'Do not discuss specific pricing. Tell callers we will provide a custom quote.'}

Your role:
- Answer questions about our services
- Help schedule appointments
- Take messages for the contractor
- Be professional, friendly, and helpful
- Use natural conversational tone

Keep responses concise and conversational. This is a phone call.`;

    // Use custom greeting or default
    const greeting = aiProfile.custom_greeting || 
      `Hello, thank you for calling ${aiProfile.business_name}. This is your ${aiProfile.trade} assistant. How can I help you today?`;

    // Get voice ID (default to 'alloy' if not set)
    const voiceId = aiProfile.voice_id || 'alloy';

    // Store configuration in session for WebSocket handler
    await supabase.from('call_sessions').update({
      conversation_history: [{
        system_prompt: systemPrompt,
        greeting: greeting,
        voice_id: voiceId,
        contractor_id: contractorId,
        business_name: aiProfile.business_name
      }]
    }).eq('call_sid', callSid);

    // Return TwiML that connects to our WebSocket stream handler
    const streamUrl = `wss://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-stream-handler`;
    
    const streamTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="callSid" value="${callSid}"/>
      <Parameter name="contractorId" value="${contractorId}"/>
    </Stream>
  </Connect>
</Response>`;

    console.log('Returning streaming TwiML for call:', callSid);
    return new Response(streamTwiml, {
      headers: { 'Content-Type': 'text/xml', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in twilio-voice-inbound:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, there was an error processing your call. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml', ...corsHeaders }
    });
  }
});
