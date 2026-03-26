import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Get user's teller connections
    const { data: connections, error: connErr } = await supabase
      .from('teller_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (connErr) throw connErr;

    // For each connection with an account_id, fetch live balance from Teller
    const cert = Deno.env.get('TELLER_CERTIFICATE');
    const key = Deno.env.get('TELLER_PRIVATE_KEY');
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const enrichedAccounts = [];

    for (const conn of connections || []) {
      let balance = null;

      if (cert && key && encryptionKey && conn.account_id) {
        try {
          // Decrypt access token
          const { data: decrypted } = await serviceClient.rpc('pgp_sym_decrypt_bytea', {
            data: conn.teller_access_token_encrypted,
            key: encryptionKey,
          });

          if (decrypted) {
            let tlsClient: Deno.HttpClient;
            try {
              tlsClient = Deno.createHttpClient({ cert, key } as any);
            } catch {
              tlsClient = Deno.createHttpClient({ certChain: cert, privateKey: key } as any);
            }

            const balRes = await fetch(`https://api.teller.io/accounts/${conn.account_id}/balances`, {
              headers: { 'Authorization': `Basic ${btoa(decrypted + ':')}` },
              // @ts-ignore
              client: tlsClient,
            });

            if (balRes.ok) {
              balance = await balRes.json();
            }
          }
        } catch (e) {
          console.error('Balance fetch error for', conn.account_id, e);
        }
      }

      enrichedAccounts.push({
        id: conn.id,
        institution_name: conn.institution_name,
        account_name: conn.account_name,
        account_type: conn.account_type,
        account_subtype: conn.account_subtype,
        account_last_four: conn.account_last_four,
        status: conn.status,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
        balance: balance ? {
          available: balance.available,
          ledger: balance.ledger,
        } : null,
      });
    }

    return new Response(JSON.stringify({ accounts: enrichedAccounts }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Teller get accounts error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
