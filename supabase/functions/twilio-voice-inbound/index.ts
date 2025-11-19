/**
 * Twilio Voice Webhook - Inbound Calls
 * 
 * This endpoint receives voice webhooks from Twilio when a call is forwarded
 * from the pilot phone number. It logs the call to the database and responds
 * with TwiML to record a voicemail.
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

    // Log the call to the database
    const { error: insertError } = await supabase
      .from('calls')
      .insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: null, // Placeholder until contractor mapping is wired
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
