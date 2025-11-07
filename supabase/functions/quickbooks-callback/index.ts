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
      .eq('state_token', state)
      .single();

    if (stateError || !oauthState) {
      console.error('Invalid or expired state token:', stateError);
      throw new Error('Invalid OAuth state');
    }

    // Check if state has expired
    if (new Date(oauthState.expires_at) < new Date()) {
      console.error('OAuth state expired');
      throw new Error('OAuth state expired');
    }

    const contractorId = oauthState.contractor_id;
    console.log('Valid OAuth state for contractor:', contractorId);

    // Delete used state token
    await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('state_token', state);

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

    // Calculate expiration times
    const accessTokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    const refreshTokenExpiresAt = new Date(Date.now() + (tokenData.x_refresh_token_expires_in * 1000));

    // Update contractor profile with QuickBooks connection data
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        qb_realm_id: realmId,
        qb_access_token: tokenData.access_token,
        qb_refresh_token: tokenData.refresh_token,
        qb_access_token_expires_at: accessTokenExpiresAt.toISOString(),
        qb_refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
        qb_last_sync_at: new Date().toISOString(),
      })
      .eq('id', contractorId);

    if (updateError) {
      console.error('Failed to update contractor profile:', updateError);
      throw new Error('Failed to save QuickBooks connection');
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
