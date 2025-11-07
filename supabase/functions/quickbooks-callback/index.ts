import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const realmId = url.searchParams.get('realmId');

    console.log('QuickBooks callback received:', { hasCode: !!code, hasState: !!state, realmId });

    if (!code || !state || !realmId) {
      throw new Error('Missing required parameters');
    }

    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('SUPABASE_URL');
    const redirectUri = `${appUrl}/functions/v1/quickbooks-callback`;

    console.log('Exchanging authorization code for tokens...');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, storing in profiles table');

    // Store tokens in profiles table using service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const accessTokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + tokenData.x_refresh_token_expires_in * 1000);

    const { error: dbError } = await supabaseClient
      .from('profiles')
      .update({
        qb_realm_id: realmId,
        qb_access_token: tokenData.access_token,
        qb_refresh_token: tokenData.refresh_token,
        qb_access_token_expires_at: accessTokenExpiresAt.toISOString(),
        qb_refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
        qb_last_sync_at: new Date().toISOString(),
      })
      .eq('id', state);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store connection');
    }

    console.log('QuickBooks connection stored successfully for user:', state);

    // Redirect back to app with success
    const frontendUrl = (appUrl || '').replace('.supabase.co', '.lovableproject.com');
    return Response.redirect(`${frontendUrl}/crm?qb_connected=true`, 302);
  } catch (error) {
    console.error('Error in quickbooks-callback:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    const errorAppUrl = Deno.env.get('APP_URL') || Deno.env.get('SUPABASE_URL') || '';
    const frontendUrl = errorAppUrl.replace('.supabase.co', '.lovableproject.com');
    return Response.redirect(`${frontendUrl}/crm?qb_error=${encodeURIComponent(message)}`, 302);
  }
});
