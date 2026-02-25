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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cert = Deno.env.get('TELLER_CERTIFICATE');
    const key = Deno.env.get('TELLER_PRIVATE_KEY');
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');

    if (!cert || !key || !encryptionKey) {
      throw new Error('Teller configuration incomplete');
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active teller connections for user
    const { data: connections } = await supabase
      .from('teller_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!connections?.length) {
      return new Response(JSON.stringify({ synced: 0, message: 'No active connections' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalSynced = 0;

    // Group connections by enrollment to avoid duplicate API calls
    const enrollmentMap = new Map<string, typeof connections[0]>();
    for (const conn of connections) {
      if (!enrollmentMap.has(conn.teller_enrollment_id)) {
        enrollmentMap.set(conn.teller_enrollment_id, conn);
      }
    }

    const tlsClient = Deno.createHttpClient({
      certChain: cert,
      privateKey: key,
    });

    for (const conn of connections) {
      if (!conn.account_id) continue;

      try {
        // Decrypt access token
        const { data: decrypted } = await serviceClient.rpc('pgp_sym_decrypt_bytea', {
          data: conn.teller_access_token_encrypted,
          key: encryptionKey,
        });

        if (!decrypted) continue;

        const authHeader = `Basic ${btoa(decrypted + ':')}`;

        // Fetch transactions from Teller
        const txnRes = await fetch(`https://api.teller.io/accounts/${conn.account_id}/transactions`, {
          headers: { 'Authorization': authHeader },
          // @ts-ignore
          client: tlsClient,
        });

        if (!txnRes.ok) {
          console.error(`Transactions fetch failed for ${conn.account_id}:`, txnRes.status);
          continue;
        }

        const transactions: any[] = await txnRes.json();

        // Upsert transactions
        for (const txn of transactions) {
          const { error: upsertErr } = await supabase
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

        // Update last_synced_at
        await supabase
          .from('teller_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', conn.id);

      } catch (e) {
        console.error(`Sync error for connection ${conn.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ synced: totalSynced, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Teller sync transactions error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
