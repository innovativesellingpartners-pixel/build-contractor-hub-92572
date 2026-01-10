import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEstimateRequest {
  estimateId: string;
  contractorName: string;
  contractorEmail: string;
}

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // SECURITY: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authentication header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { estimateId, contractorName, contractorEmail }: SendEstimateRequest = await req.json();

    // Fetch estimate details
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      throw new Error('Estimate not found');
    }

    // SECURITY: Verify ownership - user must own this estimate
    if (estimate.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You don't have access to this estimate" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!estimate.client_email) {
      console.error('Missing client email for estimate:', estimateId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Client email is required to send estimate. Please add the client\'s email address to the estimate first.' 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate public view URL
    const appUrl = Deno.env.get('APP_URL') || 'https://myct1.com';
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, logo_url, phone, business_address, city, state, zip_code, business_email, website_url, contact_name')
      .eq('id', estimate.user_id)
      .single();
    
    // Get the authenticated user's email address
    const { data: { user: estimateUser } } = await supabase.auth.admin.getUserById(estimate.user_id);
    const authenticatedUserEmail = estimateUser?.email || '';

    // Use contractor's branding - NO CT1 fallbacks
    const companyName = profile?.company_name || contractorName || 'Your Contractor';
    const logoSrc = profile?.logo_url || null; // No default logo - only use contractor's logo if available
    const companyPhone = profile?.phone || '';
    const companyAddress = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code].filter(Boolean).join(', ');
    const companyWebsite = profile?.website_url || '';
    const contactName = profile?.contact_name || '';
    
    // Use profile's business_email, or contractor's email from request, or authenticated user email
    const replyToEmail = profile?.business_email || contractorEmail || authenticatedUserEmail;
    console.log('Using reply-to email:', replyToEmail, 'Authenticated user email:', authenticatedUserEmail);

    // Send email to client
    const recipients = [estimate.client_email];
    const bcc: string[] | undefined = contractorEmail ? [contractorEmail] : undefined;

    // Log if using default resend.dev email
    if (FROM_EMAIL.endsWith('@resend.dev') || FROM_EMAIL === 'onboarding@resend.dev') {
      console.log('Note: Using Resend test domain. For custom branding, verify your domain at resend.com/domains');
    }

    const effectiveFromEmail = FROM_EMAIL;
    console.log('Attempting to send estimate email', { to: recipients, bcc, from: effectiveFromEmail, replyTo: replyToEmail });
    
    // Generate PDF and attach to email
    const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-estimate-pdf', {
      body: {
        estimateId,
        includePaymentLink: true,
        public_token: estimate.public_token,
      },
    });

    let attachments: any[] | undefined;
    if (pdfData?.pdfBase64 && !pdfError) {
      try {
        console.log('Attaching PDF to email, size:', pdfData.pdfSize);
        attachments = [{
          filename: `Estimate-${estimate.estimate_number || estimate.id}.pdf`,
          content: pdfData.pdfBase64,
          contentType: 'application/pdf',
        }];
      } catch (pdfConversionError) {
        console.warn('Could not attach PDF:', pdfConversionError);
      }
    } else if (pdfError) {
      console.error('PDF generation failed:', pdfError);
    }

    // Premium email template with classic, elegant design
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate from ${companyName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f1eb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #161e2c; padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 32px 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td valign="middle">
                          ${logoSrc ? `<img src="${logoSrc}" alt="${companyName}" width="48" height="48" style="display: inline-block; border-radius: 8px; margin-right: 16px; vertical-align: middle;">` : ''}
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">${companyName.toUpperCase()}</span>
                        </td>
                        <td align="right" valign="middle">
                          <span style="background-color: #d59f47; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 4px; letter-spacing: 1px;">ESTIMATE</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reference Bar -->
          <tr>
            <td style="background-color: #f9f8f5; border-bottom: 1px solid #e8e4dc; padding: 20px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="33%">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Reference No.</span><br>
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #222222;">${estimate.estimate_number || '—'}</span>
                  </td>
                  <td width="33%">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Date Issued</span><br>
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #222222;">${formatDate(estimate.created_at)}</span>
                  </td>
                  <td width="33%">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Valid Until</span><br>
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #222222;">${formatDate(estimate.valid_until) || '30 Days'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 400; color: #161e2c; font-family: Georgia, 'Times New Roman', serif;">Dear ${estimate.client_name || 'Valued Customer'},</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #444444; font-family: Georgia, 'Times New Roman', serif;">
                Thank you for the opportunity to provide you with an estimate. Please find enclosed our detailed proposal for your project:
              </p>
              
              <!-- Project Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f8f5; border: 1px solid #e8e4dc; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #d59f47; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Project Details</span>
                    <h3 style="margin: 8px 0 12px 0; font-size: 20px; font-weight: 600; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">${estimate.title}</h3>
                    ${estimate.site_address ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">📍 ${estimate.site_address}</p>` : ''}
                    ${estimate.trade_type ? `<p style="margin: 0; font-size: 14px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">🔧 ${estimate.trade_type}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Total Investment -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #161e2c; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #d59f47; margin-bottom: 8px; font-weight: 600;">Total Investment</span>
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 36px; font-weight: 700; color: #ffffff;">${formatCurrency(estimate.total_amount || estimate.grand_total || 0)}</span>
                    ${estimate.required_deposit ? `<span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #d59f47; margin-top: 12px;">Deposit Required: ${formatCurrency(estimate.required_deposit)}</span>` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${publicUrl}" target="_blank" style="display: inline-block; background-color: #d59f47; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; padding: 16px 40px; border-radius: 6px; text-decoration: none; letter-spacing: 0.5px;">
                      VIEW, SIGN &amp; PAY ONLINE →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #999999; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                Click the button above to review the complete estimate online
              </p>
            </td>
          </tr>
          
          <!-- PDF Notice -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 40px 32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef9e7; border-left: 4px solid #d59f47; border-radius: 0 6px 6px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #8b7355;">
                      <strong>📎 PDF Attached</strong> — A detailed PDF of your estimate is attached to this email for your records.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Contact Section -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 40px 40px 40px; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #e8e4dc; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">Questions? We're here to help.</p>
                    <p style="margin: 0; font-size: 14px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                      Reply to this email or contact us at 
                      <a href="mailto:${replyToEmail}" style="color: #d59f47; text-decoration: none;">${replyToEmail}</a>
                      ${companyPhone ? ` • ${companyPhone}` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #161e2c; padding: 28px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff;">
                ${companyName}
              </p>
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.6);">
                This estimate was prepared specifically for ${estimate.client_name || 'you'}.
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.4);">
                ${companyAddress ? `${companyAddress}` : ''}${companyPhone ? ` • ${companyPhone}` : ''}${companyWebsite ? ` • ${companyWebsite}` : ''}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailData: any = {
      from: `${companyName} <${effectiveFromEmail}>`,
      to: recipients,
      bcc,
      reply_to: replyToEmail || contractorEmail || undefined,
      subject: `Estimate from ${companyName} - ${estimate.title}`,
      html: emailHtml,
    };

    // Add PDF attachment if available
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
      console.log('Email includes PDF attachment');
    }

    let emailResponse = await resend.emails.send(emailData);

    console.log('Resend API response:', JSON.stringify(emailResponse, null, 2));

    // Handle Resend test-mode restriction
    let usedFallback = false;
    if (emailResponse?.error && (emailResponse.error as any).statusCode === 403 && typeof emailResponse.error.message === 'string' && emailResponse.error.message.includes('only send testing emails to your own email address')) {
      const match = emailResponse.error.message.match(/\(([^)]+)\)/);
      const ownerEmail = match?.[1];
      console.warn('Resend test-mode restriction encountered. Owner email:', ownerEmail);
      if (ownerEmail) {
        const retry = await resend.emails.send({
          from: `${contractorName} <${effectiveFromEmail}>`,
          to: [ownerEmail],
          subject: `Forward to ${estimate.client_name} <${estimate.client_email}> — Estimate from ${companyName}`,
          html: `
            <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
              <div style="background:#FEF9E7;border:1px solid #D59F47;color:#8B7355;padding:16px;border-radius:8px;margin-bottom:24px;">
                <strong>⚠️ Test Mode:</strong> Your email service is in test mode. Please forward this estimate to ${estimate.client_name} &lt;${estimate.client_email}&gt;.
              </div>
              ${emailHtml}
            </div>
          `,
          attachments: attachments,
        });
        console.log('Fallback email sent to owner:', JSON.stringify(retry, null, 2));
        usedFallback = true;
        emailResponse = retry;
      }
    }

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    // Update estimate with sent timestamp
    await supabase
      .from('estimates')
      .update({ 
        sent_at: new Date().toISOString(),
        status: estimate.status === 'draft' ? 'sent' : estimate.status,
      })
      .eq('id', estimateId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        usedFallback,
        note: usedFallback ? 'Email sent to your account email due to Resend test mode. Please forward to client.' : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending estimate:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);