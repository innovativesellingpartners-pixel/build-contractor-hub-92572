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

    console.log('Syncing Teller transactions for user:', user.id);

    const cert = Deno.env.get('TELLER_CERTIFICATE');
    const key = Deno.env.get('TELLER_PRIVATE_KEY');

    // Get all active teller connections for user
    const { data: connections, error: connErr } = await serviceClient
      .from('teller_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    console.log('Active connections:', connections?.length, 'Error:', connErr?.message);

    if (!connections?.length) {
      return new Response(JSON.stringify({ synced: 0, message: 'No active connections' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalSynced = 0;
    const errors: string[] = [];

    // Create mTLS client if certs available
    let tlsClient: any = null;
    if (cert && key) {
      try {
        tlsClient = Deno.createHttpClient({
          certChain: cert,
          privateKey: key,
        });
        console.log('mTLS client created successfully');
      } catch (e) {
        console.error('Failed to create TLS client:', e);
      }
    } else {
      console.warn('TELLER_CERTIFICATE or TELLER_PRIVATE_KEY not configured');
    }

    for (const conn of connections) {
      try {
        // Extract the access token
        const stored = conn.teller_access_token_encrypted || '';
        let accessToken = '';

        if (!stored) {
          errors.push(`Connection ${conn.institution_name}: no token stored`);
          continue;
        }

        // In Teller development mode, tokens start with "teller_tok_" and are valid API tokens
        if (stored.startsWith('teller_tok_')) {
          accessToken = stored;
          console.log(`Connection ${conn.id}: using development token`);
        } else if (stored.startsWith('encrypted:')) {
          // Legacy prefix - strip and use
          accessToken = stored.replace('encrypted:', '');
        } else {
          // Try to decrypt if it looks encrypted (PGP encrypted data)
          try {
            const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
            if (encryptionKey) {
              const { data: decrypted, error: decryptErr } = await serviceClient.rpc('pgp_sym_decrypt_bytea', {
                data: stored,
                key: encryptionKey,
              });
              if (decrypted && !decryptErr) {
                accessToken = decrypted;
                console.log(`Connection ${conn.id}: decrypted token successfully`);
              } else {
                console.log(`Connection ${conn.id}: decryption failed, trying raw:`, decryptErr?.message);
                accessToken = stored;
              }
            } else {
              accessToken = stored;
            }
          } catch (decryptErr) {
            console.error(`Connection ${conn.id}: decryption error, using raw:`, decryptErr);
            accessToken = stored;
          }
        }

        if (!accessToken) {
          errors.push(`Connection ${conn.institution_name}: could not retrieve access token`);
          continue;
        }

        if (!tlsClient) {
          errors.push(`Connection ${conn.institution_name}: mTLS certificates not configured — required for Teller API`);
          continue;
        }

        const tellerAuth = `Basic ${btoa(accessToken + ':')}`;
        const fetchOpts = {
          headers: { 'Authorization': tellerAuth },
          // @ts-ignore - Deno-specific TLS client
          client: tlsClient,
        };

        // Step 1: Fetch accounts if we don't have account_id stored
        if (!conn.account_id) {
          console.log(`Connection ${conn.id}: fetching accounts for enrollment ${conn.teller_enrollment_id}`);
          const accountsRes = await fetch('https://api.teller.io/accounts', fetchOpts);

          if (!accountsRes.ok) {
            const errBody = await accountsRes.text();
            console.error(`Accounts fetch failed (${accountsRes.status}):`, errBody);
            errors.push(`Connection ${conn.institution_name}: failed to fetch accounts (${accountsRes.status})`);
            continue;
          }

          const accounts: any[] = await accountsRes.json();
          console.log(`Connection ${conn.id}: found ${accounts.length} accounts`);

          if (accounts.length === 0) {
            errors.push(`Connection ${conn.institution_name}: no accounts found`);
            continue;
          }

          // Store the first account's details on the connection
          const primaryAccount = accounts[0];
          await serviceClient
            .from('teller_connections')
            .update({
              account_id: primaryAccount.id,
              account_name: primaryAccount.name || null,
              account_type: primaryAccount.type || primaryAccount.subtype || null,
              account_last_four: primaryAccount.last_four || null,
            })
            .eq('id', conn.id);

          console.log(`Connection ${conn.id}: stored account ${primaryAccount.id} (${primaryAccount.name})`);

          // Process transactions for ALL accounts
          for (const acct of accounts) {
            const txnCount = await syncAccountTransactions(serviceClient, user.id, conn.id, acct.id, fetchOpts);
            totalSynced += txnCount;
          }
        } else {
          // Account already known, just sync transactions
          const txnCount = await syncAccountTransactions(serviceClient, user.id, conn.id, conn.account_id, fetchOpts);
          totalSynced += txnCount;
        }

        // Update last_synced_at
        await serviceClient
          .from('teller_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', conn.id);

        console.log(`Connection ${conn.id}: sync complete, ${totalSynced} total transactions`);

      } catch (e: any) {
        console.error(`Sync error for connection ${conn.id}:`, e);
        errors.push(`Connection ${conn.institution_name}: ${e.message}`);
      }
    }

    const response: any = {
      synced: totalSynced,
      success: true,
      connections: connections.length,
    };
    if (errors.length > 0) {
      response.errors = errors;
    }
    if (totalSynced === 0 && errors.length > 0) {
      response.message = errors.join('; ');
    }

    console.log('Sync summary:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Teller sync transactions error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncAccountTransactions(
  serviceClient: any,
  userId: string,
  connectionId: string,
  accountId: string,
  fetchOpts: any,
): Promise<number> {
  console.log(`Fetching transactions for account ${accountId}`);
  
  const txnRes = await fetch(`https://api.teller.io/accounts/${accountId}/transactions`, fetchOpts);
  
  if (!txnRes.ok) {
    const errBody = await txnRes.text();
    console.error(`Transaction fetch failed for ${accountId} (${txnRes.status}):`, errBody);
    return 0;
  }

  const transactions: any[] = await txnRes.json();
  console.log(`Account ${accountId}: ${transactions.length} transactions fetched`);
  
  let synced = 0;
  for (const txn of transactions) {
    const { error: upsertErr } = await serviceClient
      .from('teller_transactions')
      .upsert({
        contractor_id: userId,
        teller_connection_id: connectionId,
        teller_transaction_id: txn.id,
        amount: parseFloat(txn.amount),
        description: txn.description,
        vendor: txn.details?.counterparty?.name || txn.merchant_name || txn.description,
        category: txn.details?.category || txn.type,
        transaction_date: txn.date,
        status: txn.status,
      }, { onConflict: 'teller_transaction_id' });

    if (upsertErr) {
      console.error(`Upsert error for txn ${txn.id}:`, upsertErr.message);
    } else {
      synced++;
    }
  }

  return synced;
}
