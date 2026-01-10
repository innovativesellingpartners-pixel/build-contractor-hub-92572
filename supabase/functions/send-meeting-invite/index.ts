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
  contractorId?: string;
  startDateTime?: string; // ISO string for precise timing
  endDateTime?: string;   // ISO string for precise timing
}

// Generate a unique ID for the calendar event
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@myct1.com`;
}

// Format date to ICS format (YYYYMMDDTHHMMSSZ)
function formatToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Parse date strings like "Monday, January 6, 2025" and "9:00 AM"
function parseDateTime(dateStr: string, timeStr: string): Date {
  // Try to parse the date string
  const date = new Date(dateStr);
  
  // Parse time (e.g., "9:00 AM" or "2:30 PM")
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const meridiem = timeMatch[3]?.toUpperCase();
    
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    
    date.setHours(hours, minutes, 0, 0);
  }
  
  return date;
}

// Generate ICS calendar file content
function generateICS(params: {
  uid: string;
  summary: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerEmail: string;
  organizerName: string;
  attendeeEmail: string;
}): string {
  const { uid, summary, description, location, startDate, endDate, organizerEmail, organizerName, attendeeEmail } = params;
  
  const now = new Date();
  const dtStamp = formatToICS(now);
  const dtStart = formatToICS(startDate);
  const dtEnd = formatToICS(endDate);
  
  // Escape special characters in text fields
  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CT1 Business Suite//Meeting Invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    location ? `LOCATION:${escapeText(location)}` : '',
    `ORGANIZER;CN=${escapeText(organizerName)}:mailto:${organizerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${attendeeEmail}:mailto:${attendeeEmail}`,
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');

  return icsContent;
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
    let userEmail: string | null = null;
    
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
        userEmail = user.email || null;
        console.log("Authenticated user:", userId, "email:", userEmail);
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
      startDateTime,
      endDateTime,
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
    let businessEmail = "";
    let senderEmail = userEmail || ""; // Start with authenticated user's email
    
    if (profileId) {
      // If we have a contractorId but no userEmail, fetch the user's email from auth
      if (!userEmail && contractorId) {
        const { data: { user: contractorUser } } = await supabase.auth.admin.getUserById(contractorId);
        if (contractorUser?.email) {
          senderEmail = contractorUser.email;
          console.log("Fetched contractor email from auth:", senderEmail);
        }
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, business_email, phone")
        .eq("user_id", profileId)
        .single();
      
      businessName = profile?.company_name || "CT1 Contractor";
      businessPhone = profile?.phone || "";
      businessEmail = profile?.business_email || senderEmail || "";
      
      // Prefer business_email if set, otherwise use authenticated user's email
      if (!senderEmail && businessEmail) {
        senderEmail = businessEmail;
      }
      
      console.log("Contractor profile loaded:", { businessName, businessEmail, senderEmail });
    }

    // Calculate start and end times for ICS
    let startDate: Date;
    let endDate: Date;
    
    if (startDateTime && endDateTime) {
      // Use precise ISO strings if provided
      startDate = new Date(startDateTime);
      endDate = new Date(endDateTime);
    } else {
      // Parse from human-readable strings
      startDate = parseDateTime(meetingDate, meetingTime);
      endDate = new Date(startDate.getTime() + duration * 60000);
    }

    console.log("Meeting times:", { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // Generate unique ID for this meeting
    const eventUID = generateUID();
    const organizerEmail = senderEmail || businessEmail || Deno.env.get("EMAIL_FROM") || "noreply@myct1.com";

    // Build description for ICS
    const icsDescription = [
      jobNumber ? `Job Reference: ${jobNumber}` : '',
      notes || '',
      '',
      `Organized by ${businessName}`,
      businessPhone ? `Phone: ${businessPhone}` : '',
    ].filter(Boolean).join('\\n');

    // Generate ICS file content
    const icsContent = generateICS({
      uid: eventUID,
      summary: meetingTitle,
      description: icsDescription,
      location: location || '',
      startDate,
      endDate,
      organizerEmail,
      organizerName: businessName,
      attendeeEmail: recipientEmail,
    });

    console.log("Generated ICS content length:", icsContent.length);

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
          
          <div style="margin-top: 30px; padding: 20px; background: #e8f4e8; border-radius: 4px; text-align: center; border: 1px solid #c3e6c3;">
            <p style="color: #2d5a2d; margin: 0; font-size: 14px; font-weight: bold;">
              📆 Calendar Invite Attached
            </p>
            <p style="color: #4a7c4a; margin: 8px 0 0; font-size: 13px;">
              Open the attached .ics file to add this meeting to your calendar with Accept/Decline options.
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

    console.log(`Sending meeting invite to ${recipientEmail} from contractor: ${senderEmail || businessEmail}`);

    // Use contractor's email in display name, but send through verified domain
    const baseFromEmail = Deno.env.get("EMAIL_FROM") || "noreply@myct1.com";
    const fromName = businessName || "CT1 Contractor";
    const fromEmail = `${fromName} <${baseFromEmail}>`;
    const replyToEmail = senderEmail || businessEmail;

    console.log("Email config:", { fromEmail, replyToEmail });

    // Convert ICS content to base64 for attachment
    const icsBase64 = btoa(icsContent);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      reply_to: replyToEmail || undefined,
      to: [recipientEmail],
      subject: `Meeting Invitation: ${meetingTitle} - ${meetingDate}`,
      html: emailHtml,
      headers: {
        'Content-Type': 'multipart/mixed',
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: icsBase64,
        }
      ],
    });

    console.log("Meeting invite with ICS attachment sent successfully:", emailResponse);

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
