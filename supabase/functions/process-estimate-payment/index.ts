import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

interface PaymentRequest {
  estimate_id: string;
  public_token: string;
  payment_intent: 'deposit' | 'full' | 'remaining';
  customer_email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const { estimate_id, public_token, payment_intent, customer_email }: PaymentRequest = await req.json();

    console.log('Processing estimate payment:', {
      estimate_id,
      payment_intent,
      customer_email,
    });

    // Validate inputs
    if (!estimate_id || !customer_email || !public_token) {
      throw new Error('Missing required fields');
    }

    // Default to 'full' if not specified
    const intent = payment_intent || 'full';

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

    // Calculate amounts based on estimate data
    const totalAmount = estimate.grand_total || estimate.total_amount || 0;
    const depositAmount = estimate.required_deposit || 0;
    const amountPaid = estimate.payment_amount || 0;
    const remainingBalance = totalAmount - amountPaid;

    // Prevent overpayment
    if (remainingBalance <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'This estimate has already been fully paid',
        }),
        {
          status: 400,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate the amount to charge based on intent
    let amountToCharge: number;
    let paymentDescription: string;

    if (intent === 'deposit') {
      // Deposit payment - charge the deposit amount (or remaining if less)
      if (depositAmount <= 0) {
        throw new Error('No deposit required for this estimate');
      }
      // If already paid something, only charge what's left of the deposit
      const depositRemaining = Math.max(0, depositAmount - amountPaid);
      amountToCharge = Math.min(depositRemaining, remainingBalance);
      paymentDescription = `Deposit for Estimate ${estimate.estimate_number}`;
    } else if (intent === 'remaining') {
      // Pay remaining balance
      amountToCharge = remainingBalance;
      paymentDescription = `Remaining Balance for Estimate ${estimate.estimate_number}`;
    } else {
      // Full payment - charge remaining balance
      amountToCharge = remainingBalance;
      paymentDescription = `Payment for Estimate ${estimate.estimate_number}`;
    }

    // Round to 2 decimal places
    amountToCharge = Math.round(amountToCharge * 100) / 100;

    if (amountToCharge <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid payment amount',
        }),
        {
          status: 400,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Calculated payment:', {
      intent,
      totalAmount,
      depositAmount,
      amountPaid,
      remainingBalance,
      amountToCharge,
    });

    // Check for duplicate pending payment sessions (idempotency)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingSession } = await supabase
      .from('estimate_payment_sessions')
      .select('*')
      .eq('estimate_id', estimate_id)
      .eq('payment_intent', intent)
      .eq('amount', amountToCharge)
      .eq('status', 'pending')
      .gte('created_at', fiveMinutesAgo)
      .single();

    if (existingSession) {
      console.log('Found existing pending session, returning it');
      // Return the existing session's checkout URL if still valid
      // Note: Clover sessions may expire, so we proceed to create a new one
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
            name: paymentDescription,
            unitQty: 1,
            price: Math.round(amountToCharge * 100), // Convert to cents
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

        // Store the payment session
        await supabase
          .from('estimate_payment_sessions')
          .insert({
            estimate_id,
            clover_session_id: prodData.id,
            amount: amountToCharge,
            customer_email,
            payment_intent: intent,
            status: 'pending',
          });

        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: prodData.href,
            session_id: prodData.id,
            amount: amountToCharge,
            payment_intent: intent,
          }),
          {
            headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
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
        amount: amountToCharge,
        customer_email,
        payment_intent: intent,
        status: 'pending',
      });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: cloverData.href,
        session_id: cloverData.id,
        amount: amountToCharge,
        payment_intent: intent,
      }),
      {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
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
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
