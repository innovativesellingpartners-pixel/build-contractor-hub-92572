import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

function ensureHttps(url: string): string {
  if (!url) return 'https://myct1.com';
  if (url.startsWith('ttps://')) url = 'h' + url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  return url;
}

function createRedirectResponse(url: string, _message: string = "Connection Successful!"): Response {
  const safeUrl = ensureHttps(url);
  console.log('Creating redirect to:', safeUrl);
  return new Response(null, {
    status: 302,
    headers: { 
      'Location': safeUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
  });
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const APP_URL = ensureHttps(Deno.env.get('APP_URL') || 'https://myct1.com');

    console.log('Google OAuth callback received:', { code: !!code, state, error });

    if (error) {
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=${error}`);
    }

    if (!code || !state) {
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=missing_params`);
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'google')
      .maybeSingle();

    if (stateError || !stateData) {
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=invalid_state`);
    }

    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', state);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=state_expired`);
    }

    await supabase.from('oauth_states').delete().eq('state', state);

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;

    console.log('Exchanging code for tokens');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=token_exchange_failed`);
    }

    console.log('Token exchange successful, refresh_token present:', !!tokens.refresh_token);

    // CRITICAL: If no refresh token, the connection will break. Abort with clear error.
    if (!tokens.refresh_token) {
      console.error('No refresh token returned by Google - user may need to revoke app access and reconnect');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=no_refresh_token`);
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = await userInfoResponse.json();
    console.log('Got user info:', userInfo.email);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const now = new Date().toISOString();

    const normalizedEmail = String(userInfo.email || '').trim().toLowerCase();
    
    // Resolve contractor_id for calendar_connections FK
    let resolvedContractorId: string | null = null;
    const { data: membership } = await supabase
      .from('contractor_users')
      .select('contractor_id')
      .eq('user_id', stateData.contractor_id)
      .limit(1)
      .maybeSingle();
    if (membership) resolvedContractorId = membership.contractor_id;

    const saveCalendar = async () => {
      const { error: upsertError } = await supabase
        .from('calendar_connections')
        .upsert({
          user_id: stateData.contractor_id,
          contractor_id: resolvedContractorId,
          provider: 'google',
          calendar_email: normalizedEmail,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: now,
        }, { onConflict: 'user_id,provider', ignoreDuplicates: false });

      if (upsertError) {
        console.warn('Calendar upsert failed, trying delete+insert:', upsertError);
        await supabase.from('calendar_connections').delete()
          .eq('user_id', stateData.contractor_id).eq('provider', 'google');
        const { error: insertError } = await supabase.from('calendar_connections').insert({
          user_id: stateData.contractor_id,
          contractor_id: resolvedContractorId,
          provider: 'google',
          calendar_email: normalizedEmail,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          created_at: now,
          updated_at: now,
        });
        if (insertError) throw insertError;
      }
      console.log('Calendar connection saved successfully');
    };

    const saveEmail = async () => {
      const { error: upsertError } = await supabase
        .from('email_connections')
        .upsert({
          user_id: stateData.contractor_id,
          provider: 'google',
          email_address: normalizedEmail,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: now,
        }, { onConflict: 'user_id,provider', ignoreDuplicates: false });

      if (upsertError) {
        console.warn('Email upsert failed, trying delete+insert:', upsertError);
        await supabase.from('email_connections').delete()
          .eq('user_id', stateData.contractor_id).eq('provider', 'google');
        const { error: insertError } = await supabase.from('email_connections').insert({
          user_id: stateData.contractor_id,
          provider: 'google',
          email_address: normalizedEmail,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          created_at: now,
          updated_at: now,
        });
        if (insertError) throw insertError;
      }
      console.log('Email connection saved successfully');
    };

    try {
      if (stateData.type === 'both') {
        console.log('Saving both calendar and email connections for user:', stateData.contractor_id);
        await Promise.all([saveCalendar(), saveEmail()]);
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=both&provider=google`);
      } else if (stateData.type === 'calendar') {
        console.log('Saving calendar connection for user:', stateData.contractor_id);
        await saveCalendar();
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=calendar&provider=google&crm_section=calendar`);
      } else {
        console.log('Saving email connection for user:', stateData.contractor_id);
        await saveEmail();
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=email&provider=google&crm_section=emails`);
      }
    } catch (saveError) {
      console.error('Failed to save connection:', saveError);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=save_failed`);
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const APP_URL = ensureHttps(Deno.env.get('APP_URL') || 'https://myct1.com');
    return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=server_error`);
  }
});
