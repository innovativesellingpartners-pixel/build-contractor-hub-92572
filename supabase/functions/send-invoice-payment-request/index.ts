import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPaymentRequestRequest {
  invoiceId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  sendEmail: boolean;
  sendSms: boolean;
  customMessage?: string;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length > 10) return `+${cleaned}`;
  return phone;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      invoiceId,
      recipientEmail,
      recipientPhone,
      recipientName,
      sendEmail,
      sendSms,
      customMessage,
    }: SendPaymentRequestRequest = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoiceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        jobs (name, job_number, address),
        customers (name, email, phone)
      `)
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate remaining balance
    const amountDue = invoice.amount_due || 0;
    const amountPaid = invoice.amount_paid || 0;
    const remainingBalance = Math.max(0, amountDue - amountPaid);

    if (remainingBalance <= 0) {
      return new Response(JSON.stringify({ error: "Invoice is already paid in full" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch contractor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, business_phone, business_email")
      .eq("id", user.id)
      .single();

    const businessName = profile?.business_name || "Your Contractor";
    // Use the Lovable published URL as fallback to avoid SSL issues with custom domains
    const appUrl = Deno.env.get("APP_URL") || "https://build-contractor-hub-92572.lovable.app";
    const paymentUrl = `${appUrl}/invoice/${invoice.public_token}`;

    let emailSent = false;
    let smsSent = false;

    // Send Email
    if (sendEmail && recipientEmail) {
      try {
        const fromEmail = Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>";
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Payment Request</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #d4af37; margin: 0; font-size: 28px;">${businessName}</h1>
              <p style="color: #fff; margin: 10px 0 0; font-size: 16px;">Payment Request - Invoice ${invoice.invoice_number}</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <p style="font-size: 16px;">Dear ${recipientName || invoice.customers?.name || 'Valued Customer'},</p>
              
              ${customMessage ? `<p>${customMessage}</p>` : `<p>This is a friendly reminder that you have an outstanding balance on your invoice.</p>`}
              
              ${invoice.jobs ? `
                <div style="background: #fff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #d4af37;">
                  <strong>Job:</strong> ${invoice.jobs.name || 'N/A'}<br/>
                  ${invoice.jobs.job_number ? `<strong>Job #:</strong> ${invoice.jobs.job_number}<br/>` : ''}
                  ${invoice.jobs.address ? `<strong>Location:</strong> ${invoice.jobs.address}` : ''}
                </div>
              ` : ''}
              
              <div style="background: #1e3a5f; color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <div style="font-size: 14px; margin-bottom: 5px;">Amount Due</div>
                <div style="font-size: 36px; font-weight: bold; color: #d4af37;">
                  $${remainingBalance.toFixed(2)}
                </div>
                ${amountPaid > 0 ? `
                  <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
                    Total: $${amountDue.toFixed(2)} | Already Paid: $${amountPaid.toFixed(2)}
                  </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentUrl}" 
                   style="display: inline-block; background: #d4af37; color: #1e3a5f; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                  Pay Now
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Thank you for your prompt attention to this matter.<br/>
                <strong>${businessName}</strong>
                ${profile?.business_phone ? `<br/>Phone: ${profile.business_phone}` : ''}
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
          to: [recipientEmail],
          subject: `Payment Request - Invoice ${invoice.invoice_number} - $${remainingBalance.toFixed(2)} Due`,
          html: emailHtml,
        });

        emailSent = true;
        console.log(`Payment request email sent to ${recipientEmail}`);
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
      }
    }

    // Send SMS
    if (sendSms && recipientPhone) {
      try {
        // Get contractor's Twilio number
        const { data: phoneData } = await supabase
          .from("phone_numbers")
          .select("twilio_number")
          .eq("contractor_id", user.id)
          .eq("is_active", true)
          .single();

        if (phoneData?.twilio_number) {
          const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
          const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

          if (accountSid && authToken) {
            const smsMessage = `Hi ${recipientName || invoice.customers?.name || 'there'}, this is ${businessName}. You have an outstanding balance of $${remainingBalance.toFixed(2)} for Invoice #${invoice.invoice_number}. Pay securely online: ${paymentUrl}`;

            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const twilioAuth = btoa(`${accountSid}:${authToken}`);
            const formattedPhone = formatPhoneNumber(recipientPhone);

            const response = await fetch(twilioUrl, {
              method: "POST",
              headers: {
                "Authorization": `Basic ${twilioAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: formattedPhone,
                From: phoneData.twilio_number,
                Body: smsMessage,
              }),
            });

            if (response.ok) {
              smsSent = true;
              console.log(`Payment request SMS sent to ${formattedPhone}`);
            } else {
              const result = await response.json();
              console.error("Twilio error:", result);
            }
          }
        }
      } catch (smsError: any) {
        console.error("Error sending SMS:", smsError);
      }
    }

    // Log the payment request
    await supabase.from("invoice_payment_requests").insert({
      invoice_id: invoiceId,
      user_id: user.id,
      recipient_email: recipientEmail || null,
      recipient_phone: recipientPhone || null,
      amount_requested: remainingBalance,
      email_sent: emailSent,
      sms_sent: smsSent,
    });

    // Update last payment request timestamp
    await supabase
      .from("invoices")
      .update({ last_payment_request_at: new Date().toISOString() })
      .eq("id", invoiceId);

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        sms_sent: smsSent,
        amount_requested: remainingBalance,
        payment_url: paymentUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-payment-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
