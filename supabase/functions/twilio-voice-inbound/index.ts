/**
 * Twilio Voice Webhook - Inbound Calls
 * 
 * This endpoint receives voice webhooks from Twilio when a call comes in to any
 * CT1 contractor's Twilio number. It looks up the contractor by phone number,
 * logs the call to the database, and responds with TwiML to record a voicemail.
 * 
 * Future enhancement: This will be upgraded to a streaming AI voice assistant
 * that can handle calls in real-time.
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Parse Twilio's form data
    const formData = await req.text();
    const params = new URLSearchParams(formData);
    
    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const callSid = params.get('CallSid') || '';
    const callStatus = params.get('CallStatus') || '';

    console.log('Received Twilio call:', {
      from,
      to,
      callSid,
      callStatus,
    });

    // TODO: Implement Twilio signature validation for production
    // See: https://www.twilio.com/docs/usage/security#validating-requests
    // This will verify the request actually came from Twilio and prevent spoofing

    // Initialize Supabase client with service role key for database writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up contractor by phone number
    const phoneNumberRecord = await lookupContractorByPhoneNumber(supabase, to);
    
    let contractorId = null;
    let tenantId = null;
    let routingStatus = 'ok';
    
    if (phoneNumberRecord) {
      contractorId = phoneNumberRecord.contractor_id;
      tenantId = phoneNumberRecord.tenant_id;
      console.log('Call routed to contractor:', contractorId);
    } else {
      routingStatus = 'unassigned_number';
      console.warn('No contractor found for phone number:', to);
    }

    // Log the call to the database
    const { error: insertError } = await supabase
      .from('calls')
      .insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: contractorId,
        tenant_id: tenantId,
        routing_status: routingStatus,
      });

    if (insertError) {
      console.error('Failed to log call to database:', insertError);
      // Continue anyway - we still want to respond to Twilio
    }

    // Generate TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hi, you reached the CT1 contractor assistant. Please leave a message after the tone.
  </Say>
  <Record 
    maxLength="120" 
    playBeep="true" 
    recordingStatusCallback="${supabaseUrl}/functions/v1/twilio-recording-callback"
    recordingStatusCallbackMethod="POST"
  />
  <Say voice="alice">
    Thank you for your message. We will get back to you soon. Goodbye.
  </Say>
  <Hangup/>
</Response>`;

    // Return TwiML with correct content type
    return new Response(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        ...corsHeaders,
      },
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
