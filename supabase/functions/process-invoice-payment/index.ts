import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from '../_shared/cors.ts';

interface ProcessPaymentRequest {
  invoice_id: string;
  public_token: string;
  payment_intent: "full" | "remaining";
  customer_email?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoice_id, public_token, payment_intent, customer_email }: ProcessPaymentRequest = await req.json();

    if (!invoice_id || !public_token) {
      return new Response(
        JSON.stringify({ error: "invoice_id and public_token are required" }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing invoice payment: invoice_id=${invoice_id}, intent=${payment_intent}`);

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .eq("public_token", public_token)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Calculate amounts
    const amountDue = invoice.amount_due || 0;
    const amountPaid = invoice.amount_paid || 0;
    const remainingBalance = Math.max(0, amountDue - amountPaid);

    // Check if already paid
    if (remainingBalance <= 0) {
      return new Response(
        JSON.stringify({ error: "Invoice is already paid in full" }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Determine charge amount (always remaining balance for invoices)
    const chargeAmount = remainingBalance;

    console.log(`Charging amount: $${chargeAmount} (remaining balance)`);

    // Idempotency check - prevent duplicate sessions within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingSession } = await supabase
      .from("invoice_payment_sessions")
      .select("*")
      .eq("invoice_id", invoice_id)
      .eq("amount", chargeAmount)
      .eq("status", "pending")
      .gte("created_at", fiveMinutesAgo)
      .single();

    if (existingSession) {
      console.log("Found existing pending session, reusing");
      // We could return the existing checkout URL if we stored it
    }

    // Create Clover checkout session
    const cloverApiToken = Deno.env.get("CLOVER_API_TOKEN");
    const cloverMerchantId = Deno.env.get("CLOVER_MERCHANT_ID");

    if (!cloverApiToken || !cloverMerchantId) {
      return new Response(
        JSON.stringify({ error: "Payment provider not configured" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Use the Lovable published URL as fallback to avoid SSL issues with custom domains
    const appUrl = Deno.env.get("APP_URL") || "https://build-contractor-hub-92572.lovable.app";
    const callbackUrl = `${appUrl}/invoice/${public_token}`;

    // Determine environment with fallback
    const envRaw = (Deno.env.get("CLOVER_ENV") || "auto").toLowerCase();
    const candidates = envRaw === "sandbox"
      ? ["https://apisandbox.dev.clover.com"]
      : envRaw === "production"
        ? ["https://api.clover.com"]
        : ["https://api.clover.com", "https://apisandbox.dev.clover.com"];

    let checkoutUrl: string | null = null;
    let sessionId: string | null = null;
    let lastError = "";

    for (const baseUrl of candidates) {
      console.log(`Trying Clover API: ${baseUrl}`);

      const cloverResponse = await fetch(
        `${baseUrl}/invoicingcheckoutservice/v1/checkouts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cloverApiToken}`,
            "Content-Type": "application/json",
            "X-Clover-Merchant-Id": cloverMerchantId,
          },
          body: JSON.stringify({
            customer: {
              email: customer_email || invoice.customers?.email || "customer@example.com",
            },
            shoppingCart: {
              lineItems: [
                {
                  name: `Invoice ${invoice.invoice_number} - Balance Payment`,
                  unitQty: 1,
                  price: Math.round(chargeAmount * 100), // Clover expects cents
                  note: `Remaining balance for Invoice #${invoice.invoice_number}`,
                },
              ],
            },
            redirectUrls: {
              success: `${callbackUrl}?payment=success&amount=${chargeAmount}`,
              failure: `${callbackUrl}?payment=error`,
              cancel: `${callbackUrl}?payment=cancelled`,
            },
          }),
        }
      );

      const responseText = await cloverResponse.text();
      console.log("Clover response:", cloverResponse.status, responseText);

      if (cloverResponse.ok) {
        const cloverData = JSON.parse(responseText);
        checkoutUrl = cloverData.href;
        sessionId = cloverData.checkoutSessionId;
        break;
      }

      lastError = responseText;
      if (cloverResponse.status !== 404) break;
    }

    if (!checkoutUrl || !sessionId) {
      console.error("Failed to create Clover checkout:", lastError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment session" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Store payment session
    await supabase.from("invoice_payment_sessions").insert({
      invoice_id: invoice.id,
      clover_session_id: sessionId,
      customer_email: customer_email || invoice.customers?.email || "",
      amount: chargeAmount,
      payment_intent: payment_intent || "remaining",
      status: "pending",
    });

    console.log(`Created checkout session: ${sessionId}, URL: ${checkoutUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        session_id: sessionId,
        amount: chargeAmount,
      }),
      { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-invoice-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
