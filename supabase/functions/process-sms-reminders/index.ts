import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  if (!accountSid || !authToken) {
    console.error("Twilio credentials not configured");
    return { success: false, error: "Twilio not configured" };
  }

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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function is meant to be called by a cron job or scheduler
    // Find all pending reminders that are due
    const now = new Date().toISOString();
    
    const { data: pendingReminders, error: fetchError } = await supabase
      .from("scheduled_sms_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50); // Process in batches

    if (fetchError) {
      console.error("Error fetching pending reminders:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      console.log("No pending reminders to process");
      return new Response(JSON.stringify({ message: "No pending reminders", processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${pendingReminders.length} pending reminders`);
    
    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of pendingReminders) {
      const smsResult = await sendSMS(reminder.recipient_phone, reminder.message);
      
      // Update the reminder status
      const { error: updateError } = await supabase
        .from("scheduled_sms_reminders")
        .update({
          status: smsResult.success ? "sent" : "failed",
          sent_at: smsResult.success ? new Date().toISOString() : null,
          error_message: smsResult.error || null,
          twilio_sid: smsResult.sid || null,
        })
        .eq("id", reminder.id);

      if (updateError) {
        console.error(`Error updating reminder ${reminder.id}:`, updateError);
      }

      if (smsResult.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Small delay between SMS to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Processed ${pendingReminders.length} reminders: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        processed: pendingReminders.length,
        sent: sentCount,
        failed: failedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in process-sms-reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});