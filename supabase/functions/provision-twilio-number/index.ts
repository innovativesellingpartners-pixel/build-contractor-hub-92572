/**
 * Provision Twilio Number for Contractor
 * 
 * Admins can provision numbers for any user (even replacing existing ones).
 * Regular users can only provision once (if they don't already have one).
 * 
 * POST /functions/v1/provision-twilio-number
 * Body: { targetUserId?: string } — admins can pass a target user
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '').trim();

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Parse body
    let body: any = {};
    try { body = await req.json(); } catch (_) {}

    // Check if caller is admin
    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin';

    // Determine target contractor
    const targetUserId = body.targetUserId && isAdmin ? body.targetUserId : user.id;

    console.log('Provision request:', { callerId: user.id, isAdmin, targetUserId });

    // For regular users: block if they already have a number
    if (!isAdmin) {
      const { data: existingNumber } = await adminSupabase
        .from('phone_numbers')
        .select('twilio_phone_number')
        .eq('contractor_id', targetUserId)
        .eq('active', true)
        .single();

      if (existingNumber) {
        return new Response(
          JSON.stringify({ 
            error: 'You already have a phone number assigned. Contact an admin to change it.',
            phone_number: existingNumber.twilio_phone_number
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For admins: deactivate existing number before provisioning new one
    if (isAdmin) {
      await adminSupabase
        .from('phone_numbers')
        .update({ active: false })
        .eq('contractor_id', targetUserId)
        .eq('active', true);
    }

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(
        JSON.stringify({ error: 'Twilio configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voiceWebhookUrl = `${supabaseUrl}/functions/v1/twilio-voice-inbound`;
    const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    // Search for available numbers
    const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/AvailablePhoneNumbers/US/Local.json?Limit=1`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Basic ${basicAuth}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Failed to search numbers:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to find available phone numbers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableNumbers = await searchResponse.json();
    if (!availableNumbers.available_phone_numbers?.length) {
      return new Response(
        JSON.stringify({ error: 'No phone numbers available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedNumber = availableNumbers.available_phone_numbers[0].phone_number;

    // Purchase the number
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json`;
    const purchaseBody = new URLSearchParams({
      PhoneNumber: selectedNumber,
      VoiceUrl: voiceWebhookUrl,
      VoiceMethod: 'POST',
      FriendlyName: `CT1 - ${targetUserId.substring(0, 8)}`,
    });

    const purchaseResponse = await fetch(purchaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: purchaseBody.toString(),
    });

    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text();
      console.error('Failed to purchase number:', errorText);

      try {
        const twilioError = JSON.parse(errorText);
        if (twilioError?.code === 21404 && twilioError?.message?.includes('Trial accounts are allowed only one')) {
          return new Response(
            JSON.stringify({
              error: 'twilio_trial_limit',
              message: 'Twilio trial account limit reached. Release existing number or upgrade Twilio.',
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (_) {}

      return new Response(
        JSON.stringify({ error: 'Failed to purchase phone number', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purchaseResult = await purchaseResponse.json();
    const twilioSid = purchaseResult.sid;

    // Store in database
    const { error: insertError } = await adminSupabase
      .from('phone_numbers')
      .insert({
        contractor_id: targetUserId,
        tenant_id: null,
        twilio_phone_number: selectedNumber,
        twilio_sid: twilioSid,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store phone number:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        phone_number: selectedNumber,
        twilio_sid: twilioSid,
        contractor_id: targetUserId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error provisioning Twilio number:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
