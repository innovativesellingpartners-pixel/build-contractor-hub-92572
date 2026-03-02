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

// Helper function to create a reliable HTML redirect
function createRedirectResponse(url: string, message: string = "Connection Successful!"): Response {
  const safeUrl = ensureHttps(url);
  console.log('Creating redirect to:', safeUrl);
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <title>Redirecting...</title>
  <script>
    window.location.replace("${safeUrl}");
  </script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #f9fafb; margin: 0; }
    .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { color: #111827; margin: 0 0 10px; }
    p { color: #6b7280; margin: 10px 0; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>${message}</h2>
    <p>Redirecting you back to your dashboard...</p>
    <p style="margin-top: 20px; font-size: 14px;">
      <a href="${safeUrl}">Click here if not redirected automatically</a>
    </p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const OUTLOOK_CLIENT_ID = Deno.env.get('OUTLOOK_CLIENT_ID');
    const OUTLOOK_CLIENT_SECRET = Deno.env.get('OUTLOOK_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const APP_URL = ensureHttps(Deno.env.get('APP_URL') || 'https://myct1.com');

    console.log('Outlook OAuth callback received:', { code: !!code, state, error });
    console.log('APP_URL:', APP_URL);

    if (error) {
      console.error('OAuth error from Outlook:', error);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=${error}`, "Connection Failed");
    }

    if (!code || !state) {
      console.error('Missing code or state');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=missing_params`, "Connection Failed");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'outlook')
      .single();

    if (stateError || !stateData) {
      console.error('State not found:', stateError);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=invalid_state`, "Connection Failed");
    }

    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State expired');
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=state_expired`, "Connection Failed");
    }

    await supabase.from('oauth_states').delete().eq('state', state);

    const redirectUri = `${SUPABASE_URL}/functions/v1/outlook-oauth-callback`;

    console.log('Exchanging code for tokens');
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID!,
        client_secret: OUTLOOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token error:', tokens);
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=token_exchange_failed`, "Connection Failed");
    }

    console.log('Token exchange successful');

    // Get user info from Microsoft Graph
    let userEmail = '';
    try {
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const userInfo = await userInfoResponse.json();
      console.log('Graph API response:', JSON.stringify(userInfo));
      userEmail = userInfo.mail || userInfo.userPrincipalName || '';
    } catch (graphErr) {
      console.error('Graph API error:', graphErr);
    }

    // Fallback: decode email from ID token if Graph API failed
    if (!userEmail && tokens.id_token) {
      try {
        const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        userEmail = payload.email || payload.preferred_username || payload.upn || '';
        console.log('Got email from id_token:', userEmail);
      } catch (e) {
        console.error('Failed to decode id_token:', e);
      }
    }

    // Last resort: get email from the oauth state user
    if (!userEmail) {
      const { data: userData } = await supabase.auth.admin.getUserById(stateData.user_id);
      userEmail = userData?.user?.email || 'unknown@outlook.com';
      console.log('Using auth email as fallback:', userEmail);
    }

    console.log('Final user email:', userEmail);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    if (stateData.type === 'calendar') {
      console.log('Saving calendar connection for user:', stateData.user_id);
      
      // First delete any existing connection
      await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', stateData.user_id)
        .eq('provider', 'outlook');
      
      const { error: insertError } = await supabase
        .from('calendar_connections')
        .insert({
          user_id: stateData.user_id,
          provider: 'outlook',
          calendar_email: userEmail,
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
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=calendar&provider=outlook&crm_section=calendar`, "Outlook Calendar Connected!");
    } else {
      console.log('Saving email connection for user:', stateData.user_id);
      
      // First delete any existing connection
      await supabase
        .from('email_connections')
        .delete()
        .eq('user_id', stateData.user_id)
        .eq('provider', 'outlook');
      
      const { error: insertError } = await supabase
        .from('email_connections')
        .insert({
          user_id: stateData.user_id,
          provider: 'outlook',
          email_address: userEmail,
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
      return createRedirectResponse(`${APP_URL}/dashboard?oauth_success=email&provider=outlook&crm_section=emails`, "Outlook Email Connected!");
    }
  } catch (error) {
    console.error('Outlook OAuth callback error:', error);
    const APP_URL = ensureHttps(Deno.env.get('APP_URL') || 'https://myct1.com');
    return createRedirectResponse(`${APP_URL}/dashboard?oauth_error=server_error`, "Connection Failed");
  }
});
