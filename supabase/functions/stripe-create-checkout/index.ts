import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { getStripeClient, getCurrentContractorId, validateStripeConfig } from '../_shared/stripe-plaid.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    validateStripeConfig();
    
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const contractorId = await getCurrentContractorId(supabase, authHeader);
    const { amount, description } = await req.json();

    if (!amount || amount < 50) {
      throw new Error('Amount must be at least 50 cents');
    }

    // Ensure contractor has a Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, default_currency')
      .eq('id', contractorId)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new Error('Stripe customer not found. Please ensure customer first.');
    }

    const stripe = getStripeClient();
    const appUrl = Deno.env.get('APP_URL') || 'https://myct1.com';
    const currency = profile.default_currency || 'usd';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description || 'CT1 Test Payment',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/crm/payments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/crm/payments?canceled=true`,
      metadata: {
        contractor_id: contractorId,
        description: description || '',
      },
    });

    console.log(`Created checkout session ${session.id} for contractor ${contractorId}`);

    // Store payment session
    await supabase.from('stripe_payment_sessions').insert({
      user_id: contractorId,
      stripe_session_id: session.id,
      amount_cents: amount,
      currency,
      description: description || 'Test payment',
      status: 'pending',
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
      }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in stripe-create-checkout:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
