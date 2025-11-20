/**
 * Twilio Voice Fallback Handler
 * 
 * This endpoint handles calls that weren't answered by the contractor
 * within the configured timeout period. It connects them to the AI stream handler.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const dialCallStatus = formData.get('DialCallStatus') as string;
    
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
        headers: { 'Content-Type': 'text/xml', ...corsHeaders }
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
        headers: { 'Content-Type': 'text/xml', ...corsHeaders }
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

    // Update call session status
    await supabase
      .from('call_sessions')
      .update({ status: 'active' })
      .eq('call_sid', callSid);

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

    // Use custom greeting or default (mentioning the contractor couldn't answer)
    const greeting = `Hello, thank you for calling ${aiProfile.business_name}. I apologize, but ${aiProfile.contractor_name || 'the contractor'} couldn't answer right now. I'm the AI assistant and I'm happy to help you. How can I assist you today?`;

    // Get voice ID (default to 'alloy' if not set)
    const voiceId = aiProfile.voice_id || 'alloy';

    // Store configuration in session for WebSocket handler
    await supabase.from('call_sessions').update({
      conversation_history: [{
        system_prompt: systemPrompt,
        greeting: greeting,
        voice_id: voiceId,
        contractor_id: session.contractor_id,
        business_name: aiProfile.business_name
      }]
    }).eq('call_sid', callSid);

    // Return TwiML that connects to our WebSocket stream handler
    const streamUrl = `wss://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-stream-handler`;
    
    const streamTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="callSid" value="${callSid}" />
    </Stream>
  </Connect>
</Response>`;

    return new Response(streamTwiml, {
      headers: { 'Content-Type': 'text/xml', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in fallback handler:', error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but an error occurred. Please try calling again.</Say>
  <Hangup/>
</Response>`, {
      headers: { 'Content-Type': 'text/xml', ...corsHeaders }
    });
  }
});
