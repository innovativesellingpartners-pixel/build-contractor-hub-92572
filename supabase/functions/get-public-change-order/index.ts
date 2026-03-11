import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let token: string | null = null;
    let action = 'get'; // 'get', 'sign', 'log_view'
    let signatureData: any = null;

    if (req.method === 'POST') {
      const body = await req.json();
      token = body?.token || null;
      action = body?.action || 'get';
      signatureData = body?.signatureData || null;
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'get') {
      const { data, error } = await supabase
        .from('change_orders')
        .select('*, jobs(title, site_address)')
        .eq('public_token', token)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Change order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'log_view') {
      // Update viewed_at if not already viewed
      await supabase
        .from('change_orders')
        .update({ viewed_at: new Date().toISOString() })
        .eq('public_token', token)
        .is('viewed_at', null);

      // Get the change order ID for logging
      const { data: co } = await supabase
        .from('change_orders')
        .select('id')
        .eq('public_token', token)
        .single();

      if (co) {
        await supabase.from('change_order_views').insert({
          change_order_id: co.id,
          user_agent: req.headers.get('user-agent') || null,
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sign') {
      if (!signatureData?.client_signature) {
        return new Response(
          JSON.stringify({ error: 'Signature is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('change_orders')
        .update({
          client_signature: signatureData.client_signature,
          client_printed_name: signatureData.client_printed_name || null,
          signed_at: new Date().toISOString(),
          status: 'approved',
          date_approved: new Date().toISOString(),
        })
        .eq('public_token', token);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to sign change order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('get-public-change-order error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
