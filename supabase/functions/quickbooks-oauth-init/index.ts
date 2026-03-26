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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-oauth-callback`;
    
    // QuickBooks OAuth 2.0 authorization URL
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', clientId!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', user.id); // Use user ID as state for security

    console.log('Generated OAuth URL:', authUrl.toString());

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in quickbooks-oauth-init:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});