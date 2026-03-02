import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeToken(token: any): string {
  if (!token) return '';
  if (typeof token === 'string') {
    if (token.startsWith('\\x')) {
      try {
        const hexPart = token.slice(2);
        return new TextDecoder().decode(
          new Uint8Array(hexPart.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
        );
      } catch { return token; }
    }
    if (/^[0-9a-fA-F]+$/.test(token) && token.length % 2 === 0 && token.length > 100) {
      try {
        return new TextDecoder().decode(
          new Uint8Array(token.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
        );
      } catch { return token; }
    }
    return token;
  }
  if (token?.type === 'Buffer' && Array.isArray(token.data)) {
    return new TextDecoder().decode(new Uint8Array(token.data));
  }
  return String(token);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: CT1_INTERNAL_API_KEY ──
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('CT1_INTERNAL_API_KEY');
    if (!expectedKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      contractorId,
      selectedSlotISO,
      appointmentDurationMinutes = 60,
      callerName,
      callerPhone,
      homeowner_name,
      homeowner_email,
      homeowner_phone,
      address,
      notes,
    } = await req.json();

    if (!contractorId || !selectedSlotISO) {
      return new Response(JSON.stringify({ error: 'contractorId and selectedSlotISO are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Fetch Google calendar connection (strictly by contractor_id) ──
    const { data: calConnections } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('contractor_id', contractorId)
      .eq('provider', 'google')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!calConnections || calConnections.length === 0) {
      return new Response(JSON.stringify({ success: false, reason: 'calendar_not_connected' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connection = calConnections[0];

    // ── Refresh Google token ──
    let accessToken = decodeToken(connection.access_token_encrypted);
    const refreshTokenStr = decodeToken(connection.refresh_token_encrypted);

    try {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshTokenStr,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
        const encoder = new TextEncoder();
        const hexToken = Array.from(encoder.encode(accessToken))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        await supabase.from('calendar_connections').update({
          access_token_encrypted: hexToken,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        }).eq('id', connection.id);
      }
    } catch (e) {
      console.error('Token refresh failed, using stored token:', e);
    }

    // ── Create Google Calendar event ──
    const startTime = new Date(selectedSlotISO);
    const endTime = new Date(startTime.getTime() + appointmentDurationMinutes * 60_000);

    const displayName = homeowner_name || callerName || 'Customer';
    const displayPhone = homeowner_phone || callerPhone;

    const descriptionParts = [
      `Customer: ${displayName}`,
      displayPhone ? `Phone: ${displayPhone}` : null,
      homeowner_email ? `Email: ${homeowner_email}` : null,
      address ? `Address: ${address}` : null,
      notes ? `\nNotes: ${notes}` : null,
      '\n— Booked via Forge AI',
    ].filter(Boolean).join('\n');

    const eventPayload: Record<string, any> = {
      summary: `Service Appointment – ${displayName}`,
      description: descriptionParts,
      location: address || undefined,
      start: { dateTime: startTime.toISOString(), timeZone: 'America/Detroit' },
      end: { dateTime: endTime.toISOString(), timeZone: 'America/Detroit' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
      ...(homeowner_email ? {
        attendees: [{ email: homeowner_email, displayName }],
      } : {}),
    };

    const gcalRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!gcalRes.ok) {
      const errText = await gcalRes.text();
      console.error('Google Calendar create error:', errText);
      return new Response(JSON.stringify({ success: false, reason: 'calendar_create_failed', detail: errText }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gcalEvent = await gcalRes.json();
    console.log('Created Google Calendar event:', gcalEvent.id);

    // ── Store event in calendar_events table ──
    await supabase.from('calendar_events').insert({
      contractor_id: contractorId,
      event_id: gcalEvent.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: 'forge_booking',
      is_busy: true,
      synced_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      calendarEventId: gcalEvent.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in forge-calendar-book:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
