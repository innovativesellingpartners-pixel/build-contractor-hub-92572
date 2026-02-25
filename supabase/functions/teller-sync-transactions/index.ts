import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const cert = Deno.env.get('TELLER_CERTIFICATE');
    const key = Deno.env.get('TELLER_PRIVATE_KEY');

    // Get all active teller connections for user
    const { data: connections, error: connErr } = await serviceClient
      .from('teller_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    console.log('Connections found:', connections?.length, 'Error:', connErr);

    if (!connections?.length) {
      return new Response(JSON.stringify({ synced: 0, message: 'No active connections' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalSynced = 0;
    const errors: string[] = [];

    // Check if mTLS certs are available
    const hasMtls = cert && key;
    let tlsClient: any = null;

    if (hasMtls) {
      try {
        tlsClient = Deno.createHttpClient({
          certChain: cert,
          privateKey: key,
        });
      } catch (e) {
        console.error('Failed to create TLS client:', e);
      }
    }

    for (const conn of connections) {
      try {
        // Extract the real access token
        // In development, tokens are stored as masked placeholders
        let accessToken = '';
        const stored = conn.teller_access_token_encrypted || '';
        
        if (stored.startsWith('teller_tok_') || stored.startsWith('encrypted:')) {
          // This is a masked/placeholder token - can't make API calls
          console.log(`Connection ${conn.id} has placeholder token, skipping API fetch`);
          errors.push(`Connection ${conn.institution_name}: token not available for API calls (development mode)`);
          continue;
        }

        // Try to decrypt if it looks encrypted
        try {
          const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
          if (encryptionKey) {
            const { data: decrypted } = await serviceClient.rpc('pgp_sym_decrypt_bytea', {
              data: stored,
              key: encryptionKey,
            });
            if (decrypted) accessToken = decrypted;
          }
        } catch (decryptErr) {
          console.error('Decryption failed, trying raw:', decryptErr);
          accessToken = stored;
        }

        if (!accessToken) {
          errors.push(`Connection ${conn.institution_name}: could not retrieve access token`);
          continue;
        }

        if (!tlsClient) {
          errors.push(`Connection ${conn.institution_name}: mTLS certificates not configured`);
          continue;
        }

        // First fetch accounts if we don't have account_id
        if (!conn.account_id) {
          console.log('No account_id, fetching accounts for enrollment:', conn.teller_enrollment_id);
          const accountsRes = await fetch('https://api.teller.io/accounts', {
            headers: { 'Authorization': `Basic ${btoa(accessToken + ':')}` },
            // @ts-ignore
            client: tlsClient,
          });

          if (accountsRes.ok) {
            const accounts: any[] = await accountsRes.json();
            console.log('Fetched accounts:', accounts.length);
            
            // Process transactions for each account
            for (const acct of accounts) {
              const txnRes = await fetch(`https://api.teller.io/accounts/${acct.id}/transactions`, {
                headers: { 'Authorization': `Basic ${btoa(accessToken + ':')}` },
                // @ts-ignore
                client: tlsClient,
              });

              if (txnRes.ok) {
                const transactions: any[] = await txnRes.json();
                for (const txn of transactions) {
                  const { error: upsertErr } = await serviceClient
                    .from('teller_transactions')
                    .upsert({
                      contractor_id: user.id,
                      teller_connection_id: conn.id,
                      teller_transaction_id: txn.id,
                      amount: parseFloat(txn.amount),
                      description: txn.description,
                      vendor: txn.details?.counterparty?.name || txn.description,
                      category: txn.details?.category || txn.type,
                      transaction_date: txn.date,
                      status: txn.status,
                    }, { onConflict: 'teller_transaction_id' });

                  if (!upsertErr) totalSynced++;
                }
              }
            }
          } else {
            console.error('Accounts fetch failed:', accountsRes.status);
          }
        } else {
          // Fetch transactions for specific account
          const txnRes = await fetch(`https://api.teller.io/accounts/${conn.account_id}/transactions`, {
            headers: { 'Authorization': `Basic ${btoa(accessToken + ':')}` },
            // @ts-ignore
            client: tlsClient,
          });

          if (txnRes.ok) {
            const transactions: any[] = await txnRes.json();
            for (const txn of transactions) {
              const { error: upsertErr } = await serviceClient
                .from('teller_transactions')
                .upsert({
                  contractor_id: user.id,
                  teller_connection_id: conn.id,
                  teller_transaction_id: txn.id,
                  amount: parseFloat(txn.amount),
                  description: txn.description,
                  vendor: txn.details?.counterparty?.name || txn.description,
                  category: txn.details?.category || txn.type,
                  transaction_date: txn.date,
                  status: txn.status,
                }, { onConflict: 'teller_transaction_id' });

              if (!upsertErr) totalSynced++;
            }
          }
        }

        // Update last_synced_at
        await serviceClient
          .from('teller_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', conn.id);

      } catch (e: any) {
        console.error(`Sync error for connection ${conn.id}:`, e);
        errors.push(`Connection ${conn.institution_name}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      synced: totalSynced, 
      success: true,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 && totalSynced === 0 
        ? 'Connections found but tokens are in development mode. Re-connect your bank to enable transaction sync.'
        : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Teller sync transactions error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
