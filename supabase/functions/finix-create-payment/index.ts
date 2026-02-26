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
  finix_token?: string;
  card_number?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  card_cvc?: string;
  card_name?: string;
  idempotency_key?: string;
}

// Input validation helpers
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function sanitizeCardNumber(num: string): string {
  return num.replace(/\D/g, '');
}

function validateCardDetails(body: FinixPaymentRequest): string | null {
  if (body.card_number) {
    const digits = sanitizeCardNumber(body.card_number);
    if (digits.length < 13 || digits.length > 19) return 'Invalid card number length';
    if (!body.card_expiry_month || body.card_expiry_month < 1 || body.card_expiry_month > 12) return 'Invalid expiry month';
    if (!body.card_expiry_year || body.card_expiry_year < new Date().getFullYear()) return 'Invalid expiry year';
    if (!body.card_cvc || body.card_cvc.length < 3 || body.card_cvc.length > 4) return 'Invalid CVC';
    if (!body.card_name || body.card_name.trim().length < 2) return 'Cardholder name required';
    // Check if card is expired this month
    const now = new Date();
    if (body.card_expiry_year === now.getFullYear() && body.card_expiry_month < (now.getMonth() + 1)) {
      return 'Card is expired';
    }
  }
  return null;
}

function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ success: false, message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Finix payment request started`);

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
      idempotency_key,
    } = body;

    // === STRICT INPUT VALIDATION ===
    if (!entity_type || !['estimate', 'invoice'].includes(entity_type)) {
      return errorResponse('Invalid entity type');
    }
    if (!entity_id || !validateUUID(entity_id)) {
      return errorResponse('Invalid entity ID');
    }
    if (!public_token || public_token.length < 10) {
      return errorResponse('Invalid public token');
    }
    if (payment_intent && !['deposit', 'full', 'remaining'].includes(payment_intent)) {
      return errorResponse('Invalid payment intent');
    }
    if (customer_email && !validateEmail(customer_email)) {
      return errorResponse('Invalid customer email');
    }

    const hasCardDetails = card_number && card_expiry_month && card_expiry_year && card_cvc && card_name;
    if (!finix_token && !hasCardDetails) {
      return errorResponse('Missing payment details: provide either finix_token or card details');
    }

    // Validate card details if provided
    if (hasCardDetails) {
      const cardError = validateCardDetails(body);
      if (cardError) return errorResponse(cardError);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const finixApiKey = Deno.env.get('FINIX_API_KEY')!;
    const finixEnv = Deno.env.get('FINIX_ENVIRONMENT') || 'sandbox';
    const finixBaseUrl = finixEnv === 'live'
      ? 'https://finix.live-payments-api.com'
      : 'https://finix.sandbox-payments-api.com';

    if (!finixApiKey) {
      console.error(`[${requestId}] FINIX_API_KEY not configured`);
      return errorResponse('Payment processing is not configured', 500);
    }

    const authHeader = `Basic ${btoa(finixApiKey)}`;
    const finixHeaders: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Finix-Version': '2022-02-01',
    };

    // === IDEMPOTENCY: Check for duplicate payment ===
    const idempKey = idempotency_key || `${entity_type}_${entity_id}_${payment_intent || 'full'}_${Date.now()}`;
    
    // Check for recent successful payment on this entity (within last 60 seconds) to prevent double-charge
    const recentCutoff = new Date(Date.now() - 60000).toISOString();
    if (entity_type === 'estimate') {
      const { data: recentPayment } = await supabase
        .from('estimate_payment_sessions')
        .select('id, status, amount, paid_at')
        .eq('estimate_id', entity_id)
        .eq('status', 'succeeded')
        .gte('paid_at', recentCutoff)
        .limit(1);

      if (recentPayment && recentPayment.length > 0) {
        console.log(`[${requestId}] Duplicate payment detected for estimate ${entity_id}`);
        return new Response(
          JSON.stringify({
            success: true,
            duplicate: true,
            message: 'Payment already processed',
            amount: recentPayment[0].amount,
            transfer_id: recentPayment[0].id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

      if (error || !estimate) {
        console.error(`[${requestId}] Estimate lookup failed:`, error?.message);
        return errorResponse('Estimate not found or link expired');
      }

      // Check estimate is in a valid state for payment
      if (estimate.voided_at) return errorResponse('This estimate has been voided');
      if (estimate.archived_at) return errorResponse('This estimate has been archived');

      contractorId = estimate.user_id;
      customerId = estimate.customer_id;
      jobId = estimate.job_id;

      const totalAmount = estimate.grand_total || estimate.total_amount || 0;
      const depositAmount = estimate.required_deposit || 0;
      const amountPaid = estimate.payment_amount || 0;
      const remainingBalance = Math.round((totalAmount - amountPaid) * 100) / 100;

      if (remainingBalance <= 0) {
        return errorResponse('This estimate is already fully paid');
      }

      const intent = payment_intent || 'full';
      if (intent === 'deposit') {
        const depositRemaining = Math.max(0, depositAmount - amountPaid);
        amountToCharge = Math.min(depositRemaining, remainingBalance);
        paymentDescription = `Deposit for Estimate ${estimate.estimate_number || entity_id}`;
      } else {
        amountToCharge = remainingBalance;
        paymentDescription = `Payment for Estimate ${estimate.estimate_number || entity_id}`;
      }
    } else if (entity_type === 'invoice') {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', entity_id)
        .eq('public_token', public_token)
        .single();

      if (error || !invoice) {
        console.error(`[${requestId}] Invoice lookup failed:`, error?.message);
        return errorResponse('Invoice not found or link expired');
      }

      contractorId = invoice.user_id;
      customerId = invoice.customer_id;
      jobId = invoice.job_id;

      const amountDue = invoice.amount_due || 0;
      const amountPaid = invoice.amount_paid || 0;
      const remainingBalance = Math.round(Math.max(0, amountDue - amountPaid) * 100) / 100;

      if (remainingBalance <= 0) {
        return errorResponse('This invoice is already fully paid');
      }

      amountToCharge = remainingBalance;
      paymentDescription = `Payment for Invoice ${invoice.invoice_number || entity_id}`;
    }

    amountToCharge = Math.round(amountToCharge * 100) / 100;

    if (amountToCharge <= 0) {
      return errorResponse('Invalid payment amount');
    }

    // Sanity cap: prevent absurdly large payments (configurable per-merchant later)
    if (amountToCharge > 100000) {
      console.error(`[${requestId}] Amount exceeds safety cap: ${amountToCharge}`);
      return errorResponse('Payment amount exceeds maximum allowed. Please contact the contractor.');
    }

    // === GET CONTRACTOR FINIX CREDENTIALS ===
    const { data: profile } = await supabase
      .from('profiles')
      .select('finix_merchant_id, finix_identity_id')
      .eq('id', contractorId)
      .single();

    if (!profile?.finix_merchant_id) {
      console.error(`[${requestId}] No Finix merchant for contractor ${contractorId}`);
      return errorResponse('Online payments are not configured for this contractor');
    }

    const merchantId = profile.finix_merchant_id;
    let identityId = profile.finix_identity_id;

    // Resolve identity if not cached
    if (!identityId) {
      console.log(`[${requestId}] Fetching identity from Finix merchant: ${merchantId}`);
      const merchantLookup = await fetch(`${finixBaseUrl}/merchants/${merchantId}`, {
        headers: finixHeaders,
      });
      const merchantText = await merchantLookup.text();
      if (merchantLookup.ok) {
        try {
          const merchantData = JSON.parse(merchantText);
          identityId = merchantData.identity;
          if (identityId) {
            await supabase.from('profiles').update({ finix_identity_id: identityId }).eq('id', contractorId);
          }
        } catch { /* parse error */ }
      }
      if (!identityId) {
        console.error(`[${requestId}] Could not resolve identity for merchant ${merchantId}`);
        return errorResponse('Merchant configuration error. Please contact the contractor.', 500);
      }
    }

    console.log(`[${requestId}] Creating payment: $${amountToCharge} for ${entity_type} ${entity_id}, merchant=${merchantId}`);

    // === TOKENIZE CARD ===
    let paymentInstrumentId: string;

    if (finix_token) {
      const instrumentResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
        method: 'POST',
        headers: finixHeaders,
        body: JSON.stringify({
          token: finix_token,
          type: 'TOKEN',
          identity: identityId,
        }),
      });
      const instrumentText = await instrumentResponse.text();
      if (!instrumentResponse.ok) {
        console.error(`[${requestId}] Finix token instrument error:`, instrumentText);
        return errorResponse('Failed to process card token. Please try again.');
      }
      const instrument = JSON.parse(instrumentText);
      paymentInstrumentId = instrument.id;
    } else {
      const sanitizedNumber = sanitizeCardNumber(card_number!);
      const instrumentResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
        method: 'POST',
        headers: finixHeaders,
        body: JSON.stringify({
          type: 'PAYMENT_CARD',
          identity: identityId,
          name: card_name!.trim(),
          number: sanitizedNumber,
          expiration_month: card_expiry_month,
          expiration_year: card_expiry_year,
          security_code: card_cvc,
        }),
      });
      const instrumentText = await instrumentResponse.text();
      if (!instrumentResponse.ok) {
        console.error(`[${requestId}] Card tokenization error:`, instrumentText);
        // Parse Finix error for better user messaging
        let userMessage = 'Card validation failed. Please check your card details and try again.';
        try {
          const errData = JSON.parse(instrumentText);
          if (errData?._embedded?.errors?.[0]?.message) {
            const finixMsg = errData._embedded.errors[0].message.toLowerCase();
            if (finixMsg.includes('number')) userMessage = 'Invalid card number. Please check and try again.';
            else if (finixMsg.includes('expir')) userMessage = 'Invalid expiration date. Please check and try again.';
            else if (finixMsg.includes('security') || finixMsg.includes('cvv')) userMessage = 'Invalid security code. Please check and try again.';
          }
        } catch { /* ignore parse error */ }
        return errorResponse(userMessage);
      }
      const instrument = JSON.parse(instrumentText);
      paymentInstrumentId = instrument.id;
      console.log(`[${requestId}] Card tokenized: ${paymentInstrumentId}`);
    }

    // === CREATE TRANSFER (CHARGE) ===
    const amountInCents = Math.round(amountToCharge * 100);

    // Add idempotency header to prevent double-charges on network retries
    const transferHeaders = { ...finixHeaders };
    if (idempotency_key) {
      transferHeaders['Idempotency-Id'] = idempotency_key;
    }

    const transferResponse = await fetch(`${finixBaseUrl}/transfers`, {
      method: 'POST',
      headers: transferHeaders,
      body: JSON.stringify({
        merchant: merchantId,
        amount: amountInCents,
        currency: 'USD',
        source: paymentInstrumentId,
        tags: {
          entity_type,
          entity_id,
          request_id: requestId,
          description: paymentDescription,
        },
      }),
    });

    const transferText = await transferResponse.text();
    if (!transferResponse.ok) {
      console.error(`[${requestId}] Finix transfer error:`, transferText);
      // Parse for better messaging
      let userMessage = 'Payment was declined. Please try a different card.';
      try {
        const errData = JSON.parse(transferText);
        if (errData?._embedded?.errors?.[0]?.message) {
          const msg = errData._embedded.errors[0].message.toLowerCase();
          if (msg.includes('insufficient')) userMessage = 'Insufficient funds. Please try a different card.';
          else if (msg.includes('amount')) userMessage = 'Invalid payment amount. Please contact the contractor.';
        }
      } catch { /* ignore */ }
      return errorResponse(userMessage);
    }

    const transfer = JSON.parse(transferText);
    const transferState = transfer.state || 'UNKNOWN';
    console.log(`[${requestId}] Transfer ${transfer.id} state: ${transferState}`);

    // Check for failed transfer state
    if (transferState === 'FAILED' || transferState === 'CANCELED') {
      console.error(`[${requestId}] Transfer failed with state: ${transferState}`);
      return errorResponse('Payment was declined. Please try a different card or contact your bank.');
    }

    // === RECORD PAYMENT ===
    const feeAmount = transfer.fee || 0;
    const netAmount = amountToCharge - (feeAmount / 100);
    const isSucceeded = transferState === 'SUCCEEDED' || transferState === 'PENDING';

    const { error: paymentInsertError } = await supabase.from('payments').insert({
      contractor_id: contractorId,
      customer_id: customerId,
      job_id: jobId,
      estimate_id: entity_type === 'estimate' ? entity_id : null,
      amount: amountToCharge,
      fee_amount: feeAmount / 100,
      net_amount: netAmount,
      status: transferState === 'SUCCEEDED' ? 'succeeded' : 'pending',
      paid_at: isSucceeded ? new Date().toISOString() : null,
    });

    if (paymentInsertError) {
      // Payment was charged but recording failed — log critically but don't fail the user
      console.error(`[${requestId}] CRITICAL: Payment recorded in Finix (${transfer.id}) but failed to save locally:`, paymentInsertError);
    }

    // === UPDATE ENTITY ===
    if (entity_type === 'estimate') {
      const { data: est } = await supabase
        .from('estimates')
        .select('payment_amount, grand_total, total_amount, client_name, estimate_number, title')
        .eq('id', entity_id)
        .single();

      let newBalance = 0;

      if (est) {
        const prevPaid = est.payment_amount || 0;
        const newPaid = Math.round((prevPaid + amountToCharge) * 100) / 100;
        const total = est.grand_total || est.total_amount || 0;
        newBalance = Math.round(Math.max(0, total - newPaid) * 100) / 100;
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
        customer_email: customer_email || '',
        payment_intent: payment_intent || 'full',
        payment_provider: 'finix',
        status: isSucceeded ? 'succeeded' : 'pending',
        paid_at: isSucceeded ? new Date().toISOString() : null,
      });

      // === SEND CONFIRMATION EMAILS ===
      if (isSucceeded && customer_email) {
        console.log(`[${requestId}] Preparing confirmation email to ${customer_email}`);
        try {
          const { data: contractorProfile } = await supabase
            .from('profiles')
            .select('company_name, full_name, phone, email, logo_url, brand_primary_color')
            .eq('id', contractorId)
            .single();

          const companyName = contractorProfile?.company_name || contractorProfile?.full_name || 'Your Contractor';
          const brandColor = contractorProfile?.brand_primary_color || '#D50A22';
          const brandColorDark = '#1e3a5f';
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@myct1.com';

          if (!resendApiKey) {
            console.error(`[${requestId}] RESEND_API_KEY not configured — skipping email`);
          } else {
            const isDeposit = payment_intent === 'deposit';
            const paymentLabel = isDeposit ? 'Deposit Payment' : 'Payment';
            const logoSection = contractorProfile?.logo_url 
              ? `<img src="${contractorProfile.logo_url}" alt="${companyName}" style="max-width: 180px; max-height: 60px; margin-bottom: 16px;" />`
              : `<h2 style="color: white; font-size: 24px; margin: 0 0 8px; font-weight: 800;">${companyName}</h2>`;

            const customerEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, ${brandColorDark} 0%, ${brandColor} 100%); padding: 48px 40px; text-align: center;">
          ${logoSection}
          <div style="background: rgba(255,255,255,0.15); border-radius: 50%; width: 72px; height: 72px; margin: 16px auto; display: inline-block; line-height: 72px;">
            <span style="font-size: 36px;">✓</span>
          </div>
          <h1 style="color: white; font-size: 30px; margin: 16px 0 4px; font-weight: 800; letter-spacing: -0.5px;">${paymentLabel} Received!</h1>
          <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin: 0;">Thank you for your trust in ${companyName}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding: 40px;">
          <p style="font-size: 17px; color: #1f2937; margin: 0 0 20px; line-height: 1.6;">
            Dear <strong>${est?.client_name || 'Valued Customer'}</strong>,
          </p>
          <p style="font-size: 16px; color: #374151; margin: 0 0 28px; line-height: 1.6;">
            We've successfully received your ${isDeposit ? 'deposit' : ''} payment of <strong style="color: ${brandColor};">$${amountToCharge.toFixed(2)}</strong>. 
            We truly appreciate your business and look forward to delivering exceptional results!
          </p>

          <!-- Payment Summary Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 28px;">
            <tr><td style="background: ${brandColor}; padding: 14px 20px;">
              <p style="color: white; font-size: 14px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Payment Summary</p>
            </td></tr>
            <tr><td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Estimate</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${est?.estimate_number || est?.title || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Project</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${est?.title || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">${paymentLabel}</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #059669; font-size: 22px; border-bottom: 1px solid #f3f4f6;">$${amountToCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Date</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Transaction ID</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #6b7280; font-size: 11px; font-family: monospace;">${transfer.id}</td>
                </tr>
                ${newBalance > 0 ? `
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-top: 2px solid #e5e7eb;">Remaining Balance</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #d97706; font-size: 18px; border-top: 2px solid #e5e7eb;">$${newBalance.toFixed(2)}</td>
                </tr>` : `
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-top: 2px solid #e5e7eb;">Status</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #059669; font-size: 16px; border-top: 2px solid #e5e7eb;">✓ Paid in Full</td>
                </tr>`}
              </table>
            </td></tr>
          </table>

          <!-- Next Steps -->
          <div style="background: #eff6ff; border-left: 4px solid ${brandColor}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
            <p style="font-size: 15px; color: #1e40af; margin: 0 0 4px; font-weight: 700;">What's Next?</p>
            <p style="font-size: 14px; color: #1e40af; margin: 0; line-height: 1.5;">
              Our team will be in touch shortly to schedule and coordinate your project. If you have any questions in the meantime, don't hesitate to reach out!
            </p>
          </div>

          ${contractorProfile?.phone || contractorProfile?.email ? `
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              ${contractorProfile?.phone ? `<td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 13px;">📞</span> <a href="tel:${contractorProfile.phone}" style="color: ${brandColor}; text-decoration: none; font-size: 14px; font-weight: 600;">${contractorProfile.phone}</a></td>` : ''}
              ${contractorProfile?.email ? `<td style="padding: 8px 0; text-align: right;"><span style="color: #6b7280; font-size: 13px;">✉️</span> <a href="mailto:${contractorProfile.email}" style="color: ${brandColor}; text-decoration: none; font-size: 14px; font-weight: 600;">${contractorProfile.email}</a></td>` : ''}
            </tr>
          </table>` : ''}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px;">With gratitude,</p>
          <p style="font-size: 16px; color: #1f2937; font-weight: 700; margin: 0 0 16px;">${companyName}</p>
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">This is an automated payment confirmation. Please keep this email for your records.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

            // Send customer confirmation email
            console.log(`[${requestId}] Sending customer email via Resend to ${customer_email} from ${emailFrom}`);
            const emailResp = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: `${companyName} <${emailFrom}>`,
                to: [customer_email],
                subject: `${paymentLabel} Confirmation — ${companyName}`,
                html: customerEmailHtml,
              }),
            });
            const emailText = await emailResp.text();
            if (!emailResp.ok) {
              console.error(`[${requestId}] Customer email FAILED (${emailResp.status}):`, emailText);
            } else {
              console.log(`[${requestId}] ✅ Customer confirmation email sent to ${customer_email}`);
            }

            // Also notify the contractor
            if (contractorProfile?.email) {
              const contractorNotifHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
    <tr><td align="center" style="padding: 32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px;">
        <tr><td style="padding-bottom: 24px;">
          <h1 style="color: #059669; font-size: 24px; margin: 0 0 8px;">💰 New Payment Received!</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">A customer just made a payment on your estimate.</p>
        </td></tr>
        <tr><td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding: 6px 0; color: #374151; font-size: 14px;"><strong>Customer:</strong> ${est?.client_name || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #374151; font-size: 14px;"><strong>Estimate:</strong> ${est?.estimate_number || est?.title || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #059669; font-size: 20px; font-weight: 800;"><strong>Amount:</strong> $${amountToCharge.toFixed(2)} ${isDeposit ? '(Deposit)' : ''}</td></tr>
            ${newBalance > 0 ? `<tr><td style="padding: 6px 0; color: #d97706; font-size: 14px;"><strong>Remaining Balance:</strong> $${newBalance.toFixed(2)}</td></tr>` : `<tr><td style="padding: 6px 0; color: #059669; font-size: 14px;"><strong>Status:</strong> ✓ Paid in Full</td></tr>`}
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 12px;"><strong>Transaction:</strong> ${transfer.id}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-top: 20px;"><p style="font-size: 13px; color: #9ca3af; margin: 0;">Powered by CT1 Payment Processing</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

              const contractorEmailResp = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: `CT1 Payments <${emailFrom}>`,
                  to: [contractorProfile.email],
                  subject: `💰 Payment Received: $${amountToCharge.toFixed(2)} from ${est?.client_name || 'Customer'}`,
                  html: contractorNotifHtml,
                }),
              });
              const contractorEmailText = await contractorEmailResp.text();
              if (!contractorEmailResp.ok) {
                console.error(`[${requestId}] Contractor notification email FAILED:`, contractorEmailText);
              } else {
                console.log(`[${requestId}] ✅ Contractor notification sent to ${contractorProfile.email}`);
              }
            }
          }
        } catch (emailErr) {
          console.error(`[${requestId}] Email error (non-fatal):`, emailErr);
        }
      }
    } else if (entity_type === 'invoice') {
      const { data: inv } = await supabase
        .from('invoices')
        .select('amount_due, amount_paid')
        .eq('id', entity_id)
        .single();

      if (inv) {
        const newPaid = Math.round(((inv.amount_paid || 0) + amountToCharge) * 100) / 100;
        const newBalance = Math.round(Math.max(0, (inv.amount_due || 0) - newPaid) * 100) / 100;
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
        status: isSucceeded ? 'succeeded' : 'pending',
        paid_at: isSucceeded ? new Date().toISOString() : null,
      });
    }

    console.log(`[${requestId}] Payment complete: $${amountToCharge} via transfer ${transfer.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        state: transferState,
        amount: amountToCharge,
        payment_intent: payment_intent || 'full',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
