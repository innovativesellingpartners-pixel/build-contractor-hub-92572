import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  meetingId: string;
  recipientPhone: string;
  recipientName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  location?: string;
  contractorName?: string;
  contractorPhone?: string;
}

async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  if (!accountSid || !authToken) {
    console.error("Twilio credentials not configured");
    return { success: false, error: "Twilio not configured" };
  }

  // Get the contractor's Twilio phone number or use a default
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER") || "+18885551234";
  
  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);
    
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: body,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("SMS sent successfully:", result.sid);
      return { success: true, sid: result.sid };
    } else {
      console.error("Twilio error:", result);
      return { success: false, error: result.message || "Failed to send SMS" };
    }
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +1 prefix if it's a 10-digit US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Add + prefix if it's 11 digits starting with 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return phone;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SMSRequest = await req.json();
    const { meetingId, recipientPhone, recipientName, meetingTitle, meetingDate, meetingTime, location, contractorName, contractorPhone } = body;

    if (!recipientPhone) {
      return new Response(JSON.stringify({ error: "Recipient phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedPhone = formatPhoneNumber(recipientPhone);
    
    // Build the immediate confirmation message
    const locationText = location ? `\n📍 Location: ${location}` : '';
    const contractorInfo = contractorName ? `\n👷 Contractor: ${contractorName}` : '';
    const callText = contractorPhone ? `\n📞 Questions? Call: ${contractorPhone}` : '';
    
    const immediateMessage = `✅ Meeting Confirmed!

📅 ${meetingDate}
⏰ ${meetingTime}
📝 ${meetingTitle}${locationText}${contractorInfo}${callText}

You'll receive reminders:
• 24 hours before
• 30 minutes before

Reply STOP to unsubscribe.`;

    // Send immediate confirmation SMS
    const smsResult = await sendSMS(formattedPhone, immediateMessage);

    // Record the sent SMS
    await supabase.from("scheduled_sms_reminders").insert({
      user_id: user.id,
      meeting_id: meetingId,
      recipient_phone: formattedPhone,
      recipient_name: recipientName || null,
      message: immediateMessage,
      reminder_type: "immediate",
      scheduled_for: new Date().toISOString(),
      sent_at: smsResult.success ? new Date().toISOString() : null,
      status: smsResult.success ? "sent" : "failed",
      error_message: smsResult.error || null,
      twilio_sid: smsResult.sid || null,
    });

    // Parse meeting datetime to schedule future reminders
    const meetingDateTime = new Date(`${meetingDate} ${meetingTime}`);
    
    // Schedule 24-hour reminder
    const reminder24h = new Date(meetingDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > new Date()) {
      const message24h = `⏰ Reminder: Your meeting is tomorrow!

📅 ${meetingDate}
⏰ ${meetingTime}
📝 ${meetingTitle}${locationText}${contractorInfo}${callText}`;

      await supabase.from("scheduled_sms_reminders").insert({
        user_id: user.id,
        meeting_id: meetingId,
        recipient_phone: formattedPhone,
        recipient_name: recipientName || null,
        message: message24h,
        reminder_type: "24_hours",
        scheduled_for: reminder24h.toISOString(),
        status: "pending",
      });
    }

    // Schedule 30-minute reminder
    const reminder30min = new Date(meetingDateTime.getTime() - 30 * 60 * 1000);
    if (reminder30min > new Date()) {
      const message30min = `🚗 Heads up! Your contractor is arriving in about 30 minutes.

📅 Today at ${meetingTime}
📝 ${meetingTitle}${locationText}${contractorInfo}

${contractorPhone ? `Need to reach us? Call: ${contractorPhone}` : 'See you soon!'}`;

      await supabase.from("scheduled_sms_reminders").insert({
        user_id: user.id,
        meeting_id: meetingId,
        recipient_phone: formattedPhone,
        recipient_name: recipientName || null,
        message: message30min,
        reminder_type: "30_minutes",
        scheduled_for: reminder30min.toISOString(),
        status: "pending",
      });
    }

    return new Response(
      JSON.stringify({
        success: smsResult.success,
        message: smsResult.success 
          ? "SMS confirmation sent and reminders scheduled" 
          : "Failed to send SMS",
        sid: smsResult.sid,
        error: smsResult.error,
      }),
      {
        status: smsResult.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-sms:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});