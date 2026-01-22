import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeToken(token: any): string {
  if (!token) return '';
  
  // Handle bytea format (starts with \x)
  if (typeof token === 'string' && token.startsWith('\\x')) {
    const hex = token.slice(2);
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }
  
  // Handle hex-encoded string
  if (typeof token === 'string' && /^[0-9a-fA-F]+$/.test(token) && token.length > 100) {
    let result = '';
    for (let i = 0; i < token.length; i += 2) {
      result += String.fromCharCode(parseInt(token.substr(i, 2), 16));
    }
    return result;
  }
  
  return String(token);
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
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
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function listGoogleWritableCalendars(accessToken: string): Promise<string[]> {
  try {
    const calendarListUrl = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
    const calendarListResponse = await fetch(calendarListUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!calendarListResponse.ok) {
      // Fallback to primary only
      console.warn('Failed to fetch Google calendar list, falling back to primary:', calendarListResponse.status);
      return ['primary'];
    }

    const calendarListData = await calendarListResponse.json();
    const calendars = calendarListData.items || [];

    // Only calendars where user can delete events
    const writable = calendars
      .filter((c: any) => c?.id)
      .filter((c: any) => c.accessRole && c.accessRole !== 'freeBusyReader')
      .map((c: any) => c.id as string);

    // Always include primary as a safe fallback
    if (!writable.includes('primary')) writable.unshift('primary');

    return writable;
  } catch (err) {
    console.warn('Error listing Google calendars, falling back to primary:', err);
    return ['primary'];
  }
}

async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  // IMPORTANT: fetch-calendar-events aggregates ALL sub-calendars.
  // If we only delete from `primary`, the old event may remain in another calendar and keep blocking availability.
  const calendarIds = await listGoogleWritableCalendars(accessToken);

  let deleted = false;
  let lastNon404Error: string | null = null;

  for (const calendarId of calendarIds) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.ok) {
      deleted = true;
      console.log('Deleted Google event from calendar:', calendarId);
      break;
    }

    // 404 = not in this calendar; keep trying others
    if (response.status === 404) continue;

    // Common for read-only/subscribed calendars; keep trying
    if (response.status === 401 || response.status === 403) {
      const txt = await response.text().catch(() => '');
      console.warn(`Google delete returned ${response.status} for calendar ${calendarId}:`, txt);
      continue;
    }

    const error = await response.text();
    lastNon404Error = `calendar=${calendarId} status=${response.status} body=${error}`;
    // keep trying other calendars just in case this one is not the right one
  }

  // If we never found it anywhere, that's fine (already gone)
  if (!deleted && lastNon404Error) {
    throw new Error(`Failed to delete Google Calendar event ${eventId}: ${lastNon404Error}`);
  }
}

async function deleteOutlookCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete Outlook Calendar event: ${error}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { eventId, provider, calendarEmail } = await req.json();
    
    if (!eventId || !provider) {
      return new Response(JSON.stringify({ error: 'Missing eventId or provider' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Deleting ${provider} event ${eventId} for user ${user.id}`);

    // Get calendar connection
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (connError || !connections || connections.length === 0) {
      return new Response(JSON.stringify({ error: 'No calendar connection found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the right connection if calendarEmail is provided
    const connection = calendarEmail 
      ? connections.find(c => c.calendar_email === calendarEmail) || connections[0]
      : connections[0];

    const refreshToken = decodeToken(connection.refresh_token_encrypted);
    
    if (provider === 'google') {
      const accessToken = await refreshGoogleToken(refreshToken);
      await deleteGoogleCalendarEvent(accessToken, eventId);
    } else if (provider === 'outlook') {
      // For Outlook, refresh token logic would go here
      const accessToken = decodeToken(connection.access_token_encrypted);
      await deleteOutlookCalendarEvent(accessToken, eventId);
    }

    console.log(`Successfully deleted event ${eventId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
