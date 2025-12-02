import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const APP_URL = Deno.env.get('APP_URL') || 'https://faqrzzodtmsybofakcvv.lovableproject.com';

    if (error) {
      return Response.redirect(`${APP_URL}/dashboard?oauth_error=${error}`);
    }

    if (!code || !state) {
      return Response.redirect(`${APP_URL}/dashboard?oauth_error=missing_params`);
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // Verify state token
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'google')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid state:', stateError);
      return Response.redirect(`${APP_URL}/dashboard?oauth_error=invalid_state`);
    }

    // Check expiry
    if (new Date(stateData.expires_at) < new Date()) {
      return Response.redirect(`${APP_URL}/dashboard?oauth_error=state_expired`);
    }

    // Delete used state
    await supabase.from('oauth_states').delete().eq('state', state);

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;

    // Exchange code for tokens
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
      console.error('Token error:', tokens);
      return Response.redirect(`${APP_URL}/dashboard?oauth_error=token_exchange_failed`);
    }

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = await userInfoResponse.json();

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store connection based on type
    if (stateData.type === 'calendar') {
      // Upsert calendar connection
      await supabase
        .from('calendar_connections')
        .upsert({
          user_id: stateData.user_id,
          provider: 'google',
          calendar_email: userInfo.email,
          access_token_encrypted: tokens.access_token, // In production, encrypt this
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' });

      return Response.redirect(`${APP_URL}/dashboard?oauth_success=calendar&provider=google`);
    } else {
      // Upsert email connection
      await supabase
        .from('email_connections')
        .upsert({
          user_id: stateData.user_id,
          provider: 'google',
          email_address: userInfo.email,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' });

      return Response.redirect(`${APP_URL}/dashboard?oauth_success=email&provider=google`);
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const APP_URL = Deno.env.get('APP_URL') || 'https://faqrzzodtmsybofakcvv.lovableproject.com';
    return Response.redirect(`${APP_URL}/dashboard?oauth_error=server_error`);
  }
});
