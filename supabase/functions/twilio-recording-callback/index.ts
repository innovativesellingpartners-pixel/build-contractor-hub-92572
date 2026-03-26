import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    console.log('[Recording Callback] Received webhook from Twilio');
    
    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const recordingSid = formData.get('RecordingSid')?.toString();
    const callSid = formData.get('CallSid')?.toString();
    const recordingUrl = formData.get('RecordingUrl')?.toString();
    const duration = formData.get('RecordingDuration')?.toString();
    const status = formData.get('RecordingStatus')?.toString();
    
    console.log('[Recording Callback] Data:', {
      recordingSid,
      callSid,
      recordingUrl,
      duration,
      status
    });

    if (!callSid || !recordingSid) {
      console.error('[Recording Callback] Missing required fields');
      return new Response('Missing required fields', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update call_sessions with recording info
    const { error } = await supabase
      .from('call_sessions')
      .update({
        recording_url: recordingUrl ? recordingUrl + '.mp3' : null, // Add .mp3 for direct download
        recording_sid: recordingSid,
        recording_duration: duration ? parseInt(duration) : null,
        recording_status: status === 'completed' ? 'completed' : status || 'completed'
      })
      .eq('call_sid', callSid);

    if (error) {
      console.error('[Recording Callback] Database update error:', error);
      throw error;
    }

    console.log('[Recording Callback] Successfully updated call_sessions');
    
    return new Response('OK', { 
      status: 200,
      headers: buildCorsHeaders(req) 
    });
    
  } catch (error) {
    console.error('[Recording Callback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
