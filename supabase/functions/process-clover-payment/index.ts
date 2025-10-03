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

    console.log('Processing Clover payment:', { amount, tier_id, billing_cycle });

    // Get Clover credentials from environment
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');

    if (!cloverApiToken || !cloverMerchantId) {
      throw new Error('Clover credentials not configured');
    }

    // Call Clover API to create a charge
    const cloverResponse = await fetch(
      `https://api.clover.com/v3/merchants/${cloverMerchantId}/charges`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloverApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          source: 'clover', // This may need to be adjusted based on your Clover setup
          description: `${tier_id} tier - ${billing_cycle} billing`,
        }),
      }
    );

    const cloverData = await cloverResponse.json();

    if (!cloverResponse.ok) {
      console.error('Clover API error:', cloverData);
      throw new Error(cloverData.message || 'Clover payment failed');
    }

    console.log('Payment processed successfully:', cloverData.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: cloverData.id,
        message: 'Payment processed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Payment processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
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
