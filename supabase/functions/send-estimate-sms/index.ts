import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEstimateSMSRequest {
  estimateId: string;
  phoneNumber: string;
  contractorName: string;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length > 10) return `+${cleaned}`;
  return phone;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { estimateId, phoneNumber, contractorName }: SendEstimateSMSRequest = await req.json();

    if (!estimateId || !phoneNumber) {
      return new Response(JSON.stringify({ error: "estimateId and phoneNumber are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch estimate
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !estimate) {
      return new Response(JSON.stringify({ error: "Estimate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contractor's Twilio number
    const { data: phoneData } = await supabase
      .from("phone_numbers")
      .select("twilio_number")
      .eq("contractor_id", user.id)
      .eq("is_active", true)
      .single();

    if (!phoneData?.twilio_number) {
      return new Response(JSON.stringify({ 
        error: "No Twilio number configured. Set up Voice AI first to send SMS." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format message
    const appUrl = Deno.env.get('APP_URL') || 'https://myct1.com';
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;
    const total = estimate.total_amount || estimate.grand_total || 0;
    const deposit = estimate.required_deposit || 0;
    
    let message = `Hi ${estimate.client_name || 'there'},

${contractorName} has sent you an estimate for ${estimate.title || 'your project'}.

Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (deposit > 0) {
      message += `
Deposit Required: $${deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    message += `

View, sign & pay online:
${publicUrl}

Questions? Reply to this text.`;

    // Send via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    
    if (!accountSid || !authToken) {
      return new Response(JSON.stringify({ 
        error: "Twilio credentials not configured" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log(`Sending estimate SMS to ${formattedPhone} from ${phoneData.twilio_number}`);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: phoneData.twilio_number,
        Body: message,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      // Update estimate with sms_sent_at timestamp
      // Note: If sms_sent_at column doesn't exist, this is a no-op
      await supabase
        .from('estimates')
        .update({ 
          sent_at: estimate.sent_at || new Date().toISOString(),
          status: estimate.status === 'draft' ? 'sent' : estimate.status
        })
        .eq('id', estimateId);

      console.log(`SMS sent successfully, SID: ${result.sid}`);

      return new Response(JSON.stringify({ 
        success: true, 
        sid: result.sid,
        message: 'Estimate sent via SMS successfully'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.error('Twilio error:', result);
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.message || 'Failed to send SMS'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error('Error in send-estimate-sms:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
