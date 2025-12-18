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
 * Verify Twilio webhook signature using Web Crypto API
 */
async function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: URLSearchParams
): Promise<boolean> {
  try {
    // Build the signature string: URL + sorted params
    let signatureString = url;
    
    // Sort parameters alphabetically and append
    const sortedKeys = Array.from(params.keys()).sort();
    for (const key of sortedKeys) {
      signatureString += key + params.get(key);
    }
    
    // Create HMAC-SHA1 signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authToken);
    const messageData = encoder.encode(signatureString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
    // Convert to base64
    const signatureArray = new Uint8Array(signatureBuffer);
    const expectedSignature = btoa(String.fromCharCode(...signatureArray));
    
    console.log('Signature verification:', {
      url,
      expected: expectedSignature,
      received: signature,
      match: expectedSignature === signature
    });
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

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

    // Verify Twilio signature
    const twilioSignature = req.headers.get('X-Twilio-Signature');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    if (!twilioAuthToken) {
      console.error('TWILIO_AUTH_TOKEN not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    const formData = await req.text();
    const params = new URLSearchParams(formData);
    
    // Construct the full URL - Twilio uses the configured webhook URL for signature
    // which may be different from the actual request URL
    const url = new URL(req.url);
    console.log('Request URL:', url.href);
    
    // Try multiple URL formats for signature verification
    const possibleUrls = [
      `https://${url.host}${url.pathname}`, // Full path with /functions/v1/
      `https://${url.host}/functions/v1/twilio-voice-inbound`, // Explicit full path
      `https://${url.host}/twilio-voice-inbound`, // Without /functions/v1/
    ];
    
    let signatureValid = false;
    let validUrl = '';
    
    if (twilioSignature) {
      for (const testUrl of possibleUrls) {
        if (await verifyTwilioSignature(twilioAuthToken, twilioSignature, testUrl, params)) {
          signatureValid = true;
          validUrl = testUrl;
          break;
        }
      }
    }
    
    console.log('Signature verification:', { signatureValid, validUrl, hasSignature: !!twilioSignature });
    
    // Strict signature verification enabled for security
    if (!twilioSignature) {
      console.error('Missing Twilio signature header');
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unauthorized request. Missing signature.</Say></Response>`;
      return new Response(errorTwiml, { 
        status: 403,
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    
    if (!signatureValid) {
      console.error('Invalid Twilio signature', { 
        attemptedUrls: possibleUrls,
        hint: 'Verify Twilio webhook URL is set to: https://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-voice-inbound'
      });
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unauthorized request. Invalid signature.</Say></Response>`;
      return new Response(errorTwiml, { 
        status: 403,
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    
    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const callSid = params.get('CallSid') || '';
    const callStatus = params.get('CallStatus') || '';

    console.log('Verified Twilio webhook:', { from, to, callSid, callStatus });

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
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // Check if we should ring contractor first before AI intercepts
    // 3 rings ≈ 15 seconds on most carriers.
    const forwardTimeout = aiProfile.forward_timeout_seconds || 0;
    const contractorPhone = aiProfile.contractor_phone;

    // Enforce the requested behavior: ring no more than ~3 times before AI answers.
    const effectiveForwardTimeout = Math.min(forwardTimeout, 15);

    if (effectiveForwardTimeout > 0 && contractorPhone) {
      console.log(
        `Ringing contractor ${contractorPhone} for ${effectiveForwardTimeout}s (max 3 rings) before AI intercepts`
      );

      // Log call with routing_status indicating we're trying contractor first
      await supabase.from('calls').insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: contractorId,
        tenant_id: tenantId,
        routing_status: 'forwarding_to_contractor',
        ai_backup_triggered: false,
        forwarded_to_contractor: true,
      });

      // Create call session for later AI handling if needed
      await supabase.from('call_sessions').insert({
        call_sid: callSid,
        contractor_id: contractorId,
        tenant_id: tenantId,
        from_number: from,
        to_number: to,
        status: 'pending',
        conversation_history: [],
      });

      // Return TwiML that dials contractor with timeout, then fallback to AI
      const fallbackUrl = `https://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-voice-fallback`;

      // Use the Twilio number as caller ID to avoid carrier blocking
      const dialTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="${effectiveForwardTimeout}" action="${fallbackUrl}" callerId="${to}">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="https://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-voice-status" statusCallbackMethod="POST">${contractorPhone}</Number>
  </Dial>
</Response>`;

      return new Response(dialTwiml, {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders },
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

    // Build the system prompt from AI profile with enhanced conversation flow
    const systemPrompt = aiProfile.custom_instructions || `You are "Coral", the AI voice assistant for ${aiProfile.business_name}, a ${aiProfile.trade} contractor.

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

IMPORTANT CALL FLOW - Follow this conversation structure:

1. GREETING: Introduce yourself as "Coral - ${aiProfile.business_name}'s AI assistant" warmly.

2. GATHER INFORMATION: Ask naturally:
   - "Do you have a reference number or job number I can look up?"
   - "Is this regarding an existing job, or is this a new inquiry?"
   - "Is this an emergency situation?"

3. DETERMINE INTENT - Ask: "Would you like to:"
   a) "Leave a message for ${aiProfile.contractor_name || 'the contractor'} and we'll call you back?" 
      → Use take_voicemail function
   b) "Schedule a visit so we can take a look?"
      → Use schedule_appointment function

4. FOR SCHEDULING: Gather name, callback number, address, preferred time, and description.

5. FOR VOICEMAIL: Gather name, callback number, message, and urgency.

6. WRAP UP: Confirm what action was taken and thank them warmly.

NEVER cut off mid-conversation. Stay on the line until the customer is satisfied.`;

    // Coral's greeting with business name
    const greeting = aiProfile.custom_greeting || 
      `Hey there! This is Coral, ${aiProfile.business_name}'s AI assistant. Thanks for calling! How can I help you today?`;

    // Get voice ID and ensure it's one of the supported OpenAI voices
    // Default to 'coral' for warm, friendly tone suited to contractors
    const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
    let voiceId = aiProfile.voice_id || 'coral';
    if (!supportedVoices.includes(voiceId)) {
      console.log(`Unsupported voice_id '${voiceId}' in AI profile, defaulting to 'coral'`);
      voiceId = 'coral';
    }

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

    // Return TwiML that connects to ElevenLabs stream handler
    const streamUrl = `wss://faqrzzodtmsybofakcvv.supabase.co/functions/v1/elevenlabs-stream-handler`;
    
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
