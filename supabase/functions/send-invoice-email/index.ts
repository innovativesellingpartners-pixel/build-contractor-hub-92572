import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

function formatCurrency(v: number | null | undefined) {
  const n = Number(v || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });
}

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
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  return html;
}

// Generate a simple invoice PDF inline
async function generateInvoicePdfBytes(invoice: any, profile: any, customer: any, job: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height, width } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryNavy = rgb(0.086, 0.118, 0.173);
  const accentGold = rgb(0.835, 0.624, 0.278);
  const darkText = rgb(0.133, 0.133, 0.133);
  const mediumText = rgb(0.4, 0.4, 0.4);
  const white = rgb(1, 1, 1);

  const margin = 50;
  let cursorY = height - margin;

  const companyName = profile?.business_name || profile?.company_name || "Contractor";

  // Header
  const headerHeight = 80;
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: width,
    height: headerHeight,
    color: primaryNavy,
  });

  page.drawText(companyName.toUpperCase(), {
    x: margin,
    y: height - 35,
    size: 18,
    font: fontBold,
    color: white,
  });

  if (profile?.business_phone || profile?.business_email) {
    const contactLine = [profile.business_phone, profile.business_email].filter(Boolean).join("  •  ");
    page.drawText(contactLine, {
      x: margin,
      y: height - 55,
      size: 9,
      font: fontReg,
      color: rgb(0.85, 0.85, 0.85),
    });
  }

  // Invoice badge
  page.drawRectangle({
    x: width - margin - 100,
    y: height - 50,
    width: 100,
    height: 28,
    color: accentGold,
  });
  page.drawText("INVOICE", {
    x: width - margin - 78,
    y: height - 42,
    size: 12,
    font: fontBold,
    color: primaryNavy,
  });

  cursorY = height - headerHeight - 30;

  // Invoice info
  page.drawText(`Invoice #: ${invoice.invoice_number || 'N/A'}`, {
    x: margin,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: darkText,
  });
  cursorY -= 18;

  page.drawText(`Issue Date: ${formatDate(invoice.issue_date)}`, {
    x: margin,
    y: cursorY,
    size: 10,
    font: fontReg,
    color: mediumText,
  });
  cursorY -= 16;

  page.drawText(`Due Date: ${formatDate(invoice.due_date) || 'Due upon receipt'}`, {
    x: margin,
    y: cursorY,
    size: 10,
    font: fontReg,
    color: mediumText,
  });
  cursorY -= 16;

  page.drawText(`Status: ${(invoice.status || 'draft').toUpperCase()}`, {
    x: margin,
    y: cursorY,
    size: 10,
    font: fontReg,
    color: mediumText,
  });
  cursorY -= 30;

  // Bill To
  if (customer) {
    page.drawText("BILL TO:", { x: margin, y: cursorY, size: 9, font: fontBold, color: accentGold });
    cursorY -= 16;
    if (customer.name) {
      page.drawText(customer.name, { x: margin, y: cursorY, size: 11, font: fontBold, color: darkText });
      cursorY -= 14;
    }
    if (customer.company) {
      page.drawText(customer.company, { x: margin, y: cursorY, size: 9, font: fontReg, color: mediumText });
      cursorY -= 14;
    }
    if (customer.email) {
      page.drawText(customer.email, { x: margin, y: cursorY, size: 9, font: fontReg, color: mediumText });
      cursorY -= 14;
    }
    cursorY -= 10;
  }

  // Job details
  if (job) {
    page.drawText("JOB:", { x: margin, y: cursorY, size: 9, font: fontBold, color: accentGold });
    cursorY -= 16;
    if (job.name) {
      page.drawText(job.name.substring(0, 50), { x: margin, y: cursorY, size: 10, font: fontBold, color: darkText });
      cursorY -= 14;
    }
    if (job.job_number) {
      page.drawText(`Job #${job.job_number}`, { x: margin, y: cursorY, size: 9, font: fontReg, color: mediumText });
      cursorY -= 14;
    }
    cursorY -= 10;
  }

  // Line items
  const lineItems = (invoice.line_items as any[]) || [];
  if (lineItems.length > 0) {
    page.drawText("LINE ITEMS", { x: margin, y: cursorY, size: 10, font: fontBold, color: primaryNavy });
    cursorY -= 20;

    // Header row
    page.drawText("Description", { x: margin, y: cursorY, size: 8, font: fontBold, color: darkText });
    page.drawText("Qty", { x: 350, y: cursorY, size: 8, font: fontBold, color: darkText });
    page.drawText("Rate", { x: 400, y: cursorY, size: 8, font: fontBold, color: darkText });
    page.drawText("Amount", { x: 480, y: cursorY, size: 8, font: fontBold, color: darkText });
    cursorY -= 16;

    for (const item of lineItems) {
      const desc = String(item.description || item.name || "Item").substring(0, 40);
      const qty = String(item.quantity || 1);
      const rate = formatCurrency(item.unit_price || 0);
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);

      page.drawText(desc, { x: margin, y: cursorY, size: 9, font: fontReg, color: darkText });
      page.drawText(qty, { x: 350, y: cursorY, size: 9, font: fontReg, color: darkText });
      page.drawText(rate, { x: 400, y: cursorY, size: 9, font: fontReg, color: darkText });
      page.drawText(formatCurrency(lineTotal), { x: 480, y: cursorY, size: 9, font: fontBold, color: darkText });
      cursorY -= 18;

      if (cursorY < 150) break;
    }
    cursorY -= 10;
  }

  // Totals
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: primaryNavy,
  });
  cursorY -= 25;

  page.drawText("Amount Due:", { x: 380, y: cursorY, size: 10, font: fontReg, color: mediumText });
  page.drawText(formatCurrency(invoice.amount_due), { x: 480, y: cursorY, size: 12, font: fontBold, color: primaryNavy });
  cursorY -= 18;

  if (invoice.amount_paid > 0) {
    page.drawText("Amount Paid:", { x: 380, y: cursorY, size: 10, font: fontReg, color: mediumText });
    page.drawText(formatCurrency(invoice.amount_paid), { x: 480, y: cursorY, size: 10, font: fontReg, color: darkText });
    cursorY -= 18;

    const balance = (invoice.amount_due || 0) - (invoice.amount_paid || 0);
    page.drawText("Balance Due:", { x: 380, y: cursorY, size: 10, font: fontBold, color: primaryNavy });
    page.drawText(formatCurrency(balance), { x: 480, y: cursorY, size: 12, font: fontBold, color: accentGold });
  }

  // Footer
  page.drawText("Generated via CT1 Business Suite", {
    x: margin,
    y: 40,
    size: 8,
    font: fontReg,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await pdfDoc.save();
}

// Generate waiver PDF from HTML content
async function generateWaiverPdfBytes(waiver: any, html: string, invoiceNumber: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height, width } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryNavy = rgb(0.086, 0.118, 0.173);
  const accentGold = rgb(0.835, 0.624, 0.278);
  const darkText = rgb(0.133, 0.133, 0.133);
  const mediumText = rgb(0.4, 0.4, 0.4);
  const white = rgb(1, 1, 1);

  const margin = 50;
  let cursorY = height - margin;

  const waiverTitle = WAIVER_TYPE_LABELS[waiver.waiver_type] || waiver.waiver_type;

  // Header
  const headerHeight = 60;
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: width,
    height: headerHeight,
    color: primaryNavy,
  });

  page.drawText("LIEN WAIVER", {
    x: margin,
    y: height - 35,
    size: 16,
    font: fontBold,
    color: white,
  });

  page.drawText(waiverTitle.toUpperCase(), {
    x: margin,
    y: height - 52,
    size: 10,
    font: fontReg,
    color: accentGold,
  });

  cursorY = height - headerHeight - 30;

  // Waiver details
  page.drawText(`Invoice: ${invoiceNumber}`, { x: margin, y: cursorY, size: 10, font: fontBold, color: darkText });
  cursorY -= 18;

  page.drawText(`Amount: ${formatCurrency(waiver.amount)}`, { x: margin, y: cursorY, size: 10, font: fontReg, color: mediumText });
  cursorY -= 16;

  if (waiver.retainage > 0) {
    page.drawText(`Retainage: ${formatCurrency(waiver.retainage)}`, { x: margin, y: cursorY, size: 10, font: fontReg, color: mediumText });
    cursorY -= 16;
  }

  if (waiver.billing_period_end) {
    page.drawText(`Through Date: ${formatDate(waiver.billing_period_end)}`, { x: margin, y: cursorY, size: 10, font: fontReg, color: mediumText });
    cursorY -= 16;
  }

  cursorY -= 20;

  // Extract and display text content from HTML (simplified extraction)
  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Word wrap the content
  const words = textContent.split(' ');
  let line = '';
  const maxWidth = width - margin * 2;
  const fontSize = 9;

  for (const word of words) {
    const testLine = line + word + ' ';
    const testWidth = fontReg.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && line !== '') {
      page.drawText(line.trim(), { x: margin, y: cursorY, size: fontSize, font: fontReg, color: darkText });
      cursorY -= 14;
      line = word + ' ';

      if (cursorY < 100) break;
    } else {
      line = testLine;
    }
  }
  
  if (line && cursorY >= 100) {
    page.drawText(line.trim(), { x: margin, y: cursorY, size: fontSize, font: fontReg, color: darkText });
    cursorY -= 20;
  }

  // Signature section
  if (waiver.signer_name) {
    cursorY -= 20;
    page.drawText("SIGNED BY:", { x: margin, y: cursorY, size: 9, font: fontBold, color: primaryNavy });
    cursorY -= 16;
    page.drawText(waiver.signer_name + (waiver.signer_title ? ` (${waiver.signer_title})` : ''), { 
      x: margin, y: cursorY, size: 10, font: fontReg, color: darkText 
    });
    cursorY -= 14;
    if (waiver.signed_at) {
      page.drawText(`Date: ${formatDate(waiver.signed_at)}`, { x: margin, y: cursorY, size: 9, font: fontReg, color: mediumText });
    }
  }

  // Footer
  page.drawText("Generated via CT1 Business Suite", {
    x: margin,
    y: 40,
    size: 8,
    font: fontReg,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await pdfDoc.save();
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

    // Fetch customer data
    let customer = null;
    if (invoice.customer_id) {
      const { data } = await supabase
        .from("customers")
        .select("name, email, phone, address, city, state, zip_code, company")
        .eq("id", invoice.customer_id)
        .single();
      customer = data;
    }

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, company_name, business_email, business_phone, business_address, logo_url")
      .eq("id", invoice.user_id)
      .single();

    const businessName = profile?.business_name || profile?.company_name || "CT1 Contractor";

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

    // Generate Invoice PDF
    console.log("Generating invoice PDF...");
    const invoicePdfBytes = await generateInvoicePdfBytes(invoice, profile, customer, invoice.jobs);
    const invoicePdfBase64 = btoa(String.fromCharCode(...invoicePdfBytes));
    console.log(`Invoice PDF generated: ${invoicePdfBytes.length} bytes`);

    // Generate Waiver PDFs
    const waiverPdfs: { waiver: any; pdfBase64: string; filename: string }[] = [];
    for (const { waiver, html } of waiverHtmlContents) {
      console.log(`Generating PDF for waiver ${waiver.id}...`);
      const waiverPdfBytes = await generateWaiverPdfBytes(waiver, html, invoice.invoice_number || 'INV');
      const waiverPdfBase64 = btoa(String.fromCharCode(...waiverPdfBytes));
      
      const waiverTypeLabel = WAIVER_TYPE_LABELS[waiver.waiver_type] || waiver.waiver_type;
      const safeLabel = waiverTypeLabel.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Lien_Waiver_${safeLabel}_${invoice.invoice_number || 'INV'}.pdf`;
      
      waiverPdfs.push({ waiver, pdfBase64: waiverPdfBase64, filename });
      console.log(`Waiver PDF generated: ${waiverPdfBytes.length} bytes`);
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
      : "<tr><td colspan='3' style='padding: 8px;'>See attached PDF for details</td></tr>";

    const dueDate = invoice.due_date 
      ? new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : "Due upon receipt";

    const jobAddress = invoice.jobs 
      ? `${invoice.jobs.address || ''}${invoice.jobs.city ? ', ' + invoice.jobs.city : ''}${invoice.jobs.state ? ', ' + invoice.jobs.state : ''} ${invoice.jobs.zip_code || ''}`.trim()
      : "";

    // Generate waiver summary for email body
    const waiverSummaryHtml = waivers.length > 0 ? `
      <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border-radius: 4px; border: 1px solid #86efac;">
        <strong style="color: #166534;">📎 Attached Documents:</strong>
        <ul style="margin: 10px 0 0; padding-left: 20px; color: #166534;">
          <li style="margin: 5px 0;">Invoice PDF - ${invoice.invoice_number}</li>
          ${waivers.map(w => `<li style="margin: 5px 0;">${WAIVER_TYPE_LABELS[w.waiver_type] || w.waiver_type} - $${w.amount.toFixed(2)}</li>`).join('')}
        </ul>
        <p style="margin: 10px 0 0; font-size: 12px; color: #166534;">
          All documents are attached as PDFs and displayed in full below.
        </p>
      </div>
    ` : `
      <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border-radius: 4px; border: 1px solid #86efac;">
        <strong style="color: #166534;">📎 Attached:</strong> Invoice PDF - ${invoice.invoice_number}
      </div>
    `;

    // Build inline waiver display for the email body - FULL waiver content embedded
    let inlineWaiversHtml = '';
    if (includeWaivers && waiverHtmlContents.length > 0) {
      inlineWaiversHtml = `
        <div style="margin-top: 40px; padding-top: 30px; border-top: 3px solid #1e3a5f;">
          <h2 style="color: #1e3a5f; text-align: center; margin-bottom: 30px; font-size: 20px;">
            📄 LIEN WAIVERS
          </h2>
          <p style="text-align: center; color: #666; margin-bottom: 30px; font-size: 14px;">
            The following lien waiver document(s) are included with this invoice. Full documents are also attached as PDFs.
          </p>
          ${waiverHtmlContents.map(({ waiver, html }, index) => {
            const bodyContent = extractWaiverBodyContent(html);
            return `
              <div style="margin-bottom: 50px; border: 2px solid #1e3a5f; border-radius: 8px; overflow: hidden; background: #fff;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 15px 25px;">
                  <strong style="font-size: 16px;">Waiver ${index + 1} of ${waiverHtmlContents.length}: ${WAIVER_TYPE_LABELS[waiver.waiver_type] || waiver.waiver_type}</strong>
                </div>
                
                <!-- Full Waiver Document Content -->
                <div style="padding: 30px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000;">
                  ${bodyContent}
                </div>
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
      <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #333;">
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
    
    // Build attachments array - Invoice PDF first, then waiver PDFs
    const attachments: any[] = [
      {
        filename: `Invoice_${invoice.invoice_number || 'INV'}.pdf`,
        content: invoicePdfBase64,
        content_type: 'application/pdf',
      }
    ];

    // Add waiver PDFs
    for (const { filename, pdfBase64 } of waiverPdfs) {
      attachments.push({
        filename,
        content: pdfBase64,
        content_type: 'application/pdf',
      });
    }

    console.log(`Sending email with ${attachments.length} PDF attachment(s)`);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: emails,
      subject: `Invoice ${invoice.invoice_number} from ${businessName}${waivers.length > 0 ? ` (with ${waivers.length} Lien Waiver${waivers.length > 1 ? 's' : ''})` : ''}`,
      html: emailHtml,
      attachments: attachments,
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
