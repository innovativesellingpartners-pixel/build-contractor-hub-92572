import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const sessionId = url.searchParams.get('session_id');

    console.log('Estimate payment callback received:', { status, sessionId, url: req.url });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const frontendUrl = Deno.env.get('APP_URL') || 'https://myct1.com';

    if (status === 'success' && sessionId) {
      // Find the payment session
      const { data: session } = await supabase
        .from('estimate_payment_sessions')
        .select('*')
        .eq('clover_session_id', sessionId)
        .single();

      if (session) {
        // Update estimate status to accepted and paid
        await supabase
          .from('estimates')
          .update({
            status: 'accepted',
            signed_at: new Date().toISOString(),
            payment_status: 'paid',
          })
          .eq('id', session.estimate_id);

        // Get the estimate to retrieve the public token
        const { data: estimate } = await supabase
          .from('estimates')
          .select('public_token')
          .eq('id', session.estimate_id)
          .single();

        if (estimate?.public_token) {
          return Response.redirect(
            `${frontendUrl}/estimate/${estimate.public_token}?payment=success`,
            302
          );
        }
      }

      // Fallback redirect if we can't find the estimate
      return Response.redirect(
        `${frontendUrl}?payment=success`,
        302
      );
    } else {
      // Cancelled or failed - try to get estimate token from session storage or query params
      return Response.redirect(
        `${frontendUrl}?payment=cancelled`,
        302
      );
    }
  } catch (error) {
    console.error('Callback error:', error);
    const frontendUrl = Deno.env.get('APP_URL') || 'https://myct1.com';
    return Response.redirect(
      `${frontendUrl}?payment=error`,
      302
    );
  }
});
