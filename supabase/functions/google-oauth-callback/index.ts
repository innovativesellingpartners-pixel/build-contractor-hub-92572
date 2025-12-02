import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Helper function to create an HTML redirect response
function createRedirectResponse(url: string): Response {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${url}">
        <script>window.location.href = "${url}";</script>
      </head>
      <body>
        <p>Redirecting... If you are not redirected automatically, <a href="${url}">click here</a>.</p>
      </body>
    </html>
  `;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
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
    const APP_URL = Deno.env.get('APP_URL') || 'https://myct1.com';

    console.log('Google OAuth callback received:', { code: !!code, state, error });

    if (error) {
      console.error('OAuth error from Google:', error);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=${error}`);
    }

    if (!code || !state) {
      console.error('Missing code or state');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=missing_params`);
    }

    // Create service role client to bypass RLS
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify state token
    console.log('Looking up oauth state:', state);
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'google')
      .maybeSingle();

    if (stateError) {
      console.error('Error querying state:', stateError);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=state_query_failed`);
    }

    if (!stateData) {
      console.error('State not found in database. State:', state);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=invalid_state`);
    }

    console.log('Found oauth state for user:', stateData.contractor_id, 'type:', stateData.type);

    // Check expiry
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State expired');
      await supabase.from('oauth_states').delete().eq('state', state);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=state_expired`);
    }

    // Delete used state
    await supabase.from('oauth_states').delete().eq('state', state);

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;

    // Exchange code for tokens
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

    console.log('Token exchange successful');

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = await userInfoResponse.json();
    console.log('Got user info:', userInfo.email);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store connection based on type
    if (stateData.type === 'calendar') {
      console.log('Saving calendar connection for user:', stateData.contractor_id);
      const { error: upsertError } = await supabase
        .from('calendar_connections')
        .upsert({
          user_id: stateData.contractor_id,
          provider: 'google',
          calendar_email: userInfo.email,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' });

      if (upsertError) {
        console.error('Failed to save calendar connection:', upsertError);
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=save_failed`);
      }

      console.log('Calendar connection saved successfully');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=calendar&provider=google&crm_section=calendar`);
    } else {
      console.log('Saving email connection for user:', stateData.contractor_id);
      const { error: upsertError } = await supabase
        .from('email_connections')
        .upsert({
          user_id: stateData.contractor_id,
          provider: 'google',
          email_address: userInfo.email,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' });

      if (upsertError) {
        console.error('Failed to save email connection:', upsertError);
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=save_failed`);
      }

      console.log('Email connection saved successfully');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=email&provider=google&crm_section=emails`);
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const APP_URL = Deno.env.get('APP_URL') || 'https://myct1.com';
    return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=server_error`);
  }
});
