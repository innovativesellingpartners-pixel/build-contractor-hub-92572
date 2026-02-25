import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FinixPaymentRequest {
  entity_type: 'estimate' | 'invoice';
  entity_id: string;
  public_token: string;
  payment_intent: 'deposit' | 'full' | 'remaining';
  customer_email: string;
  finix_token: string; // Tokenized card from Finix.js
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      entity_type,
      entity_id,
      public_token,
      payment_intent,
      customer_email,
      finix_token,
    }: FinixPaymentRequest = await req.json();

    if (!entity_id || !public_token || !finix_token || !entity_type) {
      throw new Error('Missing required fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const finixApiKey = Deno.env.get('FINIX_API_KEY')!;
    const finixEnv = Deno.env.get('FINIX_ENVIRONMENT') || 'sandbox';
    const finixBaseUrl = finixEnv === 'live'
      ? 'https://finix.live-payments-api.com'
      : 'https://finix.sandbox-payments-api.com';

    // Build Basic Auth header from username:password format
    const authHeader = `Basic ${btoa(finixApiKey)}`;

    let amountToCharge = 0;
    let paymentDescription = '';
    let contractorId = '';
    let customerId: string | null = null;
    let jobId: string | null = null;

    if (entity_type === 'estimate') {
      const { data: estimate, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', entity_id)
        .eq('public_token', public_token)
        .single();

      if (error || !estimate) throw new Error('Invalid estimate');

      contractorId = estimate.user_id;
      customerId = estimate.customer_id;
      jobId = estimate.job_id;

      const totalAmount = estimate.grand_total || estimate.total_amount || 0;
      const depositAmount = estimate.required_deposit || 0;
      const amountPaid = estimate.payment_amount || 0;
      const remainingBalance = totalAmount - amountPaid;

      if (remainingBalance <= 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Already fully paid' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const intent = payment_intent || 'full';
      if (intent === 'deposit') {
        const depositRemaining = Math.max(0, depositAmount - amountPaid);
        amountToCharge = Math.min(depositRemaining, remainingBalance);
        paymentDescription = `Deposit for Estimate ${estimate.estimate_number}`;
      } else {
        amountToCharge = remainingBalance;
        paymentDescription = `Payment for Estimate ${estimate.estimate_number}`;
      }
    } else if (entity_type === 'invoice') {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', entity_id)
        .eq('public_token', public_token)
        .single();

      if (error || !invoice) throw new Error('Invalid invoice');

      contractorId = invoice.user_id;
      customerId = invoice.customer_id;
      jobId = invoice.job_id;

      const amountDue = invoice.amount_due || 0;
      const amountPaid = invoice.amount_paid || 0;
      const remainingBalance = Math.max(0, amountDue - amountPaid);

      if (remainingBalance <= 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Already fully paid' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      amountToCharge = remainingBalance;
      paymentDescription = `Payment for Invoice ${invoice.invoice_number}`;
    }

    amountToCharge = Math.round(amountToCharge * 100) / 100;

    if (amountToCharge <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid payment amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contractor's Finix merchant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('finix_merchant_id')
      .eq('id', contractorId)
      .single();

    if (!profile?.finix_merchant_id) {
      throw new Error('Finix merchant not configured for this contractor');
    }

    const merchantIdentity = profile.finix_merchant_id;

    console.log('Creating Finix payment:', {
      entity_type,
      entity_id,
      amountToCharge,
      merchantIdentity,
    });

    // Step 1: Create a Payment Instrument from the token
    const instrumentResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Finix-Version': '2022-02-01',
      },
      body: JSON.stringify({
        token: finix_token,
        type: 'TOKEN',
        identity: merchantIdentity,
      }),
    });

    if (!instrumentResponse.ok) {
      const errText = await instrumentResponse.text();
      console.error('Finix instrument error:', errText);
      throw new Error('Failed to create payment instrument');
    }

    const instrument = await instrumentResponse.json();
    console.log('Payment instrument created:', instrument.id);

    // Step 2: Create a Transfer (charge)
    const amountInCents = Math.round(amountToCharge * 100);

    const transferResponse = await fetch(`${finixBaseUrl}/transfers`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Finix-Version': '2022-02-01',
      },
      body: JSON.stringify({
        merchant: merchantIdentity,
        amount: amountInCents,
        currency: 'USD',
        source: instrument.id,
        tags: {
          entity_type,
          entity_id,
          description: paymentDescription,
        },
      }),
    });

    if (!transferResponse.ok) {
      const errText = await transferResponse.text();
      console.error('Finix transfer error:', errText);
      throw new Error('Payment processing failed');
    }

    const transfer = await transferResponse.json();
    console.log('Finix transfer created:', transfer.id, 'state:', transfer.state);

    // Step 3: Record payment in our system
    const feeAmount = transfer.fee || 0;
    const netAmount = amountToCharge - (feeAmount / 100);

    // Insert payment record
    await supabase.from('payments').insert({
      contractor_id: contractorId,
      customer_id: customerId,
      job_id: jobId,
      estimate_id: entity_type === 'estimate' ? entity_id : null,
      amount: amountToCharge,
      fee_amount: feeAmount / 100,
      net_amount: netAmount,
      status: transfer.state === 'SUCCEEDED' ? 'succeeded' : 'pending',
      paid_at: transfer.state === 'SUCCEEDED' ? new Date().toISOString() : null,
    });

    // Step 4: Update the entity
    if (entity_type === 'estimate') {
      const { data: est } = await supabase
        .from('estimates')
        .select('payment_amount, grand_total, total_amount')
        .eq('id', entity_id)
        .single();

      if (est) {
        const prevPaid = est.payment_amount || 0;
        const newPaid = prevPaid + amountToCharge;
        const total = est.grand_total || est.total_amount || 0;
        const newBalance = Math.max(0, total - newPaid);
        const paymentStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

        await supabase
          .from('estimates')
          .update({
            status: 'accepted',
            signed_at: new Date().toISOString(),
            payment_status: paymentStatus,
            payment_amount: newPaid,
            balance_due: newBalance,
            paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
            payment_method: 'finix',
          })
          .eq('id', entity_id);
      }

      // Store in estimate_payment_sessions
      await supabase.from('estimate_payment_sessions').insert({
        estimate_id: entity_id,
        clover_session_id: transfer.id, // reusing field for finix transfer ID
        amount: amountToCharge,
        customer_email,
        payment_intent: payment_intent || 'full',
        payment_provider: 'finix',
        status: transfer.state === 'SUCCEEDED' ? 'succeeded' : 'pending',
        paid_at: transfer.state === 'SUCCEEDED' ? new Date().toISOString() : null,
      });
    } else if (entity_type === 'invoice') {
      const { data: inv } = await supabase
        .from('invoices')
        .select('amount_due, amount_paid')
        .eq('id', entity_id)
        .single();

      if (inv) {
        const newPaid = (inv.amount_paid || 0) + amountToCharge;
        const newBalance = Math.max(0, (inv.amount_due || 0) - newPaid);
        const isFullyPaid = newBalance <= 0;

        await supabase
          .from('invoices')
          .update({
            amount_paid: newPaid,
            balance_due: newBalance,
            payment_status: isFullyPaid ? 'paid' : 'partial',
            status: isFullyPaid ? 'paid' : 'partial',
            paid_at: isFullyPaid ? new Date().toISOString() : null,
          })
          .eq('id', entity_id);

        if (isFullyPaid && inv) {
          // Could trigger job completion here
        }
      }

      // Store in invoice_payment_sessions
      await supabase.from('invoice_payment_sessions').insert({
        invoice_id: entity_id,
        clover_session_id: transfer.id,
        customer_email: customer_email || '',
        amount: amountToCharge,
        payment_intent: payment_intent || 'remaining',
        payment_provider: 'finix',
        status: transfer.state === 'SUCCEEDED' ? 'succeeded' : 'pending',
        paid_at: transfer.state === 'SUCCEEDED' ? new Date().toISOString() : null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        state: transfer.state,
        amount: amountToCharge,
        payment_intent: payment_intent || 'full',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing Finix payment:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Payment failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
