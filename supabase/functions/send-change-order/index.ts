import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'pwm@myct1.com';

interface SendChangeOrderRequest {
  changeOrderId: string;
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
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // SECURITY: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authentication header" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const { changeOrderId, contractorName, contractorEmail }: SendChangeOrderRequest = await req.json();

    // Fetch change order details
    const { data: changeOrder, error: fetchError } = await supabase
      .from('change_orders')
      .select('*, jobs(title, site_address, customer_id, customers(name, email))')
      .eq('id', changeOrderId)
      .single();

    if (fetchError || !changeOrder) {
      throw new Error('Change order not found');
    }

    // SECURITY: Verify ownership
    if (changeOrder.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You don't have access to this change order" }),
        { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const clientEmail = changeOrder.client_email || changeOrder.jobs?.customers?.email;
    const clientName = changeOrder.client_name || changeOrder.jobs?.customers?.name;

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Client email is required to send change order. Please add the client\'s email address first.' 
        }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://build-contractor-hub-92572.lovable.app';
    const publicUrl = `${appUrl}/change-order/${changeOrder.public_token}`;

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, logo_url, phone, business_address, city, state, zip_code, business_email, website_url, contact_name')
      .eq('id', changeOrder.user_id)
      .single();

    const companyName = profile?.company_name || contractorName || 'Your Contractor';
    const logoSrc = profile?.logo_url || null;
    const companyPhone = profile?.phone || '';
    const companyAddress = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code].filter(Boolean).join(', ');
    const replyToEmail = profile?.business_email || contractorEmail;

    const recipients = [clientEmail];
    const bcc: string[] | undefined = contractorEmail ? [contractorEmail] : undefined;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Change Order from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f1eb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #161e2c; padding: 32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    ${logoSrc ? `<img src="${logoSrc}" alt="${companyName}" width="48" height="48" style="display: inline-block; border-radius: 8px; margin-right: 16px; vertical-align: middle;">` : ''}
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #ffffff; vertical-align: middle;">${companyName.toUpperCase()}</span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background-color: #f59e0b; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 4px; letter-spacing: 1px;">CHANGE ORDER</span>
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
                  <td width="50%">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Reference No.</span><br>
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #222222;">${changeOrder.change_order_number || `CO-${changeOrder.id?.slice(0, 8).toUpperCase()}`}</span>
                  </td>
                  <td width="50%">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Date Requested</span><br>
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #222222;">${formatDate(changeOrder.date_requested)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 400; color: #161e2c; font-family: Georgia, 'Times New Roman', serif;">Dear ${clientName || 'Valued Customer'},</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #444444; font-family: Georgia, 'Times New Roman', serif;">
                We have a change order for your review. Please review the details and either approve or request revisions.
              </p>
              
              <!-- Project Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f8f5; border: 1px solid #e8e4dc; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Change Order Details</span>
                    <h3 style="margin: 8px 0 12px 0; font-size: 20px; font-weight: 600; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">${changeOrder.description}</h3>
                    ${changeOrder.reason ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">📋 ${changeOrder.reason}</p>` : ''}
                    ${changeOrder.jobs?.title ? `<p style="margin: 0; font-size: 14px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">🔧 Related to: ${changeOrder.jobs.title}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Total Amount -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #161e2c; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #f59e0b; margin-bottom: 8px; font-weight: 600;">Additional Investment</span>
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 36px; font-weight: 700; color: #ffffff;">${formatCurrency(changeOrder.total_amount || changeOrder.additional_cost)}</span>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${publicUrl}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; padding: 16px 40px; border-radius: 6px; text-decoration: none; letter-spacing: 0.5px;">
                      REVIEW &amp; RESPOND →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #999999; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                Click the button above to approve or request revisions to this change order
              </p>
            </td>
          </tr>
          
          <!-- Contact Section -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 40px 40px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #e8e4dc; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #161e2c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">Questions? We're here to help.</p>
                    <p style="margin: 0; font-size: 14px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                      Reply to this email or contact us at 
                      <a href="mailto:${replyToEmail}" style="color: #f59e0b; text-decoration: none;">${replyToEmail}</a>
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
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.4);">
                ${companyAddress ? `${companyAddress}` : ''}${companyPhone ? ` • ${companyPhone}` : ''}
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
      from: `${companyName} <${FROM_EMAIL}>`,
      to: recipients,
      bcc,
      reply_to: replyToEmail,
      subject: `Change Order from ${companyName} - ${changeOrder.description}`,
      html: emailHtml,
    };

    const emailResponse = await resend.emails.send(emailData);

    console.log('Resend API response:', JSON.stringify(emailResponse, null, 2));

    const emailId = (emailResponse as any)?.id || (emailResponse as any)?.data?.id || 'sent';

    // Record the previous status
    const previousStatus = changeOrder.status;

    // Update change order with sent/pending_approval status
    const { error: updateError } = await supabase
      .from('change_orders')
      .update({
        sent_at: new Date().toISOString(),
        status: 'pending_approval',
      })
      .eq('id', changeOrderId);

    if (updateError) {
      console.error('Failed to update change order status:', updateError);
    }

    // Log history
    await supabase.from('change_order_history').insert({
      change_order_id: changeOrderId,
      action: 'Change order sent to customer for approval',
      performed_by: contractorName || user.email || 'Contractor',
      from_status: previousStatus,
      to_status: 'pending_approval',
    });

    return new Response(
      JSON.stringify({ success: true, emailId }),
      { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-change-order function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
