import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

const POCKETBOT_PRICE_CENTS = 2000; // $20.00/month

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authentication required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Invalid authentication token');

    // Check if user already has paid access
    const { data: profile } = await supabase
      .from('profiles')
      .select('pocketbot_access_type, pocketbot_full_access')
      .eq('user_id', user.id)
      .single();

    if (profile?.pocketbot_access_type === 'paid' || profile?.pocketbot_access_type === 'free_full') {
      return new Response(
        JSON.stringify({ success: false, message: 'You already have full Pocket Agent access.' }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');
    if (!cloverApiToken || !cloverMerchantId) throw new Error('Payment system not configured');

    const appUrl = Deno.env.get('APP_URL') || 'https://myct1.com';

    const envRaw = (Deno.env.get('CLOVER_ENV') || 'auto').toLowerCase();
    const envMode = ['sandbox', 'production'].includes(envRaw) ? envRaw : 'auto';
    const candidates = envMode === 'sandbox'
      ? ['https://apisandbox.dev.clover.com']
      : envMode === 'production'
        ? ['https://api.clover.com']
        : ['https://api.clover.com', 'https://apisandbox.dev.clover.com'];

    let lastErrorText = '';

    for (const baseUrl of candidates) {
      console.log('Trying Clover Hosted Checkout for Pocket Agent:', baseUrl);
      const cloverResponse = await fetch(
        `${baseUrl}/invoicingcheckoutservice/v1/checkouts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloverApiToken}`,
            'Content-Type': 'application/json',
            'X-Clover-Merchant-Id': cloverMerchantId,
          },
          body: JSON.stringify({
            customer: { email: user.email || 'customer@example.com' },
            shoppingCart: {
              lineItems: [
                {
                  name: 'CT1 Pocket Agent — Monthly',
                  unitQty: 1,
                  price: POCKETBOT_PRICE_CENTS,
                  note: 'Monthly subscription — Unlimited AI assistant access',
                },
              ],
            },
          }),
        }
      );

      const responseText = await cloverResponse.text();
      console.log('Clover response status:', cloverResponse.status);

      if (cloverResponse.ok) {
        const cloverData = JSON.parse(responseText);
        const successEnv = baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION';
        console.log(`✅ Pocket Agent checkout created (${successEnv}):`, cloverData.checkoutSessionId);

        // Store the pending checkout so we can activate on return
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (serviceRoleKey) {
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          await adminClient.from('pocketbot_payment_sessions').insert({
            user_id: user.id,
            clover_session_id: cloverData.checkoutSessionId,
            amount: POCKETBOT_PRICE_CENTS,
            status: 'pending',
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: cloverData.href,
            session_id: cloverData.checkoutSessionId,
            environment: successEnv,
          }),
          { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      lastErrorText = responseText || `HTTP ${cloverResponse.status}`;
      if (cloverResponse.status === 404) continue;
      break;
    }

    throw new Error(`Checkout creation failed: ${lastErrorText}`);
  } catch (error) {
    console.error('Pocketbot checkout error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Failed to create checkout' }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
