import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the Twilio status callback
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const dialCallStatus = formData.get('DialCallStatus') as string;
    const dialCallSid = formData.get('DialCallSid') as string;
    
    console.log('Dial status update:', {
      callSid,
      callStatus,
      dialCallStatus,
      dialCallSid,
      timestamp: new Date().toISOString()
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update call record with dial status
    if (dialCallStatus === 'answered' || dialCallStatus === 'completed') {
      await supabase
        .from('calls')
        .update({
          contractor_answered: true,
          routing_status: 'contractor_answered',
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);
      
      console.log('Contractor answered the call');
    } else if (dialCallStatus === 'no-answer' || dialCallStatus === 'busy' || dialCallStatus === 'failed') {
      console.log(`Contractor did not answer: ${dialCallStatus}`);
      
      await supabase
        .from('calls')
        .update({
          routing_status: `dial_${dialCallStatus}`,
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);
    }

    return new Response('OK', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Error in status callback:', error);
    return new Response('OK', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});
