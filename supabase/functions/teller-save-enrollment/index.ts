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

    // Use service role client to verify user from token
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

    const { accessToken, enrollment, user: tellerUser } = await req.json();

    if (!accessToken || !enrollment?.id) {
      return new Response(JSON.stringify({ error: 'Missing accessToken or enrollment data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Enrollment:', enrollment.id, 'Institution:', enrollment.institution?.name);

    // Try to encrypt the token, fall back to storing raw if encryption fails
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
      } catch (e) {
        console.log('Encryption not available, storing raw token');
      }
    }

    const institutionName = enrollment.institution?.name || 'Unknown Bank';

    // Insert using service role to bypass RLS issues
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
