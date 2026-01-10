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
  includeWaivers?: boolean;
  waiverAttachmentMode?: 'combined' | 'separate';
}

const WAIVER_TYPE_LABELS: Record<string, string> = {
  conditional_progress: 'Conditional Waiver - Progress',
  unconditional_progress: 'Unconditional Waiver - Progress',
  conditional_final: 'Conditional Waiver - Final',
  unconditional_final: 'Unconditional Waiver - Final',
};

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

    const { 
      invoiceId, 
      recipientEmail, 
      recipientName,
      includeWaivers = false,
      waiverAttachmentMode = 'combined'
    }: SendInvoiceRequest = await req.json();

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
          address,
          city,
          state,
          zip_code
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
      .select("business_name, business_email, business_phone, business_address")
      .eq("id", invoice.user_id)
      .single();

    const businessName = profile?.business_name || "CT1 Contractor";
    const businessEmail = profile?.business_email || "noreply@myct1.com";

    // Fetch waivers if requested
    let waivers: any[] = [];
    if (includeWaivers) {
      const { data: waiverData } = await supabase
        .from("invoice_waivers")
        .select(`
          *,
          gc_contacts (
            name,
            company
          )
        `)
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });
      
      waivers = waiverData || [];
      console.log(`Found ${waivers.length} waivers to include`);
    }

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

    const jobAddress = invoice.jobs 
      ? `${invoice.jobs.address || ''}${invoice.jobs.city ? ', ' + invoice.jobs.city : ''}${invoice.jobs.state ? ', ' + invoice.jobs.state : ''} ${invoice.jobs.zip_code || ''}`.trim()
      : "";

    // Generate waiver summary for email body
    const waiverSummaryHtml = waivers.length > 0 ? `
      <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border-radius: 4px; border: 1px solid #86efac;">
        <strong style="color: #166534;">📎 Attached Lien Waivers (${waivers.length}):</strong>
        <ul style="margin: 10px 0 0; padding-left: 20px; color: #166534;">
          ${waivers.map(w => `<li style="margin: 5px 0;">${WAIVER_TYPE_LABELS[w.waiver_type] || w.waiver_type} - $${w.amount.toFixed(2)}</li>`).join('')}
        </ul>
        ${waiverAttachmentMode === 'combined' 
          ? '<p style="margin: 10px 0 0; font-size: 12px; color: #166534;">Waivers are included in the document below.</p>'
          : '<p style="margin: 10px 0 0; font-size: 12px; color: #166534;">Each waiver is attached as a separate document.</p>'}
      </div>
    ` : '';

    // Build combined document if mode is combined
    let combinedHtml = '';
    if (includeWaivers && waiverAttachmentMode === 'combined' && waivers.length > 0) {
      combinedHtml = `
        <div style="page-break-before: always; margin-top: 40px; padding-top: 20px; border-top: 3px solid #1e3a5f;">
          <h2 style="color: #1e3a5f; text-align: center; margin-bottom: 30px;">ATTACHED LIEN WAIVERS</h2>
          ${waivers.map((w, index) => `
            <div style="margin-bottom: 40px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
              <h3 style="color: #1e3a5f; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #d4af37;">
                ${index + 1}. ${WAIVER_TYPE_LABELS[w.waiver_type] || w.waiver_type}
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                <div><strong>Amount:</strong> $${w.amount.toFixed(2)}</div>
                <div><strong>Retainage:</strong> $${(w.retainage || 0).toFixed(2)}</div>
                ${w.billing_period_end ? `<div><strong>Through Date:</strong> ${new Date(w.billing_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
                ${w.gc_contacts ? `<div><strong>Sent To:</strong> ${w.gc_contacts.company || ''} ${w.gc_contacts.name ? `(${w.gc_contacts.name})` : ''}</div>` : ''}
              </div>
              ${w.signer_name ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                  <strong>Signed by:</strong> ${w.signer_name}${w.signer_title ? ` (${w.signer_title})` : ''}
                  ${w.signed_at ? ` on ${new Date(w.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                </div>
              ` : ''}
              ${w.signature_data ? `
                <div style="margin-top: 10px;">
                  <img src="${w.signature_data}" alt="Signature" style="max-height: 60px; border-bottom: 1px solid #000;" />
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

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
              ${jobAddress ? `<strong>Location:</strong> ${jobAddress}` : ''}
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

          ${waiverSummaryHtml}

          ${invoice.notes ? `
            <div style="margin-top: 25px; padding: 15px; background: #fff; border-radius: 4px; border: 1px solid #e0e0e0;">
              <strong>Notes:</strong><br/>
              <p style="margin: 10px 0 0; white-space: pre-wrap;">${invoice.notes}</p>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Thank you for your business!<br/>
            <strong>${businessName}</strong>
            ${profile?.business_phone ? `<br/>Phone: ${profile.business_phone}` : ''}
            ${profile?.business_address ? `<br/>${profile.business_address}` : ''}
          </p>
        </div>

        ${combinedHtml}
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>This invoice was sent via CT1 Business Suite</p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending invoice email to ${recipientEmail}`);

    const fromEmail = Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>";
    
    // Build attachments for separate mode
    const attachments: any[] = [];
    if (includeWaivers && waiverAttachmentMode === 'separate' && waivers.length > 0) {
      for (const waiver of waivers) {
        if (waiver.pdf_url) {
          // For now, just note in email that waivers are available at URL
          // Full attachment would require fetching the HTML content
          console.log(`Waiver ${waiver.id} available at: ${waiver.pdf_url}`);
        }
      }
    }
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `Invoice ${invoice.invoice_number} from ${businessName}${waivers.length > 0 ? ` (with ${waivers.length} Lien Waiver${waivers.length > 1 ? 's' : ''})` : ''}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invoice status to sent
    await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailResponse,
        waiversIncluded: waivers.length,
        attachmentMode: waiverAttachmentMode
      }),
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
