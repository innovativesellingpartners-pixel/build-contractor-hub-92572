import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractorProfile {
  id: string;
  qb_realm_id: string | null;
  qb_access_token: string | null;
  qb_refresh_token: string | null;
  qb_access_token_expires_at: string | null;
  qb_refresh_token_expires_at: string | null;
}

// Helper function to get valid QuickBooks access token with auto-refresh
async function getValidQuickBooksAccessToken(contractorId: string): Promise<{ accessToken: string; realmId: string }> {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Load contractor profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, qb_realm_id, qb_access_token, qb_refresh_token, qb_access_token_expires_at, qb_refresh_token_expires_at')
    .eq('id', contractorId)
    .single();

  if (profileError || !profile) {
    console.error('Failed to load contractor profile:', profileError);
    throw new Error('Contractor not found');
  }

  const contractor = profile as ContractorProfile;

  // Check if QuickBooks is connected
  if (!contractor.qb_realm_id || !contractor.qb_access_token || !contractor.qb_refresh_token) {
    throw new Error('QuickBooks not connected for this contractor');
  }

  const realmId = contractor.qb_realm_id;

  // Check if access token is still valid (with 5 minute safety buffer)
  const expiresAt = new Date(contractor.qb_access_token_expires_at!);
  const safetyBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  const now = new Date();

  if (expiresAt.getTime() > now.getTime() + safetyBuffer) {
    console.log('Using existing valid access token');
    return { accessToken: contractor.qb_access_token, realmId };
  }

  // Access token expired or expiring soon - refresh it
  console.log('Access token expired, refreshing...');

  const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
  const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');

  const refreshResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: contractor.qb_refresh_token,
    }).toString(),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    console.error('Token refresh failed:', errorText);
    throw new Error('Failed to refresh QuickBooks access token. Please reconnect your QuickBooks account.');
  }

  const tokenData = await refreshResponse.json();
  console.log('Token refresh successful');

  // Calculate new expiration times
  const newAccessTokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
  const newRefreshTokenExpiresAt = new Date(Date.now() + (tokenData.x_refresh_token_expires_in * 1000));

  // Update contractor profile with new tokens
  const { error: updateError } = await supabaseClient
    .from('profiles')
    .update({
      qb_access_token: tokenData.access_token,
      qb_refresh_token: tokenData.refresh_token,
      qb_access_token_expires_at: newAccessTokenExpiresAt.toISOString(),
      qb_refresh_token_expires_at: newRefreshTokenExpiresAt.toISOString(),
    })
    .eq('id', contractorId);

  if (updateError) {
    console.error('Failed to update tokens:', updateError);
    throw new Error('Failed to save refreshed tokens');
  }

  return { accessToken: tokenData.access_token, realmId };
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

    // Get authenticated user - NEVER trust contractor ID from browser
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    const contractorId = user.id;
    console.log('Fetching QuickBooks invoices for contractor:', contractorId);

    // Get valid access token (with auto-refresh if needed)
    const { accessToken, realmId } = await getValidQuickBooksAccessToken(contractorId);

    // Query QuickBooks Online API for invoices
    const qbQuery = 'SELECT * FROM Invoice STARTPOSITION 1 MAXRESULTS 50';
    const qbUrl = `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(qbQuery)}`;

    console.log('Querying QuickBooks API for invoices...');

    const qbResponse = await fetch(qbUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text();
      console.error('QuickBooks API error:', errorText);
      throw new Error('Failed to fetch invoices from QuickBooks');
    }

    const qbData = await qbResponse.json();
    console.log('QuickBooks API request successful');

    // Parse and clean the response
    const invoices = (qbData.QueryResponse?.Invoice || []).map((inv: any) => ({
      invoiceId: inv.Id,
      docNumber: inv.DocNumber,
      customerName: inv.CustomerRef?.name || 'Unknown',
      customerId: inv.CustomerRef?.value || null,
      totalAmount: parseFloat(inv.TotalAmt || '0'),
      balance: parseFloat(inv.Balance || '0'),
      status: inv.Balance > 0 ? 'Unpaid' : 'Paid',
      invoiceDate: inv.TxnDate || null,
      dueDate: inv.DueDate || null,
      emailStatus: inv.EmailStatus || null,
      printStatus: inv.PrintStatus || null,
    }));

    console.log(`Returning ${invoices.length} invoices`);

    return new Response(
      JSON.stringify({ 
        success: true,
        invoices,
        count: invoices.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in quickbooks-invoices:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
