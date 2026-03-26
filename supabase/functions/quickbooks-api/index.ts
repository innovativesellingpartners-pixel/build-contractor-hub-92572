import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { buildCorsHeaders } from '../_shared/cors.ts';

function getQBErrorMessage(status: number, body: any): string {
  switch (status) {
    case 401:
      return 'Your QuickBooks session has expired. Please reconnect your account.';
    case 403:
      return 'Access denied. Your QuickBooks subscription may have expired or permissions are insufficient.';
    case 429:
      return 'Rate limit reached. Please wait a moment and try again.';
    case 503:
      return 'QuickBooks is temporarily unavailable. Please try again in a few minutes.';
    default:
      if (status >= 500) return 'QuickBooks is experiencing issues. Please try again later.';
      if (body?.Fault?.Error?.[0]?.Detail) return body.Fault.Error[0].Detail;
      return `QuickBooks returned an error (${status}).`;
  }
}

async function refreshToken(connection: any, adminClient: any, decryptedRefreshToken: string) {
  const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
  const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
  const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');

  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptedRefreshToken,
    }).toString(),
  });

  const tokenData = await response.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await adminClient.rpc('store_quickbooks_tokens', {
    p_user_id: connection.user_id,
    p_realm_id: connection.realm_id,
    p_access_token: tokenData.access_token,
    p_refresh_token: tokenData.refresh_token,
    p_expires_at: expiresAt.toISOString(),
    p_encryption_key: encryptionKey,
  });

  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Decode JWT payload to get user ID (token is already verified by Supabase infrastructure)
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      throw new Error('Invalid token format');
    }
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    if (!userId) {
      throw new Error('No user ID in token');
    }
    
    console.log('Authenticated user:', userId);
    const user = { id: userId };

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const { data: connectionData, error: connError } = await adminClient.rpc('get_quickbooks_tokens', {
      p_user_id: user.id,
      p_encryption_key: encryptionKey,
    });

    if (connError) {
      console.error('QB connection error:', connError.message);
      throw new Error('QuickBooks not connected');
    }
    
    if (!connectionData || connectionData.length === 0) {
      throw new Error('QuickBooks not connected');
    }

    const connection = connectionData[0];

    // Check if token needs refresh
    const expiresAt = new Date(connection.expires_at);
    let accessToken = connection.access_token;
    
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshToken(connection, adminClient, connection.refresh_token);
    }

    const { endpoint } = await req.json();

    const qbResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${connection.realm_id}/${endpoint}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    const data = await qbResponse.json();

    if (!qbResponse.ok) {
      const friendlyMessage = getQBErrorMessage(qbResponse.status, data);
      console.error('QuickBooks API error:', qbResponse.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: friendlyMessage, qbStatus: qbResponse.status }),
        { status: qbResponse.status >= 500 ? 502 : 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Update last sync timestamp (best-effort)
    adminClient
      .from('profiles')
      .update({ qb_last_sync_at: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {});

    return new Response(
      JSON.stringify(data),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in quickbooks-api:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
