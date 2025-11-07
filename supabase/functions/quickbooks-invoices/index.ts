import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Refresh QuickBooks access token if expired
async function refreshAccessToken(profile: any, supabaseClient: any): Promise<string> {
  const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
  const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');

  console.log('Refreshing QuickBooks access token for user:', profile.id);

  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: profile.qb_refresh_token,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Update profile with new access token
  await supabaseClient
    .from('profiles')
    .update({
      qb_access_token: data.access_token,
      qb_access_token_expires_at: accessTokenExpiresAt.toISOString(),
    })
    .eq('id', profile.id);

  console.log('Access token refreshed successfully');
  return data.access_token;
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('QuickBooks invoices request from user:', user.id);

    // Get user's QuickBooks connection from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('qb_realm_id, qb_access_token, qb_refresh_token, qb_access_token_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.qb_realm_id) {
      throw new Error('QuickBooks not connected');
    }

    // Check if token needs refresh
    let accessToken = profile.qb_access_token;
    const expiresAt = new Date(profile.qb_access_token_expires_at);
    
    if (expiresAt <= new Date()) {
      accessToken = await refreshAccessToken(profile, supabaseClient);
    }

    // Parse request body for action
    const { action, invoiceData } = await req.json();
    const realmId = profile.qb_realm_id;

    console.log('QuickBooks API action:', action);

    let qbResponse;

    switch (action) {
      case 'list':
        // List invoices from QuickBooks
        qbResponse = await fetch(
          `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Invoice MAXRESULTS 100`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );
        break;

      case 'create':
        // Create invoice in QuickBooks
        qbResponse = await fetch(
          `https://quickbooks.api.intuit.com/v3/company/${realmId}/invoice`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(invoiceData),
          }
        );
        break;

      case 'sync':
        // Sync CT1 invoices to QuickBooks
        const { data: ct1Invoices } = await supabaseClient
          .from('invoices')
          .select('*')
          .eq('user_id', user.id);

        console.log(`Syncing ${ct1Invoices?.length || 0} CT1 invoices to QuickBooks`);

        // Update last sync timestamp
        await supabaseClient
          .from('profiles')
          .update({ qb_last_sync_at: new Date().toISOString() })
          .eq('id', user.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            syncedCount: ct1Invoices?.length || 0,
            message: 'Sync initiated'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error('Invalid action');
    }

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text();
      console.error('QuickBooks API error:', errorText);
      throw new Error('QuickBooks API request failed');
    }

    const data = await qbResponse.json();
    console.log('QuickBooks API request successful');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in quickbooks-invoices:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
