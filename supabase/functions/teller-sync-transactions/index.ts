import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Ensure certificate/private key are valid PEM strings.
 * Supports raw PEM, escaped PEM, or base64 body-only secrets.
 */
function normalizePem(value: string, type: 'CERTIFICATE' | 'PRIVATE KEY'): string {
  const unescaped = value.replace(/\\n/g, '\n').trim();

  // Preserve any already-valid PEM block (e.g. CERTIFICATE, PRIVATE KEY, RSA PRIVATE KEY, EC PRIVATE KEY)
  if (/-----BEGIN [A-Z0-9 ]+-----/.test(unescaped) && /-----END [A-Z0-9 ]+-----/.test(unescaped)) {
    return unescaped;
  }

  const compact = unescaped.replace(/\s+/g, '');
  const wrapped = compact.match(/.{1,64}/g)?.join('\n') ?? compact;
  return `-----BEGIN ${type}-----\n${wrapped}\n-----END ${type}-----`;
}

/**
 * Make an mTLS-authenticated request to the Teller API.
 * Uses Node.js https module via Deno compatibility layer since
 * Deno Deploy doesn't support Deno.createHttpClient with client certs.
 */
async function tellerFetch(url: string, accessToken: string, cert: string, key: string): Promise<{ ok: boolean; status: number; body: string }> {
  const { default: https } = await import('node:https');
  const { URL } = await import('node:url');

  const parsed = new URL(url);
  const auth = btoa(accessToken + ':');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      servername: parsed.hostname,
      cert,
      key,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => { data += chunk; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', (e: any) => {
      reject(new Error(`HTTPS request failed: ${e.message}`));
    });

    req.end();
  });
}

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

    const rawCert = Deno.env.get('TELLER_CERTIFICATE');
    const rawKey = Deno.env.get('TELLER_PRIVATE_KEY');

    if (!rawCert || !rawKey) {
      console.error('TELLER_CERTIFICATE or TELLER_PRIVATE_KEY not configured');
      return new Response(JSON.stringify({ error: 'mTLS certificates not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cert = normalizePem(rawCert, 'CERTIFICATE');
    const key = normalizePem(rawKey, 'PRIVATE KEY');

    console.log('Cert has PEM header:', cert.includes('-----BEGIN CERTIFICATE-----'), 'length:', cert.length);
    console.log('Key has PEM header:', key.includes('-----BEGIN PRIVATE KEY-----'), 'length:', key.length);

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

    for (const conn of connections) {
      try {
        const stored = conn.teller_access_token_encrypted || '';
        let accessToken = '';

        if (!stored) {
          errors.push(`Connection ${conn.institution_name}: no token stored`);
          continue;
        }

        if (stored.startsWith('teller_tok_')) {
          accessToken = stored;
          console.log(`Connection ${conn.id}: using development token`);
        } else if (stored.startsWith('encrypted:')) {
          accessToken = stored.replace('encrypted:', '');
        } else {
          accessToken = stored;
        }

        if (!accessToken) {
          errors.push(`Connection ${conn.institution_name}: could not retrieve access token`);
          continue;
        }

        // Step 1: Fetch accounts if we don't have account_id stored
        if (!conn.account_id) {
          console.log(`Connection ${conn.id}: fetching accounts`);
          
          const accountsRes = await tellerFetch('https://api.teller.io/accounts', accessToken, cert, key);
          console.log(`Accounts response: status=${accountsRes.status}`);

          if (!accountsRes.ok) {
            console.error(`Accounts fetch failed (${accountsRes.status}):`, accountsRes.body);
            errors.push(`Connection ${conn.institution_name}: failed to fetch accounts (${accountsRes.status})`);
            continue;
          }

          const accounts: any[] = JSON.parse(accountsRes.body);
          console.log(`Connection ${conn.id}: found ${accounts.length} accounts`);

          if (accounts.length === 0) {
            errors.push(`Connection ${conn.institution_name}: no accounts found`);
            continue;
          }

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

          for (const acct of accounts) {
            const txnCount = await syncAccountTransactions(serviceClient, user.id, conn.id, acct.id, accessToken, cert, key);
            totalSynced += txnCount;
          }
        } else {
          const txnCount = await syncAccountTransactions(serviceClient, user.id, conn.id, conn.account_id, accessToken, cert, key);
          totalSynced += txnCount;
        }

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
    if (errors.length > 0) response.errors = errors;
    if (totalSynced === 0 && errors.length > 0) response.message = errors.join('; ');

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
  accessToken: string,
  cert: string,
  key: string,
): Promise<number> {
  console.log(`Fetching transactions for account ${accountId}`);

  const txnRes = await tellerFetch(`https://api.teller.io/accounts/${accountId}/transactions`, accessToken, cert, key);

  if (!txnRes.ok) {
    console.error(`Transaction fetch failed for ${accountId} (${txnRes.status}):`, txnRes.body);
    return 0;
  }

  const transactions: any[] = JSON.parse(txnRes.body);
  console.log(`Account ${accountId}: ${transactions.length} transactions fetched`);

  // Batch upsert for efficiency
  const BATCH_SIZE = 100;
  let synced = 0;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE).map((txn: any) => ({
      contractor_id: userId,
      teller_connection_id: connectionId,
      teller_transaction_id: txn.id,
      amount: parseFloat(txn.amount),
      description: txn.description,
      vendor: txn.details?.counterparty?.name || txn.merchant_name || txn.description,
      category: txn.details?.category || txn.type,
      transaction_date: txn.date,
      status: txn.status,
    }));

    const { error: upsertErr } = await serviceClient
      .from('teller_transactions')
      .upsert(batch, { onConflict: 'teller_transaction_id' });

    if (upsertErr) {
      console.error(`Batch upsert error:`, upsertErr.message);
    } else {
      synced += batch.length;
    }
  }

  return synced;
}
