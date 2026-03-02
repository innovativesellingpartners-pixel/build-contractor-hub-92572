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
      result += String.fromCharCode(parseInt(token.substr(i, 2), 16));
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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized');

    const { eventId, calendarId, provider, response: rsvpResponse } = await req.json();

    if (!eventId || !provider || !rsvpResponse) {
      throw new Error('Missing required fields: eventId, provider, response');
    }

    const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY') || 'default-key';

    // Get calendar connection
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select(`*, 
        access_token_decrypted:access_token_encrypted,
        refresh_token_decrypted:refresh_token_encrypted`)
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (connError || !connections?.length) {
      throw new Error(`No ${provider} calendar connection found`);
    }

    const connection = connections[0];

    // Decrypt tokens
    const { data: tokenData } = await supabase.rpc('get_quickbooks_tokens', {
      p_user_id: user.id,
      p_encryption_key: encryptionKey,
    });

    // Get access token via direct SQL for calendar
    const { data: calTokens } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    // Decrypt access and refresh tokens
    const { data: decryptedTokens } = await supabase.rpc('store_calendar_tokens', {
      p_user_id: 'skip', // won't match
    }).catch(() => ({ data: null }));

    // Direct token decryption query
    const { data: rawTokens, error: tokenError } = await supabase
      .from('calendar_connections')
      .select('access_token_encrypted, refresh_token_encrypted, expires_at, calendar_email')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (tokenError || !rawTokens) throw new Error('Could not retrieve calendar tokens');

    // Decrypt using pgp_sym_decrypt
    const { data: decrypted, error: decryptError } = await supabase.rpc('get_calendar_tokens', {
      p_user_id: user.id,
      p_provider: provider,
      p_encryption_key: encryptionKey,
    }).catch(async () => {
      // Fallback: direct SQL
      const { data, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();
      
      // Try raw decryption
      const { data: raw } = await supabase.rpc('pgp_sym_decrypt', {}).catch(() => ({ data: null }));
      return { data: null, error: null };
    });

    // Use the same approach as other edge functions - raw SQL decryption
    const { data: tokens, error: sqlError } = await supabase
      .from('calendar_connections')
      .select('id, provider, calendar_email, expires_at')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    // Decrypt tokens via SQL
    const { data: decTokens } = await supabase
      .rpc('sql', { query: `SELECT pgp_sym_decrypt(access_token_encrypted, '${encryptionKey}') as access_token, pgp_sym_decrypt(refresh_token_encrypted, '${encryptionKey}') as refresh_token FROM calendar_connections WHERE user_id = '${user.id}' AND provider = '${provider}'` })
      .catch(() => ({ data: null }));

    // Simpler approach: use the same pattern as update-calendar-event
    // Read raw encrypted columns and decrypt them
    const { data: connRaw } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (!connRaw) throw new Error('No connection found');

    let accessToken = decodeToken(connRaw.access_token_encrypted);
    const refreshToken = decodeToken(connRaw.refresh_token_encrypted);

    // Check if token is expired and refresh
    const expiresAt = new Date(connRaw.expires_at);
    if (expiresAt < new Date()) {
      console.log('Token expired, refreshing...');
      if (provider === 'google') {
        accessToken = await refreshGoogleToken(refreshToken, { ...connRaw, user_id: user.id }, supabase);
      } else {
        accessToken = await refreshOutlookToken(refreshToken, { ...connRaw, user_id: user.id }, supabase);
      }
    }

    let result;

    if (provider === 'google') {
      // Google Calendar: PATCH the event with attendee self response
      const targetCalendarId = calendarId || 'primary';
      
      // First get the event to find our attendee entry
      const getResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!getResponse.ok) {
        const errText = await getResponse.text();
        throw new Error(`Failed to get event: ${errText}`);
      }

      const event = await getResponse.json();
      
      // Update attendee response status or set self as attendee
      const userEmail = connRaw.calendar_email;
      const attendees = event.attendees || [];
      let found = false;
      for (const att of attendees) {
        if (att.email?.toLowerCase() === userEmail?.toLowerCase() || att.self) {
          att.responseStatus = rsvpResponse;
          found = true;
          break;
        }
      }
      if (!found) {
        attendees.push({ email: userEmail, responseStatus: rsvpResponse, self: true });
      }

      const patchResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}?sendUpdates=all`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ attendees }),
        }
      );

      if (!patchResponse.ok) {
        const errText = await patchResponse.text();
        throw new Error(`Failed to RSVP: ${errText}`);
      }

      result = await patchResponse.json();

    } else if (provider === 'outlook') {
      // Outlook: Use accept/tentativelyAccept/decline endpoints
      const actionMap: Record<string, string> = {
        accepted: 'accept',
        tentative: 'tentativelyAccept',
        declined: 'decline',
      };
      const action = actionMap[rsvpResponse];
      if (!action) throw new Error(`Invalid RSVP response: ${rsvpResponse}`);

      const rsvpUrl = `https://graph.microsoft.com/v1.0/me/events/${eventId}/${action}`;
      const rsvpResp = await fetch(rsvpUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sendResponse: true }),
      });

      if (!rsvpResp.ok) {
        const errText = await rsvpResp.text();
        throw new Error(`Failed to RSVP via Outlook: ${errText}`);
      }

      result = { success: true, action };
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('RSVP error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
