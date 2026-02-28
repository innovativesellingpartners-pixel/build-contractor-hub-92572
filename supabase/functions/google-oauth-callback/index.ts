import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Helper function to ensure URL has https://
function ensureHttps(url: string): string {
  if (!url) return 'https://myct1.com';
  // Fix common typos
  if (url.startsWith('ttps://')) {
    url = 'h' + url;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

// Helper function to create a direct HTTP redirect
function createRedirectResponse(url: string, _message: string = "Connection Successful!"): Response {
  // Ensure URL is valid
  const safeUrl = ensureHttps(url);
  console.log('Creating redirect to:', safeUrl);
  
  // Use a 302 redirect which is more reliable than HTML-based redirects
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
    console.log('APP_URL:', APP_URL);

    if (error) {
      console.error('OAuth error from Google:', error);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=${error}`, "Connection Failed");
    }

    if (!code || !state) {
      console.error('Missing code or state');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=missing_params`, "Connection Failed");
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
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=state_query_failed`, "Connection Failed");
    }

    if (!stateData) {
      console.error('State not found in database. State:', state);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=invalid_state`, "Connection Failed");
    }

    console.log('Found oauth state for user:', stateData.contractor_id, 'type:', stateData.type);

    // Check expiry
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State expired');
      await supabase.from('oauth_states').delete().eq('state', state);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=state_expired`, "Connection Failed");
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
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=token_exchange_failed`, "Connection Failed");
    }

    console.log('Token exchange successful');
    console.log('Access token length:', tokens.access_token?.length);
    console.log('Refresh token present:', !!tokens.refresh_token);
    console.log('Expires in:', tokens.expires_in);

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
      
      // Resolve contractor_id: look up the contractor this user belongs to
      let resolvedContractorId: string | null = null;
      const { data: membership } = await supabase
        .from('contractor_users')
        .select('contractor_id')
        .eq('user_id', stateData.contractor_id)
        .limit(1)
        .maybeSingle();
      
      if (membership) {
        resolvedContractorId = membership.contractor_id;
      }
      
      // First delete any existing connection to ensure clean state
      await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', stateData.contractor_id)
        .eq('provider', 'google');
      
      const { error: insertError } = await supabase
        .from('calendar_connections')
        .insert({
          user_id: stateData.contractor_id,
          contractor_id: resolvedContractorId,
          provider: 'google',
          calendar_email: userInfo.email,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to save calendar connection:', insertError);
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=save_failed`, "Connection Failed");
      }

      console.log('Calendar connection saved successfully');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=calendar&provider=google&crm_section=calendar`, "Google Calendar Connected!");
    } else {
      console.log('Saving email connection for user:', stateData.contractor_id);
      
      // First delete any existing connection to ensure clean state
      await supabase
        .from('email_connections')
        .delete()
        .eq('user_id', stateData.contractor_id)
        .eq('provider', 'google');
      
      const { error: insertError } = await supabase
        .from('email_connections')
        .insert({
          user_id: stateData.contractor_id,
          provider: 'google',
          email_address: userInfo.email,
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to save email connection:', insertError);
        return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=save_failed`, "Connection Failed");
      }

      console.log('Email connection saved successfully');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=email&provider=google&crm_section=emails`, "Gmail Connected!");
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const APP_URL = ensureHttps(Deno.env.get('APP_URL') || 'https://myct1.com');
    return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=server_error`, "Connection Failed");
  }
});
