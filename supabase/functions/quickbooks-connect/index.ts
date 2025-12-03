import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate cryptographically secure random state token
function generateSecureState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
    console.log('Initiating QuickBooks OAuth for contractor:', contractorId);

    // Generate secure state token
    const stateToken = generateSecureState();

    // Store state in database with contractor ID using service role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: stateError } = await serviceClient
      .from('oauth_states')
      .insert({
        state_token: stateToken,
        contractor_id: contractorId,
      });

    if (stateError) {
      console.error('Failed to store OAuth state:', stateError);
      throw new Error('Failed to initiate OAuth flow');
    }

    // Build QuickBooks OAuth 2.0 authorization URL
    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const redirectUri = 'https://myct1.com/api/quickbooks/callback';
    
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', clientId!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', stateToken);

    console.log('Generated OAuth URL:', authUrl.toString());

    // Return the OAuth URL for client-side redirect (not direct redirect)
    // This allows proper auth header handling
    return new Response(
      JSON.stringify({ authUrl: authUrl.toString(), success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in quickbooks-connect:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    
    // Return proper error response with 401 for auth issues
    const status = message === 'Unauthorized' || message === 'No authorization header' ? 401 : 400;
    
    return new Response(
      JSON.stringify({ error: message, code: status }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
