import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const realmId = url.searchParams.get('realmId');

    console.log('QuickBooks callback received:', { hasCode: !!code, hasState: !!state, realmId });

    if (!code || !state || !realmId) {
      throw new Error('Missing required OAuth parameters');
    }

    // Use service role to validate state and get contractor ID
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate state token and get contractor ID
    const { data: oauthState, error: stateError } = await supabaseClient
      .from('oauth_states')
      .select('contractor_id, expires_at')
      .eq('state', state)
      .single();

    if (stateError || !oauthState) {
      console.error('Invalid or expired state token:', stateError);
      throw new Error('Invalid OAuth state');
    }

    // Check if state has expired
    if (oauthState.expires_at && new Date(oauthState.expires_at) < new Date()) {
      console.error('OAuth state expired');
      throw new Error('OAuth state expired');
    }

    const contractorId = oauthState.contractor_id;
    console.log('Valid OAuth state for contractor:', contractorId);

    // Delete used state token
    await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Exchange authorization code for tokens
    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const redirectUri = 'https://myct1.com/api/quickbooks/callback';

    console.log('Exchanging authorization code for tokens...');

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        'Accept': 'application/json',
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

    // Encrypt and store tokens securely
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const refreshExpiresAt = new Date(Date.now() + tokenData.x_refresh_token_expires_in * 1000);

    // Store encrypted tokens in quickbooks_connections table
    const { error: connectionError } = await supabaseClient.rpc('store_quickbooks_tokens', {
      p_user_id: contractorId,
      p_realm_id: realmId,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt.toISOString(),
      p_encryption_key: encryptionKey,
    });

    if (connectionError) {
      console.error('Failed to store encrypted tokens:', connectionError);
      throw new Error('Failed to save QuickBooks connection');
    }

    // Also update profiles table for backward compatibility
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        qb_realm_id: realmId,
        qb_token_expires_at: expiresAt.toISOString(),
        qb_refresh_token_expires_at: refreshExpiresAt.toISOString(),
        qb_last_sync_at: new Date().toISOString(),
      })
      .eq('id', contractorId);

    if (updateError) {
      console.error('Failed to update contractor profile:', updateError);
      // Don't throw - encryption is more important than profile update
    }

    console.log('QuickBooks connection saved successfully for contractor:', contractorId);

    // Redirect to portal integrations page with success message
    return Response.redirect('https://myct1.com/crm?qb_connected=true', 302);
  } catch (error) {
    console.error('Error in quickbooks-callback:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    
    // Redirect to portal with error message
    return Response.redirect(`https://myct1.com/crm?qb_error=${encodeURIComponent(message)}`, 302);
  }
});
