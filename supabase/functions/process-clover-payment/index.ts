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
    const { amount, tier_id, billing_cycle, customer_email } = await req.json();

    console.log('Creating Clover checkout session:', { amount, tier_id, billing_cycle });

    // Get Clover credentials from environment
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');

    if (!cloverApiToken || !cloverMerchantId) {
      throw new Error('Clover credentials not configured');
    }

    // Determine tier name for display
    const tierNames: Record<string, string> = {
      'launch': 'Launch Growth Starter',
      'growth': 'Growth Business Builder',
      'accel': 'Accel! Market Dominator'
    };

    // Create a Clover checkout session using the correct Hosted Checkout API
    const cloverResponse = await fetch(
      'https://scl.clover.com/invoicingcheckoutservice/v1/checkouts',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloverApiToken}`,
          'Content-Type': 'application/json',
          'X-Clover-Merchant-Id': cloverMerchantId,
        },
        body: JSON.stringify({
          customer: {
            email: customer_email || 'customer@example.com',
            firstName: 'Customer',
            lastName: 'Name',
          },
          shoppingCart: {
            lineItems: [
              {
                name: `${tierNames[tier_id] || tier_id} Subscription`,
                unitQty: 1,
                price: amount,
                note: `${billing_cycle} billing cycle`,
              },
            ],
          },
        }),
      }
    );

    const responseText = await cloverResponse.text();
    console.log('Clover API response status:', cloverResponse.status);
    console.log('Clover API response:', responseText);

    if (!cloverResponse.ok) {
      console.error('Clover API error:', responseText);
      throw new Error(`Clover API error: ${responseText}`);
    }

    const cloverData = JSON.parse(responseText);
    console.log('Checkout session created:', cloverData.id);

    // Return the checkout URL for redirect
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: cloverData.href,
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
