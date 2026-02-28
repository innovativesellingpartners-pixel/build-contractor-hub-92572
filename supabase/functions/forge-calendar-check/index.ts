import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode token from various formats (hex-encoded, bytea, Buffer, or plain string)
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
      appointmentDurationMinutes = 60,
      bufferMinutes = 15,
      minimumNoticeMinutes = 60,
    } = await req.json();

    if (!contractorId) {
      return new Response(JSON.stringify({ error: 'contractorId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Fetch contractor's Google calendar connection ──
    // Look up calendar connection by contractor_id first, fall back to user_id
    const { data: connections } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('contractor_id', contractorId)
      .eq('provider', 'google')
      .order('updated_at', { ascending: false })
      .limit(1);

    // Fallback: try user_id for backward compatibility
    let finalConnections = connections;
    if (!finalConnections || finalConnections.length === 0) {
      const { data: fallback } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', contractorId)
        .eq('provider', 'google')
        .order('updated_at', { ascending: false })
        .limit(1);
      finalConnections = fallback;
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({
        bookingAllowed: false,
        reason: 'calendar_not_connected',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connection = connections[0];

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
        // persist refreshed token
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

    // ── Fetch Google Calendar events for the next 7 days ──
    const now = new Date();
    const earliest = new Date(now.getTime() + minimumNoticeMinutes * 60_000);
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60_000);

    const eventsUrl =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(earliest.toISOString())}&` +
      `timeMax=${encodeURIComponent(windowEnd.toISOString())}&` +
      `singleEvents=true&orderBy=startTime&maxResults=250`;

    const eventsRes = await fetch(eventsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsRes.ok) {
      console.error('Google Calendar API error:', await eventsRes.text());
      return new Response(JSON.stringify({
        bookingAllowed: false,
        reason: 'calendar_api_error',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventsData = await eventsRes.json();
    const busyBlocks: { start: number; end: number }[] = (eventsData.items || [])
      .filter((e: any) => e.status !== 'cancelled')
      .map((e: any) => ({
        start: new Date(e.start?.dateTime || e.start?.date).getTime(),
        end: new Date(e.end?.dateTime || e.end?.date).getTime(),
      }));

    // ── Get contractor business_hours from ai_profiles ──
    const { data: aiProfile } = await supabase
      .from('contractor_ai_profiles')
      .select('business_hours')
      .eq('contractor_id', contractorId)
      .single();

    // Default business hours: Mon-Fri 9-17
    const defaultHours: Record<string, { start: string; end: string }> = {
      '1': { start: '09:00', end: '17:00' },
      '2': { start: '09:00', end: '17:00' },
      '3': { start: '09:00', end: '17:00' },
      '4': { start: '09:00', end: '17:00' },
      '5': { start: '09:00', end: '17:00' },
    };

    const businessHours: Record<string, { start: string; end: string }> =
      (aiProfile?.business_hours as any) || defaultHours;

    // ── Generate candidate slots ──
    const slotDuration = appointmentDurationMinutes * 60_000;
    const buffer = bufferMinutes * 60_000;
    const availableSlots: string[] = [];

    // Iterate day-by-day
    const dayMs = 24 * 60 * 60_000;
    for (
      let dayStart = new Date(earliest.toDateString()).getTime();
      dayStart < windowEnd.getTime() && availableSlots.length < 3;
      dayStart += dayMs
    ) {
      const d = new Date(dayStart);
      const dow = d.getDay().toString(); // 0=Sun … 6=Sat

      const hours = businessHours[dow];
      if (!hours) continue; // No business hours this day

      const [sh, sm] = hours.start.split(':').map(Number);
      const [eh, em] = hours.end.split(':').map(Number);

      const windowStart = Math.max(
        dayStart + sh * 3_600_000 + sm * 60_000,
        earliest.getTime()
      );
      const windowEndTime = dayStart + eh * 3_600_000 + em * 60_000;

      // Walk through 30-min increments
      for (
        let candidate = windowStart;
        candidate + slotDuration <= windowEndTime && availableSlots.length < 3;
        candidate += 30 * 60_000
      ) {
        const candidateEnd = candidate + slotDuration;

        // Check overlap with busy blocks (including buffer)
        const overlaps = busyBlocks.some(
          (b) => candidate < b.end + buffer && candidateEnd > b.start - buffer
        );

        if (!overlaps) {
          availableSlots.push(new Date(candidate).toISOString());
        }
      }
    }

    return new Response(JSON.stringify({
      bookingAllowed: true,
      availableSlots,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in forge-calendar-check:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
