import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    let token: string | null = null;
    let action = 'get'; // 'get', 'sign', 'log_view', 'request_revision'
    let signatureData: any = null;
    let revisionNotes: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json();
      token = body?.token || null;
      action = body?.action || 'get';
      signatureData = body?.signatureData || null;
      revisionNotes = body?.revisionNotes || null;
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
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
          { status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Also fetch history
      const { data: history } = await supabase
        .from('change_order_history')
        .select('*')
        .eq('change_order_id', data.id)
        .order('created_at', { ascending: true });

      return new Response(
        JSON.stringify({ data, history: history || [] }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'log_view') {
      await supabase
        .from('change_orders')
        .update({ viewed_at: new Date().toISOString() })
        .eq('public_token', token)
        .is('viewed_at', null);

      const { data: co } = await supabase
        .from('change_orders')
        .select('id, status')
        .eq('public_token', token)
        .single();

      if (co) {
        await supabase.from('change_order_views').insert({
          change_order_id: co.id,
          user_agent: req.headers.get('user-agent') || null,
        });

        // Log history
        await supabase.from('change_order_history').insert({
          change_order_id: co.id,
          action: 'Customer viewed change order',
          performed_by: 'Customer',
          from_status: co.status,
          to_status: co.status,
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sign') {
      if (!signatureData?.client_signature) {
        return new Response(
          JSON.stringify({ error: 'Signature is required' }),
          { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Get current status for history
      const { data: current } = await supabase
        .from('change_orders')
        .select('id, status')
        .eq('public_token', token)
        .single();

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
          { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Log history
      if (current) {
        await supabase.from('change_order_history').insert({
          change_order_id: current.id,
          action: 'Customer approved and signed change order',
          performed_by: signatureData.client_printed_name || 'Customer',
          from_status: current.status,
          to_status: 'approved',
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'request_revision') {
      if (!revisionNotes?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Please provide notes explaining what needs to be changed' }),
          { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Get current status for history
      const { data: current } = await supabase
        .from('change_orders')
        .select('id, status')
        .eq('public_token', token)
        .single();

      const { error } = await supabase
        .from('change_orders')
        .update({
          status: 'revision_requested',
          revision_notes: revisionNotes.trim(),
        })
        .eq('public_token', token);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to request revision' }),
          { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      // Log history
      if (current) {
        await supabase.from('change_order_history').insert({
          change_order_id: current.id,
          action: 'Customer requested revision',
          performed_by: 'Customer',
          notes: revisionNotes.trim(),
          from_status: current.status,
          to_status: 'revision_requested',
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('get-public-change-order error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
