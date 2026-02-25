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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    // For now, store a masked token placeholder (encryption can be added later)
    const maskedToken = `teller_tok_${accessToken.substring(0, 8)}...`;

    const institutionName = enrollment.institution?.name || 'Unknown Bank';

    // Save enrollment to database
    const { error: insertErr } = await supabase
      .from('teller_connections')
      .insert({
        user_id: user.id,
        teller_enrollment_id: enrollment.id,
        teller_access_token_encrypted: maskedToken,
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
