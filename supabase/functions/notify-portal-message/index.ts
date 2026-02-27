import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { portal_token_id, message, sender_name } = await req.json();

    if (!portal_token_id || !message) {
      return new Response(JSON.stringify({ error: "Missing portal_token_id or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the portal token to get the contractor_id and job info
    const { data: portalToken, error: tokenError } = await supabase
      .from("customer_portal_tokens")
      .select("contractor_id, job_id, token")
      .eq("id", portal_token_id)
      .eq("is_active", true)
      .single();

    if (tokenError || !portalToken) {
      console.error("Portal token not found:", tokenError);
      return new Response(JSON.stringify({ error: "Portal token not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the contractor's phone number from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, company_name, contact_name")
      .eq("id", portalToken.contractor_id)
      .single();

    if (!profile?.phone) {
      console.log("Contractor has no phone number, skipping SMS notification");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_phone" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get job info for context
    const { data: job } = await supabase
      .from("jobs")
      .select("job_name, job_number")
      .eq("id", portalToken.job_id)
      .single();

    const jobLabel = job?.job_name || job?.job_number || "a job";
    const customerLabel = sender_name || "A customer";
    const portalUrl = `https://myct1.com/portal/${portalToken.token}`;
    const preview = message.length > 80 ? message.substring(0, 80) + "..." : message;

    const smsBody = `${customerLabel} sent a message on your customer portal for ${jobLabel}:\n\n"${preview}"\n\nView: ${portalUrl}`;

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;

    // Try to get contractor's provisioned number, fall back to default
    const { data: phoneNumber } = await supabase
      .from("phone_numbers")
      .select("phone_number")
      .eq("contractor_id", portalToken.contractor_id)
      .eq("active", true)
      .maybeSingle();

    const fromNumber = phoneNumber?.phone_number || Deno.env.get("TWILIO_FROM_NUMBER") || "";

    if (!fromNumber) {
      console.log("No SMS from number configured, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_from_number" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: profile.phone,
      From: fromNumber,
      Body: smsBody,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      },
      body: body.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);
      return new Response(JSON.stringify({ error: twilioData.message || "Failed to send SMS" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("SMS notification sent to contractor:", profile.phone);
    return new Response(JSON.stringify({ success: true, sid: twilioData.sid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-portal-message:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
