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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reportId, recipientEmail, recipientName, reportType } = await req.json();

    // Fetch report
    const { data: report, error: fetchError } = await supabase
      .from('photo_reports')
      .select('*, jobs(title, site_address)')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      throw new Error('Photo report not found');
    }

    if (report.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, logo_url, phone, business_email, contact_name')
      .eq('id', user.id)
      .single();

    const companyName = profile?.company_name || 'Your Contractor';
    const logoSrc = profile?.logo_url || null;
    const replyToEmail = profile?.business_email || user.email || '';

    const appUrl = Deno.env.get('APP_URL') || 'https://build-contractor-hub-92572.lovable.app';
    const galleryUrl = `${appUrl}/photos/${report.public_token}`;
    const photoCount = (report.photo_ids || []).length;
    const jobName = report.jobs?.title || 'Your Project';

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photo Report from ${companyName}</title>
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
                    <span style="background-color: #3b82f6; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 4px; letter-spacing: 1px;">PHOTO REPORT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 400; color: #161e2c; font-family: Georgia, 'Times New Roman', serif;">Dear ${recipientName || 'Valued Customer'},</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #444444; font-family: Georgia, 'Times New Roman', serif;">
                Here is the photo report for <strong>${jobName}</strong>. We've included ${photoCount} photo${photoCount !== 1 ? 's' : ''} documenting the work.
              </p>

              ${report.notes ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f8f5; border: 1px solid #e8e4dc; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Notes</span>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">${report.notes}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #161e2c; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #3b82f6; margin-bottom: 8px; font-weight: 600;">📸 Photo Report</span>
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 36px; font-weight: 700; color: #ffffff;">${photoCount} Photos</span>
                    <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 4px;">${jobName}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${galleryUrl}" target="_blank" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; padding: 16px 40px; border-radius: 6px; text-decoration: none; letter-spacing: 0.5px;">
                      VIEW PHOTO GALLERY →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #999999; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                Click above to view all photos and download them
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #161e2c; padding: 28px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff;">
                ${companyName}
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.4);">
                ${replyToEmail}
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
      to: [recipientEmail],
      reply_to: replyToEmail,
      subject: `Photo Report: ${jobName} - ${companyName}`,
      html: emailHtml,
    };

    const emailResponse = await resend.emails.send(emailData);
    console.log('Photo report email sent:', JSON.stringify(emailResponse, null, 2));

    // Update the report as sent
    await supabase
      .from('photo_reports')
      .update({
        sent_at: new Date().toISOString(),
        recipient_email: recipientEmail,
        recipient_name: recipientName,
      })
      .eq('id', reportId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-photo-report:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
