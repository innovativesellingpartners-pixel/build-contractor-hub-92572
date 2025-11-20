import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const recordingUrl = url.searchParams.get('url');
    
    if (!recordingUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing recording URL' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Recording Proxy] Fetching recording:', recordingUrl);

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    // Fetch the recording from Twilio with authentication
    const twilioResponse = await fetch(recordingUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
      }
    });

    if (!twilioResponse.ok) {
      console.error('[Recording Proxy] Twilio fetch failed:', twilioResponse.status);
      throw new Error(`Failed to fetch recording: ${twilioResponse.statusText}`);
    }

    // Get the audio data
    const audioData = await twilioResponse.arrayBuffer();
    
    // Stream it back to the client
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('[Recording Proxy] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
