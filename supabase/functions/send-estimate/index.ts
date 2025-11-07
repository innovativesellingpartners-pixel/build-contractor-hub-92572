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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    if (!estimate.client_email) {
      throw new Error('Client email is required to send estimate');
    }

    // Generate public view URL
    const appUrl = Deno.env.get('APP_URL') || 'https://yourapp.lovable.app';
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Fetch contractor profile for branding (company name, logo)
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, logo_url')
      .eq('user_id', estimate.user_id)
      .single();

    const companyName = profile?.company_name || 'CT1 Constructeam';
    const logoSrc = profile?.logo_url || '';

    // Send email to client
    const recipients = [estimate.client_email];
    const bcc: string[] | undefined = contractorEmail ? [contractorEmail] : undefined;

    // Log if using default resend.dev email (optional: verify custom domain later)
    if (FROM_EMAIL.endsWith('@resend.dev') || FROM_EMAIL === 'onboarding@resend.dev') {
      console.log('Note: Using Resend test domain. For custom branding, verify your domain at resend.com/domains');
    }

    // Use FROM_EMAIL environment variable (now set to estimates@myct1.com)
    const effectiveFromEmail = FROM_EMAIL;
    console.log('Attempting to send estimate email', { to: recipients, bcc, from: effectiveFromEmail, replyTo: contractorEmail || null });
    
    // Use Resend attachments to attach PDF
    // Generate PDF and attach to email
    const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-estimate-pdf', {
      body: {
        estimateId,
        includePaymentLink: true,
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

    const emailData: any = {
      from: `${contractorName} <${effectiveFromEmail}>`,
      to: recipients,
      bcc,
      reply_to: contractorEmail || undefined,
      subject: `RE: ${contractorName} - Powered by CT1 - Estimate`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; }
              .email-wrapper { background-color: #f3f4f6; padding: 20px 0; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #E02424 0%, #C01E1E 100%); padding: 40px 40px; }
              .header-content { display: table; width: 100%; }
              .header-logo { display: table-cell; vertical-align: middle; width: 60px; padding-right: 20px; }
              .header-logo img { max-width: 50px; height: auto; border-radius: 6px; display: block; }
              .header-text { display: table-cell; vertical-align: middle; }
              .header-title { color: #ffffff; font-size: 28px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.5px; }
              .header-subtitle { color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 0; font-weight: 500; }
              .content { padding: 50px 40px; background: #ffffff; }
              .greeting { color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 25px 0; }
              .message { color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 35px 0; }
              .details-box { background: linear-gradient(to bottom, #fef2f2, #ffffff); border: 2px solid #fee2e2; border-radius: 12px; padding: 30px; margin: 35px 0; }
              .details-title { color: #111827; font-size: 22px; font-weight: 900; margin: 0 0 25px 0; text-align: center; }
              .detail-row { margin: 16px 0; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
              .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
              .detail-label { color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600; }
              .detail-value { color: #111827; font-size: 17px; font-weight: 600; margin: 0; }
              .total-section { background: linear-gradient(135deg, #E02424 0%, #C01E1E 100%); padding: 25px; border-radius: 8px; margin-top: 20px; text-align: center; }
              .total-label { color: rgba(255, 255, 255, 0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; }
              .total-amount { color: #ffffff; font-size: 36px; font-weight: 900; margin: 0; }
              .cta-section { text-align: center; margin: 40px 0; }
              .cta-button { display: inline-block; background: #E02424; color: #ffffff !important; padding: 18px 50px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 17px; box-shadow: 0 6px 20px rgba(224, 36, 36, 0.4); transition: all 0.3s; }
              .attachment-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0; }
              .attachment-notice p { color: #78350f; font-size: 14px; margin: 0; line-height: 1.6; }
              .attachment-notice strong { color: #92400e; }
              .contact-info { background: #f9fafb; padding: 25px; border-radius: 10px; margin: 35px 0; text-align: center; }
              .contact-info p { color: #4b5563; font-size: 15px; margin: 8px 0; line-height: 1.6; }
              .contact-info strong { color: #111827; font-size: 16px; }
              .footer { background: #f9fafb; padding: 35px 40px; text-align: center; border-top: 2px solid #e5e7eb; }
              .footer-text { color: #9ca3af; font-size: 13px; line-height: 1.7; margin: 0 0 15px 0; }
              .powered-by { color: #6b7280; font-size: 13px; margin: 0; font-weight: 600; }
              .powered-by strong { color: #E02424; }
              @media only screen and (max-width: 600px) {
                .header { padding: 30px 25px; }
                .content { padding: 35px 25px; }
                .footer { padding: 30px 25px; }
                .header-content { display: block; }
                .header-logo { display: block; width: 100%; padding-right: 0; margin-bottom: 15px; text-align: center; }
                .header-logo img { margin: 0 auto; }
                .header-text { display: block; text-align: center; }
                .header-title { font-size: 24px; }
                .details-box { padding: 25px 20px; }
                .cta-button { padding: 16px 35px; font-size: 16px; }
                .total-amount { font-size: 30px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="container">
                <div class="header">
                  <div class="header-content">
                    <div class="header-logo">
                      ${logoSrc ? `<img src="${logoSrc}" alt="${companyName} Logo"/>` : `<img src="https://faqrzzodtmsybofakcvv.supabase.co/storage/v1/object/public/company-logos/ct1-logo-circle.png" alt="CT1 Logo"/>`}
                    </div>
                    <div class="header-text">
                      <h1 class="header-title">Professional Estimate</h1>
                      <p class="header-subtitle">${estimate.estimate_number ? `#${estimate.estimate_number}` : 'Your Project Estimate'}</p>
                    </div>
                  </div>
                </div>
                
                <div class="content">
                  <p class="greeting">Hello ${estimate.client_name},</p>
                  <p class="message">
                    Thank you for considering <strong>${contractorName}</strong> for your project. We've prepared a comprehensive estimate for <strong>${estimate.title}</strong>. Please review the attached PDF for complete details, or click the button below to view, sign, and pay online.
                  </p>
                  
                  <div class="attachment-notice">
                    <p><strong>📎 PDF Attached</strong><br>
                    A detailed estimate document is attached to this email. You can download it, review it at your convenience, and even sign and pay directly from the PDF link.</p>
                  </div>
                  
                  <div class="details-box">
                    <h2 class="details-title">Estimate Overview</h2>
                    <div class="detail-row">
                      <p class="detail-label">Project Name</p>
                      <p class="detail-value">${estimate.title}</p>
                    </div>
                    ${estimate.trade_type ? `
                    <div class="detail-row">
                      <p class="detail-label">Trade Type</p>
                      <p class="detail-value">${estimate.trade_type}</p>
                    </div>
                    ` : ''}
                    ${estimate.site_address ? `
                    <div class="detail-row">
                      <p class="detail-label">Project Location</p>
                      <p class="detail-value">${estimate.site_address}</p>
                    </div>
                    ` : ''}
                    ${estimate.valid_until ? `
                    <div class="detail-row">
                      <p class="detail-label">Valid Until</p>
                      <p class="detail-value">${new Date(estimate.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    ` : ''}
                    <div class="total-section">
                      <p class="total-label">Total Investment</p>
                      <p class="total-amount">$${estimate.total_amount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  <div class="cta-section">
                    <a href="${publicUrl}" class="cta-button">
                      🔗 View, Sign & Pay Online
                    </a>
                    <p style="color: #6b7280; font-size: 13px; margin-top: 15px;">
                      Click the button above to review the full estimate online
                    </p>
                  </div>

                  <div class="contact-info">
                    <p><strong>Questions? We're Here to Help!</strong></p>
                    <p>📧 ${contractorEmail}</p>
                    <p>Reply to this email or contact us directly</p>
                  </div>
                </div>

                <div class="footer">
                  <p class="footer-text">
                    This estimate was prepared specifically for ${estimate.client_name}.<br>
                    All pricing and terms are confidential and subject to the conditions outlined in the attached document.
                  </p>
                  <p class="powered-by">
                    Powered by <strong>CT1 Constructeam</strong> - Professional Contractor Management
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Add PDF attachment if available
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
      console.log('Email includes PDF attachment');
    }

    let emailResponse = await resend.emails.send(emailData);

    console.log('Resend API response:', JSON.stringify(emailResponse, null, 2));

    // Handle Resend test-mode restriction by re-sending to the allowed owner email
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
            <!DOCTYPE html>
            <html><body style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <div style="background:#FFF7ED;border:1px solid #FDBA74;color:#7C2D12;padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                Your email service is in test mode. Please forward this estimate to ${estimate.client_name} &lt;${estimate.client_email}&gt;.
              </div>
              <p>Open the estimate here:</p>
              <p><a href="${publicUrl}" style="display:inline-block;background:#E02424;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">View Full Estimate & Sign</a></p>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;" />
              <p style="color:#6B7280;font-size:14px;">If the button does not work, copy this link: ${publicUrl}</p>
              <p style="color:#6B7280;font-size:14px;">Reply-To: ${contractorEmail}</p>
            </body></html>
          `,
          reply_to: contractorEmail || undefined,
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
      console.error('Error updating estimate status:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      publicUrl,
      usedFallback,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-estimate function:", error);
    
    // Try to log the error in the estimate record
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      const body = await req.clone().json();
      const { estimateId } = body;
      if (estimateId) {
        await supabaseClient
          .from('estimates')
          .update({ 
            last_send_attempt: new Date().toISOString(),
            email_send_error: error.message 
          })
          .eq('id', estimateId);
      }
    } catch (logError) {
      console.error("Error logging send failure:", logError);
    }
    
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
