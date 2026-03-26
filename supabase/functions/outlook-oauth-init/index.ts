import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const OUTLOOK_CLIENT_ID = Deno.env.get('OUTLOOK_CLIENT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!OUTLOOK_CLIENT_ID) {
      throw new Error('OUTLOOK_CLIENT_ID not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { type } = await req.json(); // 'calendar' or 'email'
    
    // Define scopes based on type
    const scopes = type === 'calendar' 
      ? [
          'User.Read',
          'Calendars.ReadWrite',
          'offline_access',
          'openid',
          'email',
          'profile'
        ]
      : [
          'User.Read',
          'Mail.Read',
          'Mail.Send',
          'offline_access',
          'openid',
          'email',
          'profile'
        ];

    const state = crypto.randomUUID();
    
    console.log('Creating OAuth state for user:', user.id, 'type:', type, 'state:', state);
    
    const { error: insertError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        contractor_id: user.id, // Required field - contractor_id equals user_id
        provider: 'outlook',
        type,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
      // Force PostgREST to return the inserted row so we can detect silent failures
      .select('state');

    if (insertError) {
      console.error('Failed to insert OAuth state:', insertError);
      throw new Error('Failed to create OAuth state');
    }

    // Double-check the row exists (defensive against env/schema/policy misconfig)
    const { data: verifyRow, error: verifyError } = await supabase
      .from('oauth_states')
      .select('state, provider, type, user_id, contractor_id, expires_at')
      .eq('state', state)
      .eq('provider', 'outlook')
      .maybeSingle();

    if (verifyError || !verifyRow) {
      console.error('OAuth state verification failed:', {
        verifyError,
        hasRow: !!verifyRow,
        state,
        provider: 'outlook',
        type,
      });
      throw new Error('OAuth state verification failed');
    }
    
    console.log('OAuth state created successfully');

    const redirectUri = `${SUPABASE_URL}/functions/v1/outlook-oauth-callback`;
    
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', OUTLOOK_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Outlook OAuth init error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
