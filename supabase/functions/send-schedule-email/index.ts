import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, jobId, events, mode, selectedDate } = await req.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contractor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, contact_name, logo_url, brand_primary_color")
      .eq("id", user.id)
      .maybeSingle();

    // Get job info
    const { data: job } = await supabase
      .from("jobs")
      .select("name, description, job_number, address, city, state")
      .eq("id", jobId)
      .maybeSingle();

    const businessName = profile?.company_name || profile?.contact_name || "Your Contractor";
    const brandColor = profile?.brand_primary_color || "#2563eb";
    const jobTitle = job?.description || job?.name || `Job ${job?.job_number || ''}`;
    const jobAddress = [job?.address, job?.city, job?.state].filter(Boolean).join(', ');

    const formatTime = (time: string | null) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const typeLabels: Record<string, string> = {
      work: '🔧 Work Day',
      milestone: '🚩 Milestone',
      inspection: '✅ Inspection',
      delivery: '📦 Delivery',
      meeting: '🏢 Meeting',
      other: '📌 Other',
    };

    const statusLabels: Record<string, string> = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      postponed: 'Postponed',
    };

    // Sort events by date
    const sortedEvents = [...events].sort((a: any, b: any) => a.event_date.localeCompare(b.event_date));

    const subject = mode === 'day' && selectedDate
      ? `${businessName} - Schedule for ${formatDate(selectedDate)} | ${jobTitle}`
      : `${businessName} - Full Project Schedule | ${jobTitle}`;

    let eventsHtml = '';
    sortedEvents.forEach((evt: any) => {
      const timeStr = evt.is_all_day
        ? 'All Day'
        : `${formatTime(evt.start_time)}${evt.end_time ? ' – ' + formatTime(evt.end_time) : ''}`;

      eventsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
            <div style="font-weight: 600; color: #333;">${formatDate(evt.event_date)}</div>
            <div style="font-size: 12px; color: #888;">${timeStr}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
            <div style="font-weight: 600; color: #333;">${evt.title}</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">
              ${typeLabels[evt.event_type] || evt.event_type} • ${statusLabels[evt.status] || evt.status}
            </div>
            ${evt.description ? `<div style="font-size: 13px; color: #555; margin-top: 4px;">${evt.description}</div>` : ''}
          </td>
        </tr>
      `;
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #ffffff;">
        ${profile?.logo_url ? `<div style="text-align: center; margin-bottom: 16px;"><img src="${profile.logo_url}" alt="${businessName}" style="max-height: 50px; max-width: 180px;" /></div>` : ''}
        <h2 style="color: ${brandColor}; text-align: center; margin-bottom: 4px;">Project Schedule</h2>
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 0;">
          ${jobTitle}${jobAddress ? ` • ${jobAddress}` : ''}
        </p>
        ${mode === 'day' && selectedDate ? `<p style="text-align: center; color: ${brandColor}; font-weight: 600; font-size: 15px;">${formatDate(selectedDate)}</p>` : ''}
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #e5e5e5; border-radius: 8px;">
          <thead>
            <tr style="background: ${brandColor}10;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #555; text-transform: uppercase; border-bottom: 2px solid ${brandColor}30; width: 35%;">Date & Time</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #555; text-transform: uppercase; border-bottom: 2px solid ${brandColor}30;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${eventsHtml || '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #999;">No events scheduled</td></tr>'}
          </tbody>
        </table>
        
        <p style="text-align: center; color: #aaa; font-size: 11px; margin-top: 24px;">
          Sent by ${businessName} • Powered by CT1
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || `${businessName} <onboarding@resend.dev>`,
        to,
        subject,
        html: emailHtml,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(JSON.stringify({ error: emailData.message || "Failed to send" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-schedule-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
