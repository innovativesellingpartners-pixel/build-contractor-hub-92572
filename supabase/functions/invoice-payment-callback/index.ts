import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { session_id, payment_status, clover_payment_id } = await req.json();

    console.log(`Processing invoice payment callback: session=${session_id}, status=${payment_status}`);

    // Find the payment session
    const { data: session, error: sessionError } = await supabase
      .from("invoice_payment_sessions")
      .select("*, invoices(*)")
      .eq("clover_session_id", session_id)
      .single();

    if (sessionError || !session) {
      console.error("Payment session not found:", sessionError);
      return new Response(
        JSON.stringify({ error: "Payment session not found" }),
        { status: 404, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (payment_status === "success" || payment_status === "completed") {
      const invoice = session.invoices;
      const paymentAmount = session.amount;
      const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount;
      const newBalanceDue = Math.max(0, (invoice.amount_due || 0) - newAmountPaid);
      const isFullyPaid = newBalanceDue <= 0;

      console.log(`Payment success: Adding $${paymentAmount}, New total paid: $${newAmountPaid}, Balance: $${newBalanceDue}`);

      // Update payment session
      await supabase
        .from("invoice_payment_sessions")
        .update({
          status: "completed",
          clover_payment_id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      // Update invoice
      await supabase
        .from("invoices")
        .update({
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          payment_status: isFullyPaid ? "paid" : "partial",
          status: isFullyPaid ? "paid" : "partial",
          clover_payment_id,
          paid_at: isFullyPaid ? new Date().toISOString() : null,
        })
        .eq("id", invoice.id);

      // If fully paid, update job status to complete
      if (isFullyPaid && invoice.job_id) {
        console.log(`Invoice fully paid, marking job ${invoice.job_id} as complete`);
        await supabase
          .from("jobs")
          .update({
            job_status: "complete",
            completed_at: new Date().toISOString(),
          })
          .eq("id", invoice.job_id);

        // Send paid receipt email
        await sendPaidReceipt(supabase, resend, invoice, newAmountPaid);
      }

      return new Response(
        JSON.stringify({
          success: true,
          amount_paid: paymentAmount,
          total_paid: newAmountPaid,
          balance_due: newBalanceDue,
          fully_paid: isFullyPaid,
        }),
        { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    } else {
      // Payment failed or cancelled
      await supabase
        .from("invoice_payment_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);

      return new Response(
        JSON.stringify({ success: false, status: payment_status }),
        { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in invoice-payment-callback:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

async function sendPaidReceipt(supabase: any, resend: any, invoice: any, totalPaid: number) {
  try {
    // Fetch customer email
    const { data: customer } = await supabase
      .from("customers")
      .select("email, name")
      .eq("id", invoice.customer_id)
      .single();

    if (!customer?.email) {
      console.log("No customer email found, skipping receipt");
      return;
    }

    // Fetch contractor info
    const { data: contractor } = await supabase
      .from("profiles")
      .select("business_name, business_phone, business_email")
      .eq("id", invoice.user_id)
      .single();

    // Fetch job info
    const { data: job } = await supabase
      .from("jobs")
      .select("name, job_number, address")
      .eq("id", invoice.job_id)
      .single();

    const businessName = contractor?.business_name || "Your Contractor";
    const fromEmail = Deno.env.get("EMAIL_FROM") || 'pwm@myct1.com';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">✓ Payment Received</h1>
          <p style="color: #fff; margin: 10px 0 0; font-size: 16px;">Thank you for your payment!</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px;">Dear ${customer.name || 'Valued Customer'},</p>
          
          <p>We have received your payment for Invoice #${invoice.invoice_number}. Your account is now paid in full.</p>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 15px; color: #16a34a;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Invoice Number:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">$${(invoice.amount_due || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Amount Paid:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #16a34a;">$${totalPaid.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Payment Date:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>
          </div>
          
          ${job ? `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px; color: #166534;">Job Complete</h4>
              <p style="margin: 0; color: #166534;">
                <strong>${job.name}</strong><br/>
                ${job.job_number ? `Job #${job.job_number}` : ''}
                ${job.address ? `<br/>${job.address}` : ''}
              </p>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px;">If you have any questions about your payment or need further assistance, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 20px;">
            Thank you for your business!<br/>
            <strong>${businessName}</strong>
            ${contractor?.business_phone ? `<br/>Phone: ${contractor.business_phone}` : ''}
            ${contractor?.business_email ? `<br/>Email: ${contractor.business_email}` : ''}
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>Powered by CT1</p>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: [customer.email],
      subject: `Payment Receipt - Invoice ${invoice.invoice_number} - ${businessName}`,
      html: emailHtml,
    });

    // Update invoice to mark receipt sent
    await supabase
      .from("invoices")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("id", invoice.id);

    console.log(`Paid receipt sent to ${customer.email}`);
  } catch (error) {
    console.error("Error sending paid receipt:", error);
  }
}
