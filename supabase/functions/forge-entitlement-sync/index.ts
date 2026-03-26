import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    const { external_contractor_id, enabled, tier, retentionDays } = await req.json();

    if (!external_contractor_id) {
      return new Response(JSON.stringify({ error: 'external_contractor_id is required' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const updatePayload: Record<string, any> = {
      voice_ai_enabled: !!enabled,
    };

    if (enabled && tier) {
      updatePayload.subscription_tier = tier;
    }

    const { data, error: updateError } = await supabase
      .from('contractors')
      .update(updatePayload)
      .eq('id', external_contractor_id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Contractor not found' }), {
        status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      contractor_id: data.id,
      voice_ai_enabled: data.voice_ai_enabled,
      subscription_tier: data.subscription_tier,
    }), {
      status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in forge-entitlement-sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
