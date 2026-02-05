import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail?: string;
  recipientEmails?: string[];
  recipientName?: string;
  includeWaivers?: boolean;
  waiverAttachmentMode?: 'combined' | 'separate';
}

const WAIVER_TYPE_LABELS: Record<string, string> = {
  conditional_progress: 'Conditional Waiver - Progress Payment',
  unconditional_progress: 'Unconditional Waiver - Progress Payment',
  conditional_final: 'Conditional Waiver - Final Payment',
  unconditional_final: 'Unconditional Waiver - Final Payment',
};

async function fetchWaiverHtmlContent(pdfUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.error(`Failed to fetch waiver from ${pdfUrl}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching waiver HTML:`, error);
    return null;
  }
}

function extractWaiverBodyContent(html: string): string {
  // Extract just the body content for inline display
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  return html;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invoice-email function called");

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
      recipientEmails,
      recipientName,
      includeWaivers = false,
      waiverAttachmentMode = 'combined'
    }: SendInvoiceRequest = await req.json();

    const emails: string[] = recipientEmails || (recipientEmail ? [recipientEmail] : []);

    if (!invoiceId || emails.length === 0) {
      console.error("Missing required fields: invoiceId or recipientEmails");
      return new Response(
        JSON.stringify({ error: "Missing required fields: invoiceId, recipientEmails" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching invoice ${invoiceId}, will send to: ${emails.join(', ')}`);

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

    // Fetch waivers if requested
    let waivers: any[] = [];
    let waiverHtmlContents: { waiver: any; html: string }[] = [];
    
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

      // Fetch HTML content for each waiver
      for (const waiver of waivers) {
        if (waiver.pdf_url) {
          const htmlContent = await fetchWaiverHtmlContent(waiver.pdf_url);
          if (htmlContent) {
            waiverHtmlContents.push({ waiver, html: htmlContent });
          }
        }
      }
      console.log(`Fetched HTML content for ${waiverHtmlContents.length} waivers`);
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
        <p style="margin: 10px 0 0; font-size: 12px; color: #166534;">
          ${waiverAttachmentMode === 'combined' 
            ? 'Waivers are displayed below and attached as files.'
            : 'Each waiver is attached as a separate file.'}
        </p>
      </div>
    ` : '';

    // Build inline waiver display for the email body (viewable in email)
    let inlineWaiversHtml = '';
    if (includeWaivers && waiverHtmlContents.length > 0) {
      inlineWaiversHtml = `
        <div style="margin-top: 40px; padding-top: 30px; border-top: 3px solid #1e3a5f;">
          <h2 style="color: #1e3a5f; text-align: center; margin-bottom: 30px; font-size: 20px;">
            📄 LIEN WAIVERS
          </h2>
          ${waiverHtmlContents.map(({ waiver, html }, index) => {
            const bodyContent = extractWaiverBodyContent(html);
            return `
              <div style="margin-bottom: 40px; padding: 25px; border: 2px solid #1e3a5f; border-radius: 8px; background: #fafafa;">
                <div style="background: #1e3a5f; color: white; padding: 12px 20px; margin: -25px -25px 20px -25px; border-radius: 6px 6px 0 0;">
                  <strong style="font-size: 14px;">Waiver ${index + 1}: ${WAIVER_TYPE_LABELS[waiver.waiver_type] || waiver.waiver_type}</strong>
                </div>
                <div style="font-size: 12px; margin-bottom: 15px; padding: 10px; background: #fff; border-radius: 4px; border: 1px solid #e0e0e0;">
                  <table style="width: 100%; font-size: 12px;">
                    <tr>
                      <td style="padding: 4px 8px;"><strong>Amount:</strong></td>
                      <td style="padding: 4px 8px;">$${waiver.amount.toFixed(2)}</td>
                      <td style="padding: 4px 8px;"><strong>Retainage:</strong></td>
                      <td style="padding: 4px 8px;">$${(waiver.retainage || 0).toFixed(2)}</td>
                    </tr>
                    ${waiver.billing_period_end ? `
                    <tr>
                      <td style="padding: 4px 8px;"><strong>Through Date:</strong></td>
                      <td colspan="3" style="padding: 4px 8px;">${new Date(waiver.billing_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    ` : ''}
                    ${waiver.gc_contacts ? `
                    <tr>
                      <td style="padding: 4px 8px;"><strong>Sent To:</strong></td>
                      <td colspan="3" style="padding: 4px 8px;">${waiver.gc_contacts.company || ''} ${waiver.gc_contacts.name ? `(${waiver.gc_contacts.name})` : ''}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                ${waiver.signer_name ? `
                  <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px; border: 1px solid #a5d6a7;">
                    <strong style="color: #2e7d32;">✓ Signed by:</strong> ${waiver.signer_name}${waiver.signer_title ? ` (${waiver.signer_title})` : ''}
                    ${waiver.signed_at ? ` on ${new Date(waiver.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                  </div>
                ` : ''}
                ${waiver.signature_data ? `
                  <div style="margin-top: 10px; text-align: center;">
                    <img src="${waiver.signature_data}" alt="Signature" style="max-height: 60px; border-bottom: 1px solid #000;" />
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
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

        ${inlineWaiversHtml}
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>This invoice was sent via CT1 Business Suite</p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending invoice email to ${emails.join(', ')}`);

    const fromEmail = Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>";
    
    // Build PDF attachments for waivers
    const attachments: { filename: string; content: string }[] = [];
    
    if (includeWaivers && waiverHtmlContents.length > 0) {
      for (const { waiver, html } of waiverHtmlContents) {
        const waiverTypeLabel = WAIVER_TYPE_LABELS[waiver.waiver_type] || waiver.waiver_type;
        const safeLabel = waiverTypeLabel.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Lien_Waiver_${safeLabel}_${invoice.invoice_number || 'INV'}.html`;
        
        // Encode HTML as base64 for attachment
        const base64Content = btoa(unescape(encodeURIComponent(html)));
        
        attachments.push({
          filename,
          content: base64Content,
        });
        
        console.log(`Added attachment: ${filename}`);
      }
    }
    
    // Prepare email options
    const emailOptions: any = {
      from: fromEmail,
      to: emails,
      subject: `Invoice ${invoice.invoice_number} from ${businessName}${waivers.length > 0 ? ` (with ${waivers.length} Lien Waiver${waivers.length > 1 ? 's' : ''})` : ''}`,
      html: emailHtml,
    };

    // Add attachments if we have any
    if (attachments.length > 0) {
      emailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        content_type: 'text/html',
      }));
      console.log(`Sending email with ${attachments.length} attachments`);
    }

    const emailResponse = await resend.emails.send(emailOptions);

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
        attachmentsCount: attachments.length,
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
