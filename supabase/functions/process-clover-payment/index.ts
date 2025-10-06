import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, tier_id, billing_cycle } = await req.json();

    console.log('Creating Clover checkout session:', { amount, tier_id, billing_cycle });

    // Get Clover credentials from environment
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');

    if (!cloverApiToken || !cloverMerchantId) {
      throw new Error('Clover credentials not configured');
    }

    // Get the callback URL from environment or construct it
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const callbackUrl = `${supabaseUrl}/functions/v1/clover-payment-callback`;

    // Create a Clover checkout session using Ecommerce API
    const cloverResponse = await fetch(
      `https://api.clover.com/v1/charges`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloverApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          description: `${tier_id} tier - ${billing_cycle} billing`,
          metadata: {
            tier_id,
            billing_cycle,
          },
          success_url: callbackUrl + '?status=success',
          cancel_url: callbackUrl + '?status=cancel',
        }),
      }
    );

    const cloverData = await cloverResponse.json();

    if (!cloverResponse.ok) {
      console.error('Clover API error:', cloverData);
      throw new Error(cloverData.message || 'Failed to create checkout session');
    }

    console.log('Checkout session created:', cloverData.id);

    // Return the checkout URL for redirect
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: cloverData.hosted_checkout_url || cloverData.checkout_url,
        session_id: cloverData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Checkout session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
