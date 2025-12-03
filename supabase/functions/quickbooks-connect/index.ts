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
  console.log('QuickBooks connect function invoked');
  console.log('Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      hasClientId: !!clientId,
    });

    if (!clientId) {
      console.error('QUICKBOOKS_CLIENT_ID is not configured');
      throw new Error('QuickBooks integration is not configured. Please contact support.');
    }

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get authenticated user - NEVER trust contractor ID from browser
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('Attempting to get user from session...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('User authentication error:', userError);
      throw new Error('Unauthorized');
    }
    
    if (!user) {
      console.error('No user found in session');
      throw new Error('Unauthorized');
    }

    const contractorId = user.id;
    console.log('Initiating QuickBooks OAuth for contractor:', contractorId);

    // Generate secure state token
    const stateToken = generateSecureState();
    console.log('Generated state token');

    // Store state in database with contractor ID using service role
    const serviceClient = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    );

    console.log('Storing OAuth state in database...');
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
    console.log('OAuth state stored successfully');

    // Build QuickBooks OAuth 2.0 authorization URL
    const redirectUri = 'https://myct1.com/api/quickbooks/callback';
    
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', stateToken);

    console.log('Generated OAuth URL successfully');
    console.log('Redirect URI:', redirectUri);

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
