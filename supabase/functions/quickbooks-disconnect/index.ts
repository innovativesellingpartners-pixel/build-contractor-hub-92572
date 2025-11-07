import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
    console.log('Disconnecting QuickBooks for contractor:', contractorId);

    // Use service role to update profile
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clear QuickBooks connection data
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
      console.error('Failed to disconnect QuickBooks:', updateError);
      throw new Error('Failed to disconnect QuickBooks');
    }

    console.log('QuickBooks disconnected successfully for contractor:', contractorId);

    return new Response(
      JSON.stringify({ success: true, message: 'QuickBooks disconnected successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
