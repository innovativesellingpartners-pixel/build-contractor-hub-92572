import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const realmId = url.searchParams.get('realmId');

    if (!code || !state || !realmId) {
      throw new Error('Missing required parameters');
    }

    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-oauth-callback`;

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
    console.log('Token exchange successful');

    // Store encrypted tokens in database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const { error: dbError } = await supabaseClient.rpc('store_quickbooks_tokens', {
      p_user_id: state,
      p_realm_id: realmId,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt.toISOString(),
      p_encryption_key: encryptionKey,
    });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store connection');
    }

    // Redirect back to app with success
    const appUrl = Deno.env.get('APP_URL') || 'https://build-contractor-hub-92572.lovable.app';
    return Response.redirect(`${appUrl}/dashboard?qb_connected=true`, 302);
  } catch (error) {
    console.error('Error in quickbooks-oauth-callback:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    const appUrl = Deno.env.get('APP_URL') || 'https://build-contractor-hub-92572.lovable.app';
    return Response.redirect(`${appUrl}/dashboard?qb_error=${encodeURIComponent(message)}`, 302);
  }
});