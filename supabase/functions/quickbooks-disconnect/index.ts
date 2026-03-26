import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT payload to get user ID
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) throw new Error('Invalid token format');
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    if (!userId) throw new Error('No user ID in token');

    const user = { id: userId };

    const contractorId = user.id;
    console.log('Disconnecting QuickBooks for contractor:', contractorId);

    // Use service role for DB operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Retrieve encrypted tokens so we can revoke with Intuit
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    let accessTokenToRevoke: string | null = null;

    if (encryptionKey) {
      try {
        const { data: tokenData } = await serviceClient.rpc('get_quickbooks_tokens', {
          p_user_id: contractorId,
          p_encryption_key: encryptionKey,
        });
        if (tokenData && tokenData.length > 0) {
          accessTokenToRevoke = tokenData[0].access_token;
        }
      } catch (e) {
        console.warn('Could not retrieve tokens for revocation:', e);
      }
    }

    // Step 2: Revoke token with Intuit (best-effort)
    if (accessTokenToRevoke) {
      const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
      const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');

      if (clientId && clientSecret) {
        try {
          const revokeResponse = await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
              'Accept': 'application/json',
            },
            body: new URLSearchParams({
              token: accessTokenToRevoke,
            }).toString(),
          });
          console.log('Intuit token revocation status:', revokeResponse.status);
        } catch (e) {
          console.warn('Intuit token revocation failed (best-effort):', e);
        }
      }
    }

    // Step 3: Delete from quickbooks_connections table
    const { error: deleteError } = await serviceClient
      .from('quickbooks_connections')
      .delete()
      .eq('user_id', contractorId);

    if (deleteError) {
      console.warn('Failed to delete quickbooks_connections row:', deleteError);
    }

    // Step 4: Clear QuickBooks fields on profiles
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({
        qb_realm_id: null,
        qb_access_token: null,
        qb_refresh_token: null,
        qb_access_token_expires_at: null,
        qb_refresh_token_expires_at: null,
        qb_last_sync_at: null,
      })
      .eq('id', contractorId);

    if (updateError) {
      console.error('Failed to clear profile QB fields:', updateError);
      throw new Error('Failed to disconnect QuickBooks');
    }

    console.log('QuickBooks disconnected successfully for contractor:', contractorId);

    return new Response(
      JSON.stringify({ success: true, message: 'QuickBooks disconnected successfully' }),
      { 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in quickbooks-disconnect:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        status: 400, 
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  }
});
