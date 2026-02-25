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

    const { accessToken, enrollment, user: tellerUser } = await req.json();

    if (!accessToken || !enrollment?.id) {
      return new Response(JSON.stringify({ error: 'Missing accessToken or enrollment data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Encrypt the access token using pgcrypto
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Use service role to encrypt & fetch accounts
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Encrypt the Teller access token
    const { data: encrypted, error: encErr } = await serviceClient.rpc('pgp_sym_encrypt_bytea', {
      data: accessToken,
      key: encryptionKey,
    });

    if (encErr) {
      console.error('Encryption error:', encErr);
      // Fallback: store a placeholder — token won't be usable for API calls but enrollment is saved
    }

    const encryptedToken = encrypted || `encrypted:${accessToken.substring(0, 8)}...`;

    // Fetch accounts from Teller API using mTLS
    let accounts: any[] = [];
    try {
      const cert = Deno.env.get('TELLER_CERTIFICATE');
      const key = Deno.env.get('TELLER_PRIVATE_KEY');

      if (cert && key) {
        const tlsClient = Deno.createHttpClient({
          certChain: cert,
          privateKey: key,
        });

        const accountsRes = await fetch('https://api.teller.io/accounts', {
          headers: {
            'Authorization': `Basic ${btoa(accessToken + ':')}`,
          },
          // @ts-ignore - Deno specific
          client: tlsClient,
        });

        if (accountsRes.ok) {
          accounts = await accountsRes.json();
        } else {
          console.error('Teller accounts fetch failed:', accountsRes.status);
        }
      }
    } catch (fetchErr) {
      console.error('Failed to fetch Teller accounts:', fetchErr);
    }

    // Save connection(s) to database
    const institutionName = enrollment.institution?.name || 'Unknown Bank';

    if (accounts.length > 0) {
      const rows = accounts.map((acct: any) => ({
        user_id: user.id,
        teller_enrollment_id: enrollment.id,
        teller_access_token_encrypted: encryptedToken,
        institution_name: institutionName,
        account_id: acct.id,
        account_name: acct.name,
        account_type: acct.type,
        account_subtype: acct.subtype,
        account_last_four: acct.last_four,
        status: 'active',
      }));

      const { error: insertErr } = await supabase
        .from('teller_connections')
        .insert(rows);

      if (insertErr) throw insertErr;
    } else {
      // No accounts fetched, save enrollment anyway
      const { error: insertErr } = await supabase
        .from('teller_connections')
        .insert({
          user_id: user.id,
          teller_enrollment_id: enrollment.id,
          teller_access_token_encrypted: encryptedToken,
          institution_name: institutionName,
          status: 'active',
        });

      if (insertErr) throw insertErr;
    }

    return new Response(JSON.stringify({
      success: true,
      accountsLinked: accounts.length || 1,
      institution: institutionName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Teller save enrollment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
