import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePDFRequest {
  estimateId: string;
  includePaymentLink?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { estimateId, includePaymentLink = true }: GeneratePDFRequest = await req.json();

    // Fetch estimate details
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      throw new Error('Estimate not found');
    }

    const lineItems = estimate.line_items || [];
    const costSummary = estimate.cost_summary || {};
    const appUrl = Deno.env.get('APP_URL') || 'https://yourapp.lovable.app';
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            color: #1f2937;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #E02424;
          }
          .company-info { flex: 1; }
          .company-name { 
            font-size: 28px; 
            font-weight: 900; 
            color: #E02424;
            margin-bottom: 8px;
          }
          .company-tagline { 
            font-size: 14px; 
            color: #6B7280;
            margin-bottom: 20px;
          }
          .estimate-info { 
            text-align: right;
            background: #F9FAFB;
            padding: 20px;
            border-radius: 8px;
          }
          .estimate-title {
            font-size: 32px;
            font-weight: 900;
            color: #E02424;
            margin-bottom: 10px;
          }
          .estimate-number {
            font-size: 18px;
            color: #6B7280;
            margin-bottom: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: ${estimate.status === 'sent' || estimate.status === 'viewed' ? '#FEF3C7' : '#DBEAFE'};
            color: ${estimate.status === 'sent' || estimate.status === 'viewed' ? '#92400E' : '#1E40AF'};
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
          }
          .client-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .info-box {
            background: #F9FAFB;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #E02424;
          }
          .info-box h3 {
            font-size: 14px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          .info-box p {
            font-size: 16px;
            color: #1f2937;
            line-height: 1.6;
            margin-bottom: 6px;
          }
          .info-box .highlight {
            font-weight: 700;
            font-size: 18px;
          }
          .project-description {
            background: #FEF3F2;
            border-left: 4px solid #E02424;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
          }
          .project-description h3 {
            font-size: 16px;
            font-weight: 700;
            color: #E02424;
            margin-bottom: 10px;
          }
          .project-description p {
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
          }
          thead {
            background: #1f2937;
            color: white;
          }
          th {
            padding: 16px;
            text-align: left;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 14px;
          }
          tbody tr:nth-child(even) {
            background: #F9FAFB;
          }
          .category-badge {
            display: inline-block;
            padding: 4px 10px;
            background: #DBEAFE;
            color: #1E40AF;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          }
          .item-desc {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .item-details {
            font-size: 12px;
            color: #6B7280;
          }
          .totals-section {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-box {
            width: 400px;
            background: white;
            border: 2px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 14px 20px;
            border-bottom: 1px solid #E5E7EB;
          }
          .total-row:last-child {
            border-bottom: none;
          }
          .total-row.grand-total {
            background: linear-gradient(135deg, #E02424 0%, #C01E1E 100%);
            color: white;
            padding: 20px;
          }
          .total-row.grand-total .label {
            font-size: 20px;
            font-weight: 900;
          }
          .total-row.grand-total .amount {
            font-size: 28px;
            font-weight: 900;
          }
          .total-row .label {
            font-size: 15px;
            color: #6B7280;
            font-weight: 500;
          }
          .total-row .amount {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }
          .payment-section {
            margin-top: 40px;
            background: linear-gradient(135deg, #FEF3F2 0%, #FEE2E2 100%);
            border: 2px solid #E02424;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
          }
          .payment-section h3 {
            font-size: 24px;
            font-weight: 900;
            color: #E02424;
            margin-bottom: 15px;
          }
          .payment-section p {
            font-size: 16px;
            color: #374151;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .payment-link {
            display: inline-block;
            background: #E02424;
            color: white;
            padding: 16px 40px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(224, 36, 36, 0.3);
          }
          .payment-url {
            margin-top: 15px;
            font-size: 12px;
            color: #6B7280;
            word-break: break-all;
          }
          .notes-section {
            margin-top: 30px;
            background: #FFFBEB;
            border-left: 4px solid #F59E0B;
            padding: 20px;
            border-radius: 0 8px 8px 0;
          }
          .notes-section h3 {
            font-size: 16px;
            font-weight: 700;
            color: #92400E;
            margin-bottom: 10px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
          }
          .footer-text {
            font-size: 12px;
            color: #9CA3AF;
            line-height: 1.8;
          }
          .powered-by {
            font-size: 14px;
            color: #6B7280;
            margin-top: 15px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-name">CT1 Constructeam</div>
            <div class="company-tagline">Professional Contractor Management</div>
          </div>
          <div class="estimate-info">
            <div class="estimate-title">ESTIMATE</div>
            ${estimate.estimate_number ? `<div class="estimate-number">#${estimate.estimate_number}</div>` : ''}
            <span class="status-badge">${estimate.status === 'draft' ? 'Draft' : estimate.status === 'sent' ? 'Sent' : estimate.status === 'viewed' ? 'Viewed' : 'Pending'}</span>
            <p style="margin-top: 15px; font-size: 13px; color: #6B7280;">
              <strong>Issue Date:</strong> ${new Date(estimate.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            ${estimate.valid_until ? `<p style="font-size: 13px; color: #6B7280;"><strong>Valid Until:</strong> ${new Date(estimate.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
          </div>
        </div>

        <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 20px; color: #1f2937;">${estimate.title}</h2>

        <div class="client-section">
          <div class="info-box">
            <h3>Prepared For:</h3>
            <p class="highlight">${estimate.client_name}</p>
            ${estimate.client_email ? `<p>📧 ${estimate.client_email}</p>` : ''}
            ${estimate.client_address ? `<p>📍 ${estimate.client_address}</p>` : ''}
          </div>
          
          ${estimate.site_address ? `
          <div class="info-box">
            <h3>Project Location:</h3>
            <p class="highlight">${estimate.site_address}</p>
            ${estimate.trade_type ? `<p><strong>Trade:</strong> ${estimate.trade_type}</p>` : ''}
          </div>
          ` : `
          <div class="info-box">
            <h3>Project Details:</h3>
            ${estimate.trade_type ? `<p><strong>Trade Type:</strong> ${estimate.trade_type}</p>` : ''}
          </div>
          `}
        </div>

        ${estimate.project_description ? `
        <div class="project-description">
          <h3>Project Description</h3>
          <p>${estimate.project_description}</p>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems
              .filter((item: any) => item.included)
              .map((item: any) => `
                <tr>
                  <td>
                    <div class="item-desc">${item.item_description}</div>
                    <div class="item-details">${item.quantity} ${item.unit_type} × $${item.unit_cost.toFixed(2)}</div>
                    <span class="category-badge">${item.category}</span>
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right; font-weight: 700;">$${item.line_total.toFixed(2)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            ${costSummary.subtotal ? `
            <div class="total-row">
              <span class="label">Subtotal</span>
              <span class="amount">$${costSummary.subtotal.toFixed(2)}</span>
            </div>
            ` : ''}
            ${costSummary.profit_markup_percentage && costSummary.profit_markup_percentage > 0 ? `
            <div class="total-row">
              <span class="label">Profit/Markup (${costSummary.profit_markup_percentage}%)</span>
              <span class="amount">$${costSummary.profit_markup_amount?.toFixed(2) || '0.00'}</span>
            </div>
            ` : ''}
            ${costSummary.tax_and_fees && costSummary.tax_and_fees > 0 ? `
            <div class="total-row">
              <span class="label">Tax & Fees</span>
              <span class="amount">$${costSummary.tax_and_fees.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span class="label">Total</span>
              <span class="amount">$${estimate.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        ${includePaymentLink ? `
        <div class="payment-section">
          <h3>Ready to Get Started?</h3>
          <p>Click the link below to review this estimate online, sign digitally, and proceed with payment to secure your project.</p>
          <a href="${publicUrl}" class="payment-link">View & Accept Estimate</a>
          <p class="payment-url">Or copy this link: ${publicUrl}</p>
        </div>
        ` : ''}

        ${estimate.assumptions_and_exclusions ? `
        <div class="notes-section">
          <h3>Assumptions & Exclusions</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #374151;">${estimate.assumptions_and_exclusions}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p class="footer-text">
            This estimate is valid for the period specified above. All pricing and terms are subject to the conditions outlined.<br>
            Thank you for considering us for your project!
          </p>
          <p class="powered-by">Powered by CT1 Constructeam - Professional Contractor Management</p>
        </div>
      </body>
      </html>
    `;

    // Use Puppeteer or similar to convert HTML to PDF
    // For now, return HTML that can be converted client-side or use a PDF service
    // Using Deno's built-in fetch to call a HTML-to-PDF service
    
    // For production, you'd want to use a proper PDF generation service
    // For now, we'll return the HTML and let the client handle PDF conversion
    // Or use a service like pdf.co or similar

    // Simple approach: Return base64 encoded HTML for now
    // Client will need to handle PDF conversion
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlContent);
    const base64Html = btoa(String.fromCharCode(...htmlBytes));

    return new Response(JSON.stringify({
      success: true,
      html: htmlContent,
      base64Html,
      estimate: {
        number: estimate.estimate_number,
        title: estimate.title,
        client_name: estimate.client_name,
        total_amount: estimate.total_amount,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
