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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const contractorId = await getCurrentContractorId(supabase, authHeader);
    
    const body = await req.json().catch(() => ({}));
    const { start_date, end_date } = body;

    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all active bank account links for this contractor
    const { data: bankLinks, error: linksError } = await supabase
      .from('bank_account_links')
      .select('*')
      .eq('user_id', contractorId)
      .eq('status', 'active');

    if (linksError) {
      throw new Error(`Failed to fetch bank links: ${linksError.message}`);
    }

    if (!bankLinks || bankLinks.length === 0) {
      return new Response(
        JSON.stringify({ bankAccountLinks: [] }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const plaidClient = getPlaidClient();
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    const allResults = [];

    // Fetch transactions for each linked account
    for (const link of bankLinks) {
      try {
        // Decrypt access token
        const { data: decryptedToken, error: decryptError } = await supabase.rpc(
          'pgp_sym_decrypt',
          {
            data: link.plaid_access_token_encrypted,
            key: encryptionKey,
          }
        );

        if (decryptError || !decryptedToken) {
          console.error(`Failed to decrypt token for link ${link.id}`);
          continue;
        }

        // Fetch transactions using Plaid API
        const response = await plaidClient.transactionsGet({
          access_token: decryptedToken,
          start_date: startDate,
          end_date: endDate,
        });

        const transactions = response.data.transactions.map(t => ({
          transaction_id: t.transaction_id,
          date: t.date,
          name: t.name,
          amount: t.amount,
          iso_currency_code: t.iso_currency_code,
          merchant_name: t.merchant_name,
          categories: t.category,
          pending: t.pending,
        }));

        allResults.push({
          linkId: link.id,
          institutionName: link.plaid_institution_name,
          itemId: link.plaid_item_id,
          transactions,
        });

        console.log(`Fetched ${transactions.length} transactions for ${link.plaid_institution_name}`);

      } catch (error) {
        console.error(`Error fetching transactions for link ${link.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        bankAccountLinks: allResults,
        dateRange: { startDate, endDate },
      }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in plaid-transactions-sync:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
