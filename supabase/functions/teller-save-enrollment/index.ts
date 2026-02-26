import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function normalizePem(value: string, type: 'CERTIFICATE' | 'PRIVATE KEY'): string {
  const unescaped = value.replace(/\\n/g, '\n').trim();

  if (/-----BEGIN [A-Z0-9 ]+-----/.test(unescaped) && /-----END [A-Z0-9 ]+-----/.test(unescaped)) {
    return unescaped;
  }

  const compact = unescaped.replace(/\s+/g, '');
  const wrapped = compact.match(/.{1,64}/g)?.join('\n') ?? compact;
  return `-----BEGIN ${type}-----\n${wrapped}\n-----END ${type}-----`;
}

async function tellerFetch(url: string, accessToken: string, cert: string, key: string): Promise<{ ok: boolean; status: number; body: string }> {
  let tlsClient: Deno.HttpClient;

  try {
    tlsClient = Deno.createHttpClient({ cert, key } as any);
  } catch {
    tlsClient = Deno.createHttpClient({ certChain: cert, privateKey: key } as any);
  }

  const auth = btoa(accessToken + ':');

  // @ts-ignore - Deno fetch supports `client` option in edge runtime
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
    client: tlsClient,
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const { accessToken, enrollment } = await req.json();

    if (!accessToken || !enrollment?.id) {
      return new Response(JSON.stringify({ error: 'Missing accessToken or enrollment data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Enrollment:', enrollment.id, 'Institution:', enrollment.institution?.name);

    const rawCert = Deno.env.get('TELLER_CERTIFICATE');
    const rawKey = Deno.env.get('TELLER_PRIVATE_KEY');
    if (!rawCert || !rawKey) {
      return new Response(JSON.stringify({ error: 'Bank sync certificates are not configured.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cert = normalizePem(rawCert, 'CERTIFICATE');
    const key = normalizePem(rawKey, 'PRIVATE KEY');

    // Validate that this enrollment token works with current mTLS cert/key BEFORE saving
    const accountsRes = await tellerFetch('https://api.teller.io/accounts', accessToken, cert, key);
    if (!accountsRes.ok) {
      console.error(`Enrollment token validation failed (${accountsRes.status}):`, accountsRes.body);
      const isRevoked = accountsRes.status === 400 && accountsRes.body.includes('revoked');
      const isMissingCert = accountsRes.status === 400 && accountsRes.body.includes('Missing certificate');

      return new Response(JSON.stringify({
        error: isRevoked
          ? 'Bank connection failed: certificate is revoked. Please rotate Teller credentials and reconnect.'
          : isMissingCert
            ? 'Bank connection failed: certificate mismatch. Please confirm Teller application + certificate + key match.'
            : `Bank connection validation failed (${accountsRes.status})`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to encrypt the token, fall back to storing raw if encryption function is unavailable
    let storedToken = accessToken;
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
    if (encryptionKey) {
      try {
        const { data: encrypted, error: encErr } = await supabase.rpc('pgp_sym_encrypt_bytea', {
          data: accessToken,
          key: encryptionKey,
        });
        if (encrypted && !encErr) {
          storedToken = encrypted;
          console.log('Token encrypted successfully');
        } else {
          console.log('Encryption failed, storing raw token:', encErr);
        }
      } catch {
        console.log('Encryption not available, storing raw token');
      }
    }

    const institutionName = enrollment.institution?.name || 'Unknown Bank';

    // Ensure only one active Teller connection per user to avoid stale token sync attempts
    await supabase
      .from('teller_connections')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { error: insertErr } = await supabase
      .from('teller_connections')
      .insert({
        user_id: user.id,
        teller_enrollment_id: enrollment.id,
        teller_access_token_encrypted: storedToken,
        institution_name: institutionName,
        status: 'active',
      });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      throw insertErr;
    }

    console.log('Enrollment saved successfully');

    return new Response(JSON.stringify({
      success: true,
      accountsLinked: 1,
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
