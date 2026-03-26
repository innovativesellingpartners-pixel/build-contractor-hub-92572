import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { getPlaidClient, getCurrentContractorId, validatePlaidConfig } from '../_shared/stripe-plaid.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    validatePlaidConfig();
    
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const contractorId = await getCurrentContractorId(supabase, authHeader);
    const { public_token, institution_name } = await req.json();

    if (!public_token) {
      throw new Error('public_token is required');
    }

    const plaidClient = getPlaidClient();

    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = response.data;
    console.log(`Exchanged public token for item ${item_id} (contractor: ${contractorId})`);

    // Encrypt access token using pgcrypto
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Store bank account link with encrypted token
    const { error: insertError } = await supabase
      .from('bank_account_links')
      .insert({
        user_id: contractorId,
        plaid_item_id: item_id,
        plaid_access_token_encrypted: supabase.rpc('pgp_sym_encrypt', {
          data: access_token,
          key: encryptionKey,
        }),
        plaid_institution_name: institution_name || 'Unknown Bank',
        status: 'active',
      });

    if (insertError) {
      throw new Error(`Failed to store bank link: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        item_id,
        institution_name: institution_name || 'Unknown Bank',
      }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in plaid-exchange-token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
