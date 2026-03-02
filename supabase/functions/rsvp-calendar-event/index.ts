import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeToken(token: any): string {
  if (!token) return '';
  if (typeof token === 'string' && token.startsWith('\\x')) {
    const hex = token.slice(2);
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }
  if (typeof token === 'string' && /^[0-9a-fA-F]+$/.test(token) && token.length > 100) {
    let result = '';
    for (let i = 0; i < token.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }
  return String(token);
}

async function refreshGoogleToken(refreshToken: string, connection: any, supabase: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (data.access_token) {
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY') || 'default-key';
    await supabase.rpc('store_calendar_tokens', {
      p_user_id: connection.user_id,
      p_provider: 'google',
      p_email: connection.calendar_email,
      p_access_token: data.access_token,
      p_refresh_token: refreshToken,
      p_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      p_encryption_key: encryptionKey,
    });
    return data.access_token;
  }
  throw new Error('Failed to refresh Google token');
}

async function refreshOutlookToken(refreshToken: string, connection: any, supabase: any): Promise<string> {
  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID');
  const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access User.Read',
    }),
  });
  const data = await response.json();
  if (data.access_token) {
    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY') || 'default-key';
    await supabase.rpc('store_calendar_tokens', {
      p_user_id: connection.user_id,
      p_provider: 'outlook',
      p_email: connection.calendar_email,
      p_access_token: data.access_token,
      p_refresh_token: data.refresh_token || refreshToken,
      p_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      p_encryption_key: encryptionKey,
    });
    return data.access_token;
  }
  throw new Error('Failed to refresh Outlook token');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { eventId, calendarId, provider, response: rsvpResponse } = await req.json();

    if (!eventId || !provider || !rsvpResponse) {
      return new Response(JSON.stringify({ error: 'Missing eventId, provider, or response' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`RSVP ${rsvpResponse} for ${provider} event ${eventId} by user ${user.id}`);

    // Get calendar connection (same pattern as update-calendar-event)
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (connError || !connections || connections.length === 0) {
      return new Response(JSON.stringify({ error: 'No calendar connection found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connection = connections[0];
    const refreshTokenDecoded = decodeToken(connection.refresh_token_encrypted);
    const accessTokenDecoded = decodeToken(connection.access_token_encrypted);

    let result;

    if (provider === 'google') {
      // Always refresh for fresh credentials
      let accessToken = accessTokenDecoded;
      try {
        accessToken = await refreshGoogleToken(refreshTokenDecoded, connection, supabase);
      } catch (e: any) {
        console.warn('Token refresh failed, using existing:', e.message);
      }

      const targetCalendarId = calendarId || 'primary';

      // Get current event to update attendee response
      const getResp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!getResp.ok) throw new Error(`Failed to get event: ${await getResp.text()}`);

      const event = await getResp.json();
      const attendees = event.attendees || [];
      const userEmail = connection.calendar_email?.toLowerCase();

      let found = false;
      for (const att of attendees) {
        if (att.email?.toLowerCase() === userEmail || att.self) {
          att.responseStatus = rsvpResponse;
          found = true;
          break;
        }
      }
      if (!found) {
        attendees.push({ email: connection.calendar_email, responseStatus: rsvpResponse, self: true });
      }

      const patchResp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}?sendUpdates=all`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendees }),
        }
      );
      if (!patchResp.ok) throw new Error(`Failed to RSVP: ${await patchResp.text()}`);
      result = await patchResp.json();

    } else if (provider === 'outlook') {
      let accessToken = accessTokenDecoded;
      try {
        accessToken = await refreshOutlookToken(refreshTokenDecoded, connection, supabase);
      } catch (e: any) {
        console.warn('Token refresh failed, using existing:', e.message);
      }

      // Outlook uses specific endpoints for RSVP
      const actionMap: Record<string, string> = {
        accepted: 'accept',
        tentative: 'tentativelyAccept',
        declined: 'decline',
      };
      const action = actionMap[rsvpResponse];
      if (!action) throw new Error(`Invalid response: ${rsvpResponse}`);

      const rsvpResp = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${eventId}/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sendResponse: true }),
        }
      );
      if (!rsvpResp.ok) throw new Error(`Outlook RSVP failed: ${await rsvpResp.text()}`);
      result = { success: true, action };

    } else {
      return new Response(JSON.stringify({ error: 'Unknown provider' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`RSVP successful for event ${eventId}`);
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('RSVP error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
