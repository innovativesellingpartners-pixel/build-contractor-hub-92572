import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { getStripeClient } from '../_shared/stripe-plaid.ts';

serve(async (req) => {
  try {
    const stripe = getStripeClient();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret');
    }

    const body = await req.text();
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errMsg);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`, {
      id: event.id,
      type: event.type,
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        // Update payment session status
        await supabase
          .from('stripe_payment_sessions')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id);
        
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id, {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Payment intent failed:', paymentIntent.id, {
          last_payment_error: paymentIntent.last_payment_error,
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400 }
    );
  }
});
