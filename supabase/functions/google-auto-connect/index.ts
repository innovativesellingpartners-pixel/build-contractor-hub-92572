import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user with anon client
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = claimsData.claims.sub as string;

    const { provider_token, provider_refresh_token } = await req.json();

    if (!provider_token) {
      return new Response(JSON.stringify({ error: 'No provider token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!provider_refresh_token) {
      console.log('No refresh token - skipping auto-connect (user may need to re-consent)');
      return new Response(JSON.stringify({ skipped: true, reason: 'no_refresh_token' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user email from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${provider_token}` }
    });
    const userInfo = await userInfoRes.json();
    if (!userInfo.email) {
      return new Response(JSON.stringify({ error: 'Could not fetch Google user info' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Auto-connecting Google services for user:', userId, 'email:', userInfo.email);

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const now = new Date().toISOString();
    const normalizedEmail = String(userInfo.email).trim().toLowerCase();

    // Get contractor_id for calendar connection
    let resolvedContractorId: string | null = null;
    const { data: membership } = await serviceClient
      .from('contractor_users')
      .select('contractor_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (membership) resolvedContractorId = membership.contractor_id;

    // Upsert calendar connection
    const { error: calError } = await serviceClient
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        contractor_id: resolvedContractorId,
        provider: 'google',
        calendar_email: normalizedEmail,
        access_token_encrypted: provider_token,
        refresh_token_encrypted: provider_refresh_token,
        expires_at: expiresAt,
        updated_at: now,
      }, {
        onConflict: 'user_id,provider',
        ignoreDuplicates: false,
      });

    if (calError) {
      console.warn('Calendar upsert failed, trying delete+insert:', calError);
      await serviceClient.from('calendar_connections').delete()
        .eq('user_id', userId).eq('provider', 'google');
      await serviceClient.from('calendar_connections').insert({
        user_id: userId,
        contractor_id: resolvedContractorId,
        provider: 'google',
        calendar_email: normalizedEmail,
        access_token_encrypted: provider_token,
        refresh_token_encrypted: provider_refresh_token,
        expires_at: expiresAt,
        created_at: now,
        updated_at: now,
      });
    }

    // Upsert email connection
    const { error: emailError } = await serviceClient
      .from('email_connections')
      .upsert({
        user_id: userId,
        provider: 'google',
        email_address: normalizedEmail,
        access_token_encrypted: provider_token,
        refresh_token_encrypted: provider_refresh_token,
        expires_at: expiresAt,
        updated_at: now,
      }, {
        onConflict: 'user_id,provider',
        ignoreDuplicates: false,
      });

    if (emailError) {
      console.warn('Email upsert failed, trying delete+insert:', emailError);
      await serviceClient.from('email_connections').delete()
        .eq('user_id', userId).eq('provider', 'google');
      await serviceClient.from('email_connections').insert({
        user_id: userId,
        provider: 'google',
        email_address: normalizedEmail,
        access_token_encrypted: provider_token,
        refresh_token_encrypted: provider_refresh_token,
        expires_at: expiresAt,
        created_at: now,
        updated_at: now,
      });
    }

    console.log('Auto-connect completed successfully for:', userId);

    return new Response(JSON.stringify({ success: true, email: normalizedEmail }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('google-auto-connect error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
