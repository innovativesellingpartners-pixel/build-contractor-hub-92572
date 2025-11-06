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
    const { estimate_id, public_token, amount, customer_email } = await req.json();

    console.log('Processing estimate payment:', {
      estimate_id,
      amount,
      customer_email,
    });

    // Validate inputs
    if (!estimate_id || !amount || !customer_email || !public_token) {
      throw new Error('Missing required fields');
    }

    // Verify the estimate exists and get details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimate_id)
      .eq('public_token', public_token)
      .single();

    if (estimateError || !estimate) {
      throw new Error('Invalid estimate');
    }

    // Get Clover credentials
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');
    const cloverEnv = Deno.env.get('CLOVER_ENV') || 'sandbox';

    if (!cloverApiToken || !cloverMerchantId) {
      throw new Error('Clover credentials not configured');
    }

    // Determine API endpoint
    const baseUrl = cloverEnv === 'production' 
      ? 'https://api.clover.com'
      : 'https://sandbox.dev.clover.com';

    // Get frontend URL for callback
    const callbackUrl = `${supabaseUrl}/functions/v1/estimate-payment-callback`;

    // Create checkout session with Clover
    const checkoutPayload = {
      customer: {
        email: customer_email,
      },
      shoppingCart: {
        lineItems: [
          {
            name: `Estimate ${estimate.estimate_number}`,
            unitQty: 1,
            price: Math.round(amount * 100), // Convert to cents
          },
        ],
      },
      redirectUrl: callbackUrl,
    };

    console.log('Creating Clover checkout session:', {
      endpoint: `${baseUrl}/invoicingcheckoutservice/v1/checkouts`,
      merchantId: cloverMerchantId,
      payload: checkoutPayload,
    });

    const cloverResponse = await fetch(
      `${baseUrl}/invoicingcheckoutservice/v1/checkouts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloverApiToken}`,
          'Content-Type': 'application/json',
          'X-Clover-Merchant-Id': cloverMerchantId,
        },
        body: JSON.stringify(checkoutPayload),
      }
    );

    if (!cloverResponse.ok) {
      const errorText = await cloverResponse.text();
      console.error('Clover API error:', {
        status: cloverResponse.status,
        statusText: cloverResponse.statusText,
        error: errorText,
      });

      // If sandbox fails with 404, try production
      if (cloverResponse.status === 404 && cloverEnv !== 'production') {
        console.log('Retrying with production environment...');
        const prodResponse = await fetch(
          `https://api.clover.com/invoicingcheckoutservice/v1/checkouts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cloverApiToken}`,
              'Content-Type': 'application/json',
              'X-Clover-Merchant-Id': cloverMerchantId,
            },
            body: JSON.stringify(checkoutPayload),
          }
        );

        if (!prodResponse.ok) {
          throw new Error(`Clover API failed: ${await prodResponse.text()}`);
        }

        const prodData = await prodResponse.json();
        console.log('Production Clover response:', prodData);

        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: prodData.href,
            session_id: prodData.id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw new Error(`Clover API failed: ${errorText}`);
    }

    const cloverData = await cloverResponse.json();
    console.log('Clover checkout created:', cloverData);

    // Store the payment session info for callback handling
    await supabase
      .from('estimate_payment_sessions')
      .insert({
        estimate_id,
        clover_session_id: cloverData.id,
        amount,
        customer_email,
      });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: cloverData.href,
        session_id: cloverData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error processing estimate payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to process payment',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
