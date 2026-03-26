import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" }
      });
    }

    const { recipientId, message } = await req.json();

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('company_name, contact_name, business_email, trade, city, state')
      .eq('id', user.id)
      .single();

    // Get recipient profile
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('company_name, contact_name, business_email')
      .eq('id', recipientId)
      .single();

    if (!recipientProfile?.business_email) {
      return new Response(JSON.stringify({ error: "Recipient has no email on file" }), {
        status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" }
      });
    }

    const senderCompany = senderProfile?.company_name || 'A Contractor';
    const senderName = senderProfile?.contact_name || 'Unknown';
    const senderTrade = senderProfile?.trade || '';
    const senderLocation = [senderProfile?.city, senderProfile?.state].filter(Boolean).join(', ');

    // Store the inquiry
    await supabase.from('network_inquiries').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      message,
      sender_name: senderName,
      sender_company: senderCompany,
      sender_email: senderProfile?.business_email || user.email,
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f1eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f1eb;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;width:100%;">
        <tr><td style="background-color:#161e2c;padding:32px 40px;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">CT1 CONTRACTOR NETWORK</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:40px;">
          <h2 style="margin:0 0 20px;font-size:22px;color:#161e2c;">New Connection Request</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
            A contractor in the CT1 network wants to connect with you!
          </p>
          <table role="presentation" width="100%" style="background:#f9f8f5;border:1px solid #e8e4dc;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#161e2c;">${senderCompany}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#666;">Contact: ${senderName}</p>
              ${senderTrade ? `<p style="margin:0 0 4px;font-size:14px;color:#666;">Trade: ${senderTrade}</p>` : ''}
              ${senderLocation ? `<p style="margin:0 0 4px;font-size:14px;color:#666;">Location: ${senderLocation}</p>` : ''}
              ${senderProfile?.business_email ? `<p style="margin:0;font-size:14px;color:#3b82f6;">${senderProfile.business_email}</p>` : ''}
            </td></tr>
          </table>
          <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Message</p>
            <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${message}</p>
          </div>
          <p style="margin:0;font-size:13px;color:#999;">
            Reply directly to this email to connect with ${senderName}.
          </p>
        </td></tr>
        <tr><td style="background-color:#161e2c;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">CT1 Contractor Network</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: `CT1 Network <${FROM_EMAIL}>`,
      to: [recipientProfile.business_email],
      reply_to: senderProfile?.business_email || user.email || undefined,
      subject: `CT1 Network: ${senderCompany} wants to connect`,
      html: emailHtml,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("send-network-inquiry error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" }
    });
  }
});
