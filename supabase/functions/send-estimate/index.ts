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
      .select('company_name, logo_url, phone')
      .eq('user_id', estimate.user_id)
      .single();

    const companyName = profile?.company_name || contractorName;
    const logoSrc = profile?.logo_url || 'https://faqrzzodtmsybofakcvv.supabase.co/storage/v1/object/public/company-logos/ct1-logo-circle.png';
    const companyPhone = profile?.phone || '';

    // Send email to client
    const recipients = [estimate.client_email];
    const bcc: string[] | undefined = contractorEmail ? [contractorEmail] : undefined;

    // Log if using default resend.dev email
    if (FROM_EMAIL.endsWith('@resend.dev') || FROM_EMAIL === 'onboarding@resend.dev') {
      console.log('Note: Using Resend test domain. For custom branding, verify your domain at resend.com/domains');
    }

    const effectiveFromEmail = FROM_EMAIL;
    console.log('Attempting to send estimate email', { to: recipients, bcc, from: effectiveFromEmail });
    
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

    // Premium email template
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Estimate from ${companyName}</title>
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
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E02424 0%, #B91C1C 100%); border-radius: 16px 16px 0 0; padding: 40px 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="60" valign="middle">
                    <img src="${logoSrc}" alt="${companyName}" width="50" height="50" style="display: block; border-radius: 10px; border: 2px solid rgba(255,255,255,0.2);">
                  </td>
                  <td style="padding-left: 16px;" valign="middle">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${companyName}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Professional Contractor Services</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Estimate Badge -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 30px 0 24px 0; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #111827; padding: 8px 20px; border-radius: 24px;">
                          <span style="color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">ESTIMATE ${estimate.estimate_number || ''}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 48px;">
              <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Hello ${estimate.client_name || 'Valued Customer'},</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #4b5563;">
                Thank you for the opportunity to provide you with an estimate. We've prepared a detailed proposal for <strong style="color: #111827;">${estimate.title}</strong> and are excited to potentially work with you on this project.
              </p>
            </td>
          </tr>
          
          <!-- Estimate Summary Card -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 48px 32px 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #E02424;">Estimate Summary</h3>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 13px; color: #6b7280;">Project</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #111827;">${estimate.title}</span>
                        </td>
                      </tr>
                      ${estimate.site_address ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 13px; color: #6b7280;">Location</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #111827;">${estimate.site_address}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${estimate.valid_until ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 13px; color: #6b7280;">Valid Until</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #111827;">${formatDate(estimate.valid_until)}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                    
                    <!-- Total Amount -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #E02424 0%, #B91C1C 100%); border-radius: 10px; padding: 20px; text-align: center;">
                          <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.9); margin-bottom: 8px;">Total Investment</span>
                          <span style="display: block; font-size: 32px; font-weight: 700; color: #ffffff;">${formatCurrency(estimate.total_amount || estimate.grand_total || 0)}</span>
                          ${estimate.required_deposit ? `<span style="display: block; font-size: 13px; color: rgba(255,255,255,0.9); margin-top: 8px;">Deposit: ${formatCurrency(estimate.required_deposit)}</span>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 48px 32px 48px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #E02424 0%, #B91C1C 100%); border-radius: 10px;">
                    <a href="${publicUrl}" target="_blank" style="display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">
                      VIEW, SIGN &amp; PAY ONLINE →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #9ca3af;">
                Click the button above to review your complete estimate
              </p>
            </td>
          </tr>
          
          <!-- PDF Notice -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 48px 32px 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="24" valign="top">
                          <span style="font-size: 18px;">📎</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e;">PDF Attached</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a16207; line-height: 1.5;">
                            A detailed PDF of your estimate is attached to this email for your records.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Contact Section -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 48px 40px 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 10px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">Questions? We're here to help.</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      Reply to this email or contact us at<br>
                      <a href="mailto:${contractorEmail}" style="color: #E02424; font-weight: 600; text-decoration: none;">${contractorEmail}</a>
                      ${companyPhone ? `<br><span style="color: #111827;">${companyPhone}</span>` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; border-radius: 0 0 16px 16px; padding: 32px 48px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.7);">
                This estimate was prepared specifically for ${estimate.client_name || 'you'}.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: rgba(255,255,255,0.5);">
                All pricing and terms are confidential and subject to the conditions in the attached document.
              </p>
              <p style="margin: 0; font-size: 13px; color: #E02424; font-weight: 600;">
                Powered by CT1 Constructeam
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
      from: `${contractorName} <${effectiveFromEmail}>`,
      to: recipients,
      bcc,
      reply_to: contractorEmail || undefined,
      subject: `Estimate from ${contractorName} - ${estimate.title}`,
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
          subject: `Forward to ${estimate.client_name} <${estimate.client_email}> — Estimate from ${contractorName}`,
          html: `
            <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background:#FFF7ED;border:1px solid #FDBA74;color:#7C2D12;padding:16px;border-radius:8px;margin-bottom:24px;">
                <strong>⚠️ Test Mode:</strong> Your email service is in test mode. Please forward this estimate to ${estimate.client_name} &lt;${estimate.client_email}&gt;.
              </div>
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">Click below to view the full estimate:</p>
              <a href="${publicUrl}" style="display:inline-block;background:#E02424;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">View Full Estimate</a>
              <p style="color:#6B7280;font-size:13px;margin-top:24px;">Or copy this link: ${publicUrl}</p>
            </div>
          `,
          reply_to: contractorEmail || undefined,
          attachments,
        });
        emailResponse = retry as any;
        usedFallback = true;
        console.log('Retry response:', JSON.stringify(emailResponse, null, 2));
      }
    }

    // Final error handling
    if (emailResponse?.error) {
      console.error('Resend error:', emailResponse.error);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to send email: ${JSON.stringify(emailResponse.error)}`,
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!emailResponse?.data) {
      console.error('No email data returned from Resend');
      return new Response(JSON.stringify({
        success: false,
        error: 'Email was not accepted by the email service',
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update estimate record
    console.log('Email accepted with ID:', emailResponse.data.id);
    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      last_send_attempt: now,
      email_provider_id: emailResponse.data.id,
      email_send_error: null,
    };
    if (!usedFallback) {
      updateData.status = 'sent';
      updateData.sent_at = now;
    } else {
      updateData.email_send_error = `Sent to account owner only (test mode). Please forward to ${estimate.client_email}.`;
    }

    const { error: updateError } = await supabase
      .from('estimates')
      .update(updateData)
      .eq('id', estimateId);

    if (updateError) {
      console.error('Failed to update estimate:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data.id,
        sentTo: recipients,
        usedFallback,
        pdfAttached: !!(attachments && attachments.length > 0),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-estimate function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
