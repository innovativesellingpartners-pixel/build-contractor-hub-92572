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
    
    let emailResponse = await resend.emails.send({
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
              body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #E02424 0%, #C01E1E 100%); padding: 40px 30px; text-align: center; }
              .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
              .header-title { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; }
              .header-subtitle { color: #ffffff; opacity: 0.95; font-size: 16px; margin: 10px 0 0 0; }
              .content { padding: 40px 30px; }
              .greeting { color: #000000; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; }
              .message { color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; }
              .details-box { background: #F9FAFB; border-left: 4px solid #E02424; padding: 25px; border-radius: 8px; margin: 30px 0; }
              .details-title { color: #000000; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; }
              .detail-row { margin: 12px 0; }
              .detail-label { color: #6B7280; font-size: 14px; margin: 0 0 4px 0; }
              .detail-value { color: #000000; font-size: 16px; font-weight: 600; margin: 0; }
              .total-amount { color: #E02424; font-size: 28px; font-weight: 700; }
              .cta-button { display: inline-block; background: #E02424; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 30px 0; box-shadow: 0 4px 12px rgba(224, 36, 36, 0.3); }
              .cta-button:hover { background: #C01E1E; }
              .divider { border: none; border-top: 1px solid #E5E7EB; margin: 30px 0; }
              .contact-info { color: #6B7280; font-size: 14px; line-height: 1.6; margin: 25px 0; padding: 20px; background: #F9FAFB; border-radius: 8px; }
              .footer { background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
              .footer-text { color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; }
              .powered-by { color: #6B7280; font-size: 12px; margin: 20px 0 0 0; }
              @media only screen and (max-width: 600px) {
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .header-title { font-size: 24px; }
                .cta-button { padding: 14px 30px; font-size: 15px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://faqrzzodtmsybofakcvv.supabase.co/storage/v1/object/public/assets/ct1-logo-white.png" alt="CT1" class="logo" />
                <h1 class="header-title">Professional Estimate</h1>
                <p class="header-subtitle">Estimate ${estimate.estimate_number || ''}</p>
              </div>
              
              <div class="content">
                <p class="greeting">Hello ${estimate.client_name},</p>
                <p class="message">
                  Thank you for the opportunity to work on your project. We've prepared a detailed estimate for 
                  <strong>${estimate.title}</strong>. Please review the details below and sign digitally to proceed.
                </p>
                
                <div class="details-box">
                  <h2 class="details-title">Estimate Summary</h2>
                  <div class="detail-row">
                    <p class="detail-label">Project</p>
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
                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                  <div class="detail-row">
                    <p class="detail-label">Total Investment</p>
                    <p class="total-amount">$${estimate.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <center>
                  <a href="${publicUrl}" class="cta-button">
                    View Full Estimate & Sign
                  </a>
                </center>

                <div class="contact-info">
                  <strong style="color: #000000;">Questions?</strong><br>
                  We're here to help! Reply to this email or contact us directly:<br>
                  📧 ${contractorEmail}<br>
                  ${contractorName}
                </div>
              </div>

              <div class="footer">
                <p class="footer-text">
                  This estimate was prepared specifically for ${estimate.client_name}.<br>
                  All pricing and terms are confidential.
                </p>
                <p class="powered-by">
                  Powered by <strong>CT1</strong> - Professional Contractor Management
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

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
