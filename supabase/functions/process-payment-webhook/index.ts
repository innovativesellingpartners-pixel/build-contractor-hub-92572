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
        console.log('Checkout session completed:', session.id, {
          metadata: session.metadata,
          amount_total: session.amount_total,
        });
        
        // Get metadata from session
        const contractorId = session.metadata?.contractor_id;
        const customerId = session.metadata?.customer_id;
        const jobId = session.metadata?.job_id;
        const estimateId = session.metadata?.estimate_id;
        const invoiceId = session.metadata?.invoice_id;

        if (!contractorId) {
          console.error('No contractor_id in session metadata');
          break;
        }

        // Calculate amounts (Stripe amounts are in cents)
        const amount = (session.amount_total || 0) / 100;
        const feeAmount = 0; // Calculate from payment_intent if needed
        const netAmount = amount - feeAmount;

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            contractor_id: contractorId,
            customer_id: customerId || null,
            job_id: jobId || null,
            estimate_id: estimateId || null,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: amount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
          break;
        }

        console.log('Payment record created:', payment.id);

        // Update estimate status if applicable
        if (estimateId) {
          await supabase
            .from('estimates')
            .update({
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              payment_amount: amount,
            })
            .eq('id', estimateId)
            .eq('user_id', contractorId);
        }

        // Update invoice if applicable
        if (invoiceId) {
          const { data: invoice } = await supabase
            .from('invoices')
            .select('amount_due, amount_paid')
            .eq('id', invoiceId)
            .eq('user_id', contractorId)
            .single();

          if (invoice) {
            const newAmountPaid = (invoice.amount_paid || 0) + netAmount;
            const balanceDue = invoice.amount_due - newAmountPaid;
            
            await supabase
              .from('invoices')
              .update({
                amount_paid: newAmountPaid,
                balance_due: balanceDue,
                status: balanceDue <= 0 ? 'paid' : 'partial',
                stripe_payment_id: session.payment_intent as string,
              })
              .eq('id', invoiceId)
              .eq('user_id', contractorId);
          }
        }

        // Triggers will automatically update job totals and customer lifetime_value
        
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id, {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });

        // Update payment status if it exists
        await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Payment intent failed:', paymentIntent.id, {
          last_payment_error: paymentIntent.last_payment_error,
        });

        // Update payment status if it exists
        await supabase
          .from('payments')
          .update({
            status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

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
    console.error('Error in process-payment-webhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400 }
    );
  }
});