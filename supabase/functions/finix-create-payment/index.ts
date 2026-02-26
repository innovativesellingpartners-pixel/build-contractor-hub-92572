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
  finix_token?: string; // Tokenized card from Finix.js (legacy)
  // Direct card details (server-side tokenization)
  card_number?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  card_cvc?: string;
  card_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: FinixPaymentRequest = await req.json();
    const {
      entity_type,
      entity_id,
      public_token,
      payment_intent,
      customer_email,
      finix_token,
      card_number,
      card_expiry_month,
      card_expiry_year,
      card_cvc,
      card_name,
    } = body;

    if (!entity_id || !public_token || !entity_type) {
      throw new Error('Missing required fields');
    }

    // Must have either a finix_token OR raw card details
    const hasCardDetails = card_number && card_expiry_month && card_expiry_year && card_cvc && card_name;
    if (!finix_token && !hasCardDetails) {
      throw new Error('Missing payment details: provide either finix_token or card details');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const finixApiKey = Deno.env.get('FINIX_API_KEY')!;
    const finixEnv = Deno.env.get('FINIX_ENVIRONMENT') || 'sandbox';
    const finixBaseUrl = finixEnv === 'live'
      ? 'https://finix.live-payments-api.com'
      : 'https://finix.sandbox-payments-api.com';

    const authHeader = `Basic ${btoa(finixApiKey)}`;
    const finixHeaders = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Finix-Version': '2022-02-01',
    };

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

    // Get contractor's Finix merchant ID and identity ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('finix_merchant_id, finix_identity_id')
      .eq('id', contractorId)
      .single();

    if (!profile?.finix_merchant_id) {
      throw new Error('Finix merchant not configured for this contractor');
    }

    const merchantId = profile.finix_merchant_id;
    let identityId = profile.finix_identity_id;

    // If identity ID not stored, fetch it from the merchant record
    if (!identityId) {
      console.log('Identity ID not cached, fetching from Finix merchant:', merchantId);
      const merchantLookup = await fetch(`${finixBaseUrl}/merchants/${merchantId}`, {
        headers: finixHeaders,
      });
      if (merchantLookup.ok) {
        const merchantData = await merchantLookup.json();
        identityId = merchantData.identity;
        console.log('Resolved identity from merchant:', identityId);
        // Cache it for future use
        if (identityId) {
          await supabase.from('profiles').update({ finix_identity_id: identityId }).eq('id', contractorId);
        }
      }
      if (!identityId) {
        throw new Error('Could not resolve Finix identity for this merchant');
      }
    }

    console.log('Creating Finix payment:', {
      entity_type,
      entity_id,
      amountToCharge,
      merchantId,
      identityId,
      hasToken: !!finix_token,
      hasCardDetails: !!hasCardDetails,
    });

    let paymentInstrumentId: string;

    if (finix_token) {
      // Legacy path: use pre-tokenized card
      const instrumentResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
        method: 'POST',
        headers: finixHeaders,
        body: JSON.stringify({
          token: finix_token,
          type: 'TOKEN',
          identity: identityId,
        }),
      });

      if (!instrumentResponse.ok) {
        const errText = await instrumentResponse.text();
        console.error('Finix instrument error:', errText);
        throw new Error('Failed to create payment instrument');
      }

      const instrument = await instrumentResponse.json();
      paymentInstrumentId = instrument.id;
    } else {
      // Server-side tokenization: create payment instrument directly from card details
      const instrumentResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
        method: 'POST',
        headers: finixHeaders,
        body: JSON.stringify({
          type: 'PAYMENT_CARD',
          identity: identityId,
          name: card_name,
          number: card_number,
          expiration_month: card_expiry_month,
          expiration_year: card_expiry_year,
          security_code: card_cvc,
        }),
      });

      if (!instrumentResponse.ok) {
        const errText = await instrumentResponse.text();
        console.error('Finix card tokenization error:', errText);
        throw new Error('Card validation failed. Please check your card details and try again.');
      }

      const instrument = await instrumentResponse.json();
      paymentInstrumentId = instrument.id;
      console.log('Card tokenized server-side:', paymentInstrumentId);
    }

    console.log('Payment instrument ready:', paymentInstrumentId);

    // Create a Transfer (charge)
    const amountInCents = Math.round(amountToCharge * 100);

    const transferResponse = await fetch(`${finixBaseUrl}/transfers`, {
      method: 'POST',
      headers: finixHeaders,
      body: JSON.stringify({
        merchant: merchantId,
        amount: amountInCents,
        currency: 'USD',
        source: paymentInstrumentId,
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
      throw new Error('Payment processing failed. Please try again.');
    }

    const transfer = await transferResponse.json();
    console.log('Finix transfer created:', transfer.id, 'state:', transfer.state);

    // Record payment in our system
    const feeAmount = transfer.fee || 0;
    const netAmount = amountToCharge - (feeAmount / 100);

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

    // Update the entity
    if (entity_type === 'estimate') {
      const { data: est } = await supabase
        .from('estimates')
        .select('payment_amount, grand_total, total_amount, client_name, estimate_number, title')
        .eq('id', entity_id)
        .single();

      let newBalance = 0;

      if (est) {
        const prevPaid = est.payment_amount || 0;
        const newPaid = prevPaid + amountToCharge;
        const total = est.grand_total || est.total_amount || 0;
        newBalance = Math.max(0, total - newPaid);
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

      await supabase.from('estimate_payment_sessions').insert({
        estimate_id: entity_id,
        clover_session_id: transfer.id,
        amount: amountToCharge,
        customer_email,
        payment_intent: payment_intent || 'full',
        payment_provider: 'finix',
        status: transfer.state === 'SUCCEEDED' ? 'succeeded' : 'pending',
        paid_at: transfer.state === 'SUCCEEDED' ? new Date().toISOString() : null,
      });

      // Send thank you email to customer
      if (transfer.state === 'SUCCEEDED' && customer_email) {
        try {
          const { data: contractorProfile } = await supabase
            .from('profiles')
            .select('company_name, full_name, phone')
            .eq('id', contractorId)
            .single();

          const companyName = contractorProfile?.company_name || contractorProfile?.full_name || 'Your Contractor';
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@myct1.com';

          if (resendApiKey) {
            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                  <div style="background: white; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">✓</span>
                  </div>
                  <h1 style="color: white; font-size: 28px; margin: 0 0 8px;">Payment Received!</h1>
                  <p style="color: #bbf7d0; font-size: 16px; margin: 0;">Thank you for your payment</p>
                </div>
                <div style="padding: 32px;">
                  <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
                    Dear ${est?.client_name || 'Valued Customer'},
                  </p>
                  <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
                    We've received your ${payment_intent === 'deposit' ? 'deposit' : ''} payment of <strong>$${(amountToCharge).toFixed(2)}</strong>. 
                    Thank you for choosing ${companyName} — we truly appreciate your business!
                  </p>
                  <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Estimate</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${est?.estimate_number || est?.title || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Amount Paid</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a; font-size: 18px;">$${(amountToCharge).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Date</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</td>
                      </tr>
                      ${newBalance > 0 ? `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Remaining Balance</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #d97706;">$${newBalance.toFixed(2)}</td></tr>` : ''}
                    </table>
                  </div>
                  <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
                    Our team will be in touch shortly to schedule your project. If you have any questions, don't hesitate to reach out.
                  </p>
                  ${contractorProfile?.phone ? `<p style="font-size: 14px; color: #666;">Contact us: ${contractorProfile.phone}</p>` : ''}
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                  <p style="font-size: 14px; color: #666; text-align: center;">
                    With gratitude,<br /><strong>${companyName}</strong>
                  </p>
                </div>
              </div>
            `;

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: `${companyName} <${emailFrom}>`,
                to: [customer_email],
                subject: `Payment Confirmation - ${companyName}`,
                html: emailHtml,
              }),
            });
          }
        } catch (emailErr) {
          console.error('Failed to send thank you email:', emailErr);
          // Don't fail the payment response if email fails
        }
      }
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
      }

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
