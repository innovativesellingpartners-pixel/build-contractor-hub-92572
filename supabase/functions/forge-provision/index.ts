import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('CT1_SYNC_SECRET');
    if (!expectedKey || !authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { external_contractor_id, business_name, timezone } = await req.json();

    if (!external_contractor_id || !business_name) {
      return new Response(JSON.stringify({ error: 'external_contractor_id and business_name are required' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert contractor
    const { data: contractor, error: upsertError } = await supabase
      .from('contractors')
      .upsert({
        id: external_contractor_id,
        business_name,
        timezone: timezone || 'America/Detroit',
        voice_ai_enabled: true,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      contractor_id: contractor.id,
      contractor_number: contractor.contractor_number,
      voice_ai_enabled: true,
    }), {
      status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in forge-provision:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
