import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { getPlaidClient, getCurrentContractorId, validatePlaidConfig } from '../_shared/stripe-plaid.ts';
import { Products, CountryCode } from 'https://esm.sh/plaid@18.0.0';

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
    const plaidClient = getPlaidClient();

    // Create Plaid Link token
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: contractorId,
      },
      client_name: 'CT1',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    console.log(`Created Plaid link token for contractor ${contractorId}`);

    return new Response(
      JSON.stringify({ 
        link_token: response.data.link_token,
        expiration: response.data.expiration,
      }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in plaid-create-link-token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
