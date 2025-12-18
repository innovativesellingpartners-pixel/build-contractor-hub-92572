import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MeetingInviteRequest {
  recipientEmail: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: number;
  location?: string;
  notes?: string;
  jobNumber?: string;
  contractorId?: string; // For service-role calls from voice AI
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-meeting-invite function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for auth header - allow service-role calls from voice AI
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      // Check if it's the service role key (internal call from voice AI)
      if (token === supabaseServiceKey) {
        console.log("Service role call - proceeding without user auth");
        userId = null; // No user context needed for service calls
      } else {
        // Regular user auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = user.id;
      }
    } else {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      recipientEmail,
      meetingTitle,
      meetingDate,
      meetingTime,
      duration,
      location,
      notes,
      jobNumber,
      contractorId,
    }: MeetingInviteRequest = await req.json();

    if (!recipientEmail || !meetingTitle || !meetingDate || !meetingTime) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use contractorId from request (for service calls) or userId from auth
    const profileId = contractorId || userId;

    // Fetch contractor profile for branding (only if we have a profile ID)
    let businessName = "CT1 Contractor";
    let businessPhone = "";
    
    if (profileId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, business_email, business_phone")
        .eq("id", profileId)
        .single();
      
      businessName = profile?.business_name || "CT1 Contractor";
      businessPhone = profile?.business_phone || "";
    }

    // Format duration
    const durationText = duration >= 60 
      ? `${Math.floor(duration / 60)} hour${Math.floor(duration / 60) > 1 ? 's' : ''}${duration % 60 > 0 ? ` ${duration % 60} min` : ''}`
      : `${duration} minutes`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Meeting Invitation</h1>
          <p style="color: #fff; margin: 10px 0 0; font-size: 14px;">From ${businessName}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #1e3a5f; margin: 0 0 20px; font-size: 20px;">
            ${meetingTitle}
          </h2>
          
          ${jobNumber ? `
            <div style="background: #fff; padding: 12px 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #d4af37;">
              <strong style="color: #666;">Job Reference:</strong> ${jobNumber}
            </div>
          ` : ''}
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 100px;">
                <strong>📅 Date:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                ${meetingDate}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                <strong>🕐 Time:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                ${meetingTime}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                <strong>⏱️ Duration:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                ${durationText}
              </td>
            </tr>
            ${location ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                  <strong>📍 Location:</strong>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                  ${location}
                </td>
              </tr>
            ` : ''}
          </table>

          ${notes ? `
            <div style="margin-top: 25px; padding: 15px; background: #fff; border-radius: 4px; border: 1px solid #e0e0e0;">
              <strong style="color: #666;">Additional Notes:</strong>
              <p style="margin: 10px 0 0; white-space: pre-wrap;">${notes}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background: #1e3a5f; border-radius: 4px; text-align: center;">
            <p style="color: #fff; margin: 0; font-size: 14px;">
              Please confirm your attendance by replying to this email.
            </p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Best regards,<br/>
            <strong>${businessName}</strong>
            ${businessPhone ? `<br/>${businessPhone}` : ''}
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>This meeting invitation was sent via CT1 Business Suite</p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending meeting invite to ${recipientEmail}`);

    const fromEmail = Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>";

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `Meeting Invitation: ${meetingTitle} - ${meetingDate}`,
      html: emailHtml,
    });

    console.log("Meeting invite sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
