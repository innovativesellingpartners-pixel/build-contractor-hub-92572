/**
 * Provision Twilio Number for Contractor
 * 
 * This endpoint allows paid contractors to provision their own Twilio phone number.
 * It purchases a local number from Twilio, configures the voice webhook, and stores
 * the number in the database linked to the contractor.
 * 
 * POST /functions/v1/provision-twilio-number
 * Body: { contractorId: string }
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
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token for auth check
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    console.log('Auth check:', { userError, userId: user?.id });
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contractorId = user.id;

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if contractor already has a phone number
    const { data: existingNumber } = await supabase
      .from('phone_numbers')
      .select('twilio_phone_number')
      .eq('contractor_id', contractorId)
      .eq('active', true)
      .single();

    if (existingNumber) {
      return new Response(
        JSON.stringify({ 
          error: 'Contractor already has a phone number',
          phone_number: existingNumber.twilio_phone_number
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if contractor has an active subscription OR has @myct1.com email
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, tier_id')
      .eq('user_id', contractorId)
      .eq('status', 'active')
      .single();

    // Also check profile for subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', contractorId)
      .single();

    console.log('Subscription check:', { subscription, profileTier: profile?.subscription_tier, userEmail: user.email });

    // Allow if they have active subscription OR have subscription tier in profile OR @myct1.com email
    const hasAccess = subscription || 
                      (profile?.subscription_tier && profile.subscription_tier !== 'trial') ||
                      user.email?.endsWith('@myct1.com');

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Active subscription required to provision a phone number' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const appUrl = Deno.env.get('APP_URL') || supabaseUrl;

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Twilio configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct voice webhook URL
    const voiceWebhookUrl = `${supabaseUrl}/functions/v1/twilio-voice-inbound`;

    console.log('Purchasing Twilio number for contractor:', contractorId);

    // Search for available phone numbers (US local numbers)
    const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/AvailablePhoneNumbers/US/Local.json?Limit=1`;
    
    const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
      },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Failed to search for available numbers:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to find available phone numbers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableNumbers = await searchResponse.json();
    
    if (!availableNumbers.available_phone_numbers || availableNumbers.available_phone_numbers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No phone numbers available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedNumber = availableNumbers.available_phone_numbers[0].phone_number;
    console.log('Selected number:', selectedNumber);

    // Purchase the phone number
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json`;
    
    const purchaseBody = new URLSearchParams({
      PhoneNumber: selectedNumber,
      VoiceUrl: voiceWebhookUrl,
      VoiceMethod: 'POST',
      FriendlyName: `CT1 - ${contractorId.substring(0, 8)}`,
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
      return new Response(
        JSON.stringify({ error: 'Failed to purchase phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purchaseResult = await purchaseResponse.json();
    const twilioSid = purchaseResult.sid;
    
    console.log('Successfully purchased number:', selectedNumber, 'SID:', twilioSid);

    // Store in database
    const { data: phoneNumberRecord, error: insertError } = await supabase
      .from('phone_numbers')
      .insert({
        contractor_id: contractorId,
        tenant_id: null, // Can be set later if multi-tenancy is needed
        twilio_phone_number: selectedNumber,
        twilio_sid: twilioSid,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store phone number in database:', insertError);
      // TODO: Consider releasing the Twilio number if database insert fails
      return new Response(
        JSON.stringify({ error: 'Failed to save phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Phone number provisioned successfully for contractor:', contractorId);

    return new Response(
      JSON.stringify({
        success: true,
        phone_number: selectedNumber,
        twilio_sid: twilioSid,
        contractor_id: contractorId,
        voice_webhook_url: voiceWebhookUrl,
        message: 'Phone number provisioned successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error provisioning Twilio number:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
