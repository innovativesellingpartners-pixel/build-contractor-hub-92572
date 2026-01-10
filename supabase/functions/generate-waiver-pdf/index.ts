import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaiverRequest {
  invoiceId: string;
  waiverType: 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final';
  gcId: string;
  amount: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  retainage?: number;
  signatureData?: string;
  signerName?: string;
  signerTitle?: string;
}

const WAIVER_TEMPLATES = {
  conditional_progress: {
    title: 'CONDITIONAL WAIVER AND RELEASE ON PROGRESS PAYMENT',
    body: `Upon receipt by the undersigned of a check from {{gc_name}} in the sum of {{amount}} payable to {{contractor_name}}, and when the check has been properly endorsed and has been paid by the bank upon which it is drawn, this document becomes effective to release and waive any mechanics lien, stop payment notice, or bond right the undersigned has for labor, services, equipment, or materials furnished to {{project_name}} through {{billing_period_end}} only.

This waiver does not apply to retention, pending contract modifications, or items furnished after the through date above.`,
  },
  unconditional_progress: {
    title: 'UNCONDITIONAL WAIVER AND RELEASE ON PROGRESS PAYMENT',
    body: `The undersigned has been paid and has received a progress payment in the sum of {{amount}} for labor, services, equipment, or materials furnished to {{project_name}} through {{billing_period_end}}. This document waives and releases any mechanics lien, stop payment notice, or bond right the undersigned has for work furnished through this date.

This waiver does not apply to retention or pending contract modifications.`,
  },
  conditional_final: {
    title: 'CONDITIONAL WAIVER AND RELEASE ON FINAL PAYMENT',
    body: `Upon receipt by the undersigned of a check from {{gc_name}} in the amount of {{amount}} payable to {{contractor_name}}, and when the check has been properly endorsed and paid by the bank on which it is drawn, this document becomes effective to release and waive any mechanics lien, stop payment notice, or bond right the undersigned has for all labor, services, equipment, or materials furnished to {{project_name}}.

This waiver covers the final payment only and becomes effective upon actual clearance of funds.`,
  },
  unconditional_final: {
    title: 'UNCONDITIONAL WAIVER AND RELEASE ON FINAL PAYMENT',
    body: `The undersigned has been paid in full for all labor, services, equipment, or materials furnished to {{project_name}}. This document unconditionally waives and releases all mechanics lien, stop payment notice, and bond rights for this project.`,
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

function generateWaiverHtml(
  waiverType: string,
  vars: Record<string, string>,
  contractorName: string,
  contractorAddress: string,
  invoiceData: any,
  signatureData?: string,
  signerName?: string,
  signerTitle?: string
): string {
  const template = WAIVER_TEMPLATES[waiverType as keyof typeof WAIVER_TEMPLATES];
  if (!template) throw new Error(`Unknown waiver type: ${waiverType}`);

  const body = replaceTemplateVars(template.body, vars);
  const lineItems = (invoiceData.line_items as any[]) || [];
  
  const lineItemsHtml = lineItems.length > 0 
    ? lineItems.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 11pt;">${item.description || item.name || 'Item'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; font-size: 11pt;">${item.quantity || 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 11pt;">$${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</td>
        </tr>
      `).join('')
    : '';

  const signatureSection = signatureData 
    ? `<div class="signature-block">
        <img src="${signatureData}" alt="Signature" style="max-height: 60px; border-bottom: 1px solid #000; padding-bottom: 5px;" />
        <div class="signature-label">Signature</div>
      </div>`
    : `<div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Signature</div>
      </div>`;

  const signerNameSection = signerName
    ? `<div class="signature-block">
        <div style="border-bottom: 1px solid #000; padding: 5px 0; min-width: 300px;">${signerName}</div>
        <div class="signature-label">Printed Name</div>
      </div>`
    : `<div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Printed Name</div>
      </div>`;

  const signerTitleSection = signerTitle
    ? `<div class="signature-block">
        <div style="border-bottom: 1px solid #000; padding: 5px 0; min-width: 300px;">${signerTitle}</div>
        <div class="signature-label">Title</div>
      </div>`
    : `<div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Title</div>
      </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${template.title}</title>
  <style>
    @page { margin: 0.75in; size: letter; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e3a5f;
    }
    .title {
      font-size: 16pt;
      font-weight: bold;
      color: #1e3a5f;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .body-text {
      text-align: justify;
      margin-bottom: 30px;
      white-space: pre-wrap;
    }
    .info-section {
      margin: 25px 0;
      padding: 15px;
      background: #f5f5f5;
      border-left: 4px solid #d4af37;
    }
    .info-row {
      margin: 8px 0;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      min-width: 180px;
    }
    .invoice-details {
      margin: 25px 0;
      padding: 20px;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    .invoice-details h3 {
      margin: 0 0 15px 0;
      font-size: 14pt;
      color: #1e3a5f;
      border-bottom: 2px solid #d4af37;
      padding-bottom: 8px;
    }
    .invoice-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    .invoice-item {
      font-size: 11pt;
    }
    .invoice-item .label {
      color: #666;
      font-size: 10pt;
    }
    .invoice-item .value {
      font-weight: bold;
    }
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .line-items-table th {
      background: #1e3a5f;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11pt;
    }
    .line-items-table th:nth-child(2),
    .line-items-table th:nth-child(3) {
      text-align: center;
    }
    .line-items-table th:last-child {
      text-align: right;
    }
    .totals-section {
      margin-top: 15px;
      text-align: right;
      padding-top: 10px;
      border-top: 2px solid #1e3a5f;
    }
    .total-row {
      font-size: 12pt;
      margin: 5px 0;
    }
    .total-row.grand {
      font-size: 14pt;
      font-weight: bold;
      color: #1e3a5f;
    }
    .signature-section {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-block {
      margin-top: 30px;
    }
    .signature-line {
      border-bottom: 1px solid #000;
      width: 300px;
      margin: 40px 0 5px 0;
    }
    .signature-label {
      font-size: 10pt;
      color: #666;
    }
    .contractor-info {
      margin-bottom: 20px;
      font-weight: bold;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 10pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${template.title}</div>
  </div>

  <div class="body-text">${body}</div>

  <div class="info-section">
    <div class="info-row"><span class="info-label">Date:</span> ${vars.date}</div>
    <div class="info-row"><span class="info-label">Project:</span> ${vars.project_name}</div>
    <div class="info-row"><span class="info-label">Project Address:</span> ${vars.project_address}</div>
    <div class="info-row"><span class="info-label">Invoice/Application Number:</span> ${vars.invoice_number}</div>
    ${vars.retainage && vars.retainage !== '$0.00' ? `<div class="info-row"><span class="info-label">Retainage:</span> ${vars.retainage}</div>` : ''}
  </div>

  <div class="invoice-details">
    <h3>Invoice Details</h3>
    <div class="invoice-grid">
      <div class="invoice-item">
        <div class="label">Issue Date</div>
        <div class="value">${vars.issue_date}</div>
      </div>
      <div class="invoice-item">
        <div class="label">Due Date</div>
        <div class="value">${vars.due_date}</div>
      </div>
      <div class="invoice-item">
        <div class="label">Invoice Amount</div>
        <div class="value">${vars.invoice_amount}</div>
      </div>
      <div class="invoice-item">
        <div class="label">Amount Paid</div>
        <div class="value">${vars.amount_paid}</div>
      </div>
      <div class="invoice-item">
        <div class="label">Balance Due</div>
        <div class="value" style="color: ${parseFloat(vars.balance_due?.replace(/[^0-9.-]/g, '') || '0') > 0 ? '#c00' : '#060'}">${vars.balance_due}</div>
      </div>
      <div class="invoice-item">
        <div class="label">Waiver Amount</div>
        <div class="value" style="color: #1e3a5f;">${vars.amount}</div>
      </div>
    </div>
    
    ${lineItemsHtml ? `
    <table class="line-items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>
    <div class="totals-section">
      <div class="total-row">Subtotal: ${vars.invoice_amount}</div>
      <div class="total-row grand">Total: ${vars.invoice_amount}</div>
    </div>
    ` : ''}
  </div>

  <div class="signature-section">
    <div class="contractor-info">
      Contractor:<br/>
      ${contractorName}<br/>
      ${contractorAddress}
    </div>
    
    ${signatureSection}
    ${signerNameSection}
    ${signerTitleSection}

    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Date</div>
    </div>
  </div>

  <div class="footer">
    This lien waiver was generated via CT1 Business Suite
  </div>
</body>
</html>
`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("generate-waiver-pdf function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      invoiceId, 
      waiverType, 
      gcId, 
      amount, 
      billingPeriodStart, 
      billingPeriodEnd, 
      retainage,
      signatureData,
      signerName,
      signerTitle
    }: WaiverRequest = await req.json();

    console.log(`Generating ${waiverType} waiver for invoice ${invoiceId}`);

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

    // Fetch GC contact
    const { data: gcContact } = await supabase
      .from("gc_contacts")
      .select("*")
      .eq("id", gcId)
      .single();

    // Fetch contractor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, business_address, business_phone, business_email")
      .eq("id", invoice.user_id)
      .single();

    const contractorName = profile?.business_name || "Contractor";
    const contractorAddress = profile?.business_address || "";
    const gcName = gcContact?.company || gcContact?.name || "General Contractor";
    
    const jobAddress = invoice.jobs 
      ? `${invoice.jobs.address || ''}${invoice.jobs.city ? ', ' + invoice.jobs.city : ''}${invoice.jobs.state ? ', ' + invoice.jobs.state : ''} ${invoice.jobs.zip_code || ''}`.trim()
      : "";

    // Build template variables with full invoice data
    const templateVars: Record<string, string> = {
      contractor_name: contractorName,
      contractor_address: contractorAddress,
      gc_name: gcName,
      project_name: invoice.jobs?.name || "Project",
      project_address: jobAddress,
      amount: formatCurrency(amount),
      retainage: formatCurrency(retainage || 0),
      billing_period_start: formatDate(billingPeriodStart),
      billing_period_end: formatDate(billingPeriodEnd),
      invoice_number: invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`,
      date: formatDate(),
      // New invoice-specific fields
      issue_date: formatDate(invoice.issue_date),
      due_date: invoice.due_date ? formatDate(invoice.due_date) : 'Due upon receipt',
      invoice_amount: formatCurrency(invoice.amount_due || 0),
      amount_paid: formatCurrency(invoice.amount_paid || 0),
      balance_due: formatCurrency((invoice.amount_due || 0) - (invoice.amount_paid || 0)),
    };

    // Generate HTML with full invoice data
    const html = generateWaiverHtml(
      waiverType, 
      templateVars, 
      contractorName, 
      contractorAddress,
      invoice,
      signatureData,
      signerName,
      signerTitle
    );

    // Store the HTML file
    const fileName = `waiver_${waiverType}_${invoice.invoice_number || invoice.id.slice(0, 8)}_${Date.now()}.html`;
    const filePath = `waivers/${user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload waiver:", uploadError);
    }

    // Get public URL if upload succeeded
    let pdfUrl = "";
    if (uploadData) {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      pdfUrl = urlData?.publicUrl || "";
    }

    // Create waiver record with signature data
    const { data: waiver, error: waiverError } = await supabase
      .from("invoice_waivers")
      .insert({
        invoice_id: invoiceId,
        gc_id: gcId,
        waiver_type: waiverType,
        amount: amount,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        retainage: retainage || 0,
        pdf_url: pdfUrl,
        created_by: user.id,
        signature_data: signatureData || null,
        signer_name: signerName || null,
        signer_title: signerTitle || null,
        signed_at: signatureData ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (waiverError) {
      console.error("Failed to create waiver record:", waiverError);
      return new Response(
        JSON.stringify({ error: "Failed to create waiver record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Waiver created successfully: ${waiver.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        waiver: {
          ...waiver,
          html: html,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-waiver-pdf:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
