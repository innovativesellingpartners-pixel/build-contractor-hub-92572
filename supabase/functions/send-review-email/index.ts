import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, companyName, jobName, reviewUrl } = await req.json();

    if (!recipientEmail || !reviewUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "noreply@ct1.app";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">⭐</div>
          <h1 style="margin: 0 0 8px; font-size: 24px; color: #1a1a1a;">How was your experience?</h1>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">with ${companyName}</p>
        </div>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Hi ${recipientName || 'there'},
        </p>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Thank you for choosing <strong>${companyName}</strong> for your project${jobName ? ` — <em>${jobName}</em>` : ''}. We hope everything went well!
        </p>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          We'd really appreciate it if you could take a moment to share your experience. Your feedback helps us improve and helps other customers find quality contractors.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${reviewUrl}" style="display: inline-block; padding: 14px 32px; background-color: #D50A22; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ⭐ Leave a Google Review
          </a>
        </div>
        
        <p style="font-size: 14px; color: #888; text-align: center;">
          Thank you for your business!<br/>
          — The ${companyName} Team
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: recipientEmail,
        subject: `How was your experience with ${companyName}?`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
