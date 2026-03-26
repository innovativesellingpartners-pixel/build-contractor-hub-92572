import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

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
    return new Response(null, { headers: buildCorsHeaders(req) });
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

    // Decode JWT payload to get user ID
    const token = authHeader.replace('Bearer ', '');
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) throw new Error('Invalid token format');
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    if (!userId) throw new Error('No user ID in token');

    const user = { id: userId };

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
        state: stateToken,
        contractor_id: contractorId,
        provider: 'quickbooks',
        user_id: contractorId,
      });

    if (stateError) {
      console.error('Failed to store OAuth state:', stateError);
      throw new Error('Failed to initiate OAuth flow');
    }
    console.log('OAuth state stored successfully');

    // Build QuickBooks OAuth 2.0 authorization URL
    const redirectUri = `${supabaseUrl}/functions/v1/quickbooks-callback`;
    
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
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in quickbooks-connect:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    
    // Return proper error response with 401 for auth issues
    const status = message === 'Unauthorized' || message === 'No authorization header' ? 401 : 400;
    
    return new Response(
      JSON.stringify({ error: message, code: status }),
      { status, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
