import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function refreshToken(connection: any, supabaseClient: any, decryptedRefreshToken: string) {
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

  // Re-encrypt and store new tokens using secure function
  await supabaseClient.rpc('store_quickbooks_tokens', {
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get connection for this user with decrypted tokens
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const { data: connectionData, error: connError } = await supabaseClient.rpc('get_quickbooks_tokens', {
      p_user_id: user.id,
      p_encryption_key: encryptionKey,
    });

    if (connError || !connectionData || connectionData.length === 0) {
      throw new Error('QuickBooks not connected');
    }

    const connection = connectionData[0];

    // Check if token needs refresh
    const expiresAt = new Date(connection.expires_at);
    let accessToken = connection.access_token;
    
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshToken(connection, supabaseClient, connection.refresh_token);
    }

    const { endpoint } = await req.json();

    // Make QuickBooks API request
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

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in quickbooks-api:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});