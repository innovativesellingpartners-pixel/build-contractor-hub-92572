import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invoice-email function called");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoiceId, recipientEmail, recipientName }: SendInvoiceRequest = await req.json();

    if (!invoiceId || !recipientEmail) {
      console.error("Missing required fields: invoiceId or recipientEmail");
      return new Response(
        JSON.stringify({ error: "Missing required fields: invoiceId, recipientEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching invoice ${invoiceId}`);

    // Fetch invoice with job data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        jobs (
          name,
          job_number,
          address
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, business_email, business_phone")
      .eq("id", invoice.user_id)
      .single();

    const businessName = profile?.business_name || "CT1 Contractor";
    const businessEmail = profile?.business_email || "noreply@myct1.com";

    // Format line items for email
    const lineItems = (invoice.line_items as any[]) || [];
    const lineItemsHtml = lineItems.length > 0
      ? lineItems.map((item: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description || item.name || 'Item'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</td>
          </tr>
        `).join("")
      : "<tr><td colspan='3' style='padding: 8px;'>See attached for details</td></tr>";

    const dueDate = invoice.due_date 
      ? new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : "Due upon receipt";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #d4af37; margin: 0; font-size: 28px;">${businessName}</h1>
          <p style="color: #fff; margin: 10px 0 0; font-size: 14px;">Invoice ${invoice.invoice_number}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Dear ${recipientName || 'Valued Customer'},
          </p>
          
          <p style="margin-bottom: 20px;">
            Please find your invoice details below. Payment is due by <strong>${dueDate}</strong>.
          </p>

          ${invoice.jobs ? `
            <div style="background: #fff; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #d4af37;">
              <strong>Job:</strong> ${invoice.jobs.name || 'N/A'}<br/>
              ${invoice.jobs.job_number ? `<strong>Job #:</strong> ${invoice.jobs.job_number}<br/>` : ''}
              ${invoice.jobs.address ? `<strong>Location:</strong> ${invoice.jobs.address}` : ''}
            </div>
          ` : ''}
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff;">
            <thead>
              <tr style="background: #1e3a5f; color: #fff;">
                <th style="padding: 12px; text-align: left;">Description</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>
          
          <div style="background: #1e3a5f; color: #fff; padding: 20px; border-radius: 4px; text-align: right;">
            <div style="font-size: 14px; margin-bottom: 5px;">Amount Due</div>
            <div style="font-size: 28px; font-weight: bold; color: #d4af37;">
              $${(invoice.amount_due || 0).toFixed(2)}
            </div>
            ${invoice.amount_paid > 0 ? `
              <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
                Amount Paid: $${invoice.amount_paid.toFixed(2)} | Balance: $${((invoice.amount_due || 0) - (invoice.amount_paid || 0)).toFixed(2)}
              </div>
            ` : ''}
          </div>

          ${invoice.stripe_payment_link ? `
            <div style="text-align: center; margin-top: 25px;">
              <a href="${invoice.stripe_payment_link}" 
                 style="display: inline-block; background: #d4af37; color: #1e3a5f; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Pay Now
              </a>
            </div>
          ` : ''}

          ${invoice.notes ? `
            <div style="margin-top: 25px; padding: 15px; background: #fff; border-radius: 4px; border: 1px solid #e0e0e0;">
              <strong>Notes:</strong><br/>
              <p style="margin: 10px 0 0; white-space: pre-wrap;">${invoice.notes}</p>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Thank you for your business!<br/>
            <strong>${businessName}</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>This invoice was sent via CT1 Business Suite</p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending invoice email to ${recipientEmail}`);

    const fromEmail = Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>";
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `Invoice ${invoice.invoice_number} from ${businessName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invoice status to sent
    await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
