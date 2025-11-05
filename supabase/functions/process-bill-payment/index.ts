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
    console.log('Processing bill payment request');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { amount, customer_email, customer_name, description } = await req.json();

    // Validate input
    if (!amount || !customer_email) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, customer_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount < 1) {
      console.error('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Amount must be at least $1.00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment details:', { amount: paymentAmount, customer_email, description });

    // Get Clover credentials
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');
    const cloverEnv = Deno.env.get('CLOVER_ENV') || 'sandbox';

    if (!cloverApiToken || !cloverMerchantId) {
      console.error('Missing Clover credentials');
      return new Response(
        JSON.stringify({ error: 'Payment system configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine Clover API endpoint
    const cloverBaseUrl = cloverEnv === 'production' 
      ? 'https://api.clover.com' 
      : 'https://sandbox.dev.clover.com';

    console.log('Using Clover environment:', cloverEnv);
    console.log('Clover base URL:', cloverBaseUrl);

    // Create Clover checkout session
    const checkoutPayload = {
      customer: {
        email: customer_email,
        firstName: customer_name?.split(' ')[0] || 'Customer',
        lastName: customer_name?.split(' ').slice(1).join(' ') || '',
      },
      shoppingCart: {
        lineItems: [
          {
            name: description || 'CT1 Bill Payment',
            price: Math.round(paymentAmount * 100), // Convert to cents
            unitQty: 1,
          },
        ],
      },
    };

    console.log('Creating Clover checkout with payload:', JSON.stringify(checkoutPayload, null, 2));

    const cloverResponse = await fetch(
      `${cloverBaseUrl}/invoicingcheckoutservice/v1/checkouts`,
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

    const responseText = await cloverResponse.text();
    console.log('Clover API response status:', cloverResponse.status);
    console.log('Clover API response:', responseText);

    if (!cloverResponse.ok) {
      // Try alternate environment if sandbox fails
      if (cloverEnv === 'sandbox') {
        console.log('Sandbox failed, trying production environment...');
        const prodUrl = 'https://api.clover.com';
        
        const retryResponse = await fetch(
          `${prodUrl}/invoicingcheckoutservice/v1/checkouts`,
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

        const retryText = await retryResponse.text();
        console.log('Retry response status:', retryResponse.status);
        console.log('Retry response:', retryText);

        if (!retryResponse.ok) {
          throw new Error(`Clover API error: ${retryResponse.status} - ${retryText}`);
        }

        const retryData = JSON.parse(retryText);
        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: retryData.href,
            session_id: retryData.id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Clover API error: ${cloverResponse.status} - ${responseText}`);
    }

    const cloverData = JSON.parse(responseText);
    console.log('Checkout created successfully:', cloverData.id);

    // Return checkout URL
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: cloverData.href,
        session_id: cloverData.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing bill payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: 'Payment processing failed',
        details: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
