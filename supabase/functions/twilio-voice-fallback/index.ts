/**
 * Twilio Voice Fallback Handler
 * 
 * This endpoint handles calls that weren't answered by the contractor
 * within the configured timeout period. It connects them to the AI assistant.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }

  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);
    const callSid = params.get('CallSid') || '';
    const dialCallStatus = params.get('DialCallStatus') || '';
    
    console.log('Fallback handler called:', { callSid, dialCallStatus });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get call session to retrieve AI configuration
    const { data: session, error: sessionError } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .single();

    if (sessionError || !session) {
      console.error('Could not find call session:', sessionError);
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we couldn't connect your call. Please try again later.</Say>
  <Hangup/>
</Response>`, {
        headers: { 'Content-Type': 'text/xml', ...buildCorsHeaders(req) }
      });
    }

    // Get AI profile
    const { data: aiProfile, error: profileError } = await supabase
      .from('contractor_ai_profiles')
      .select('*')
      .eq('contractor_id', session.contractor_id)
      .single();

    if (profileError || !aiProfile) {
      console.error('Could not find AI profile:', profileError);
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we couldn't connect your call. Please try again later.</Say>
  <Hangup/>
</Response>`, {
        headers: { 'Content-Type': 'text/xml', ...buildCorsHeaders(req) }
      });
    }

    // Update call record to indicate AI backup was triggered
    await supabase
      .from('calls')
      .update({
        routing_status: 'ai_handling',
        ai_handled: true,
        ai_backup_triggered: true,
        contractor_answered: false,
      })
      .eq('call_sid', callSid);

    // Update call session status and initialize conversation
    await supabase
      .from('call_sessions')
      .update({ 
        status: 'active',
        conversation_history: []
      })
      .eq('call_sid', callSid);

    // Greeting - acknowledges missed call warmly
    const greeting = aiProfile.custom_greeting || 
      `Hey there! Thanks for calling ${aiProfile.business_name}. ${aiProfile.contractor_name || 'We'} couldn't grab the phone just now, but I'm here to help. What can I do for you?`;

    // Use Gather to start the conversation
    const actionUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-inbound`;
    
    const gatherTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear anything. Please call back if you need assistance. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(gatherTwiml, {
      headers: { 'Content-Type': 'text/xml', ...buildCorsHeaders(req) }
    });

  } catch (error) {
    console.error('Error in fallback handler:', error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but an error occurred. Please try calling again.</Say>
  <Hangup/>
</Response>`, {
      headers: { 'Content-Type': 'text/xml', ...buildCorsHeaders(req) }
    });
  }
});

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
