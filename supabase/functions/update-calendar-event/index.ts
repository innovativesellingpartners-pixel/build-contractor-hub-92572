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

async function refreshGoogleToken(refreshToken: string, connection: any, supabase: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  console.log('Refreshing Google token...');
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
  console.log('Token refresh response status:', response.status);
  
  if (data.access_token) {
    // Encode the new access token as hex for storage
    const encoder = new TextEncoder();
    const tokenBytes = encoder.encode(data.access_token);
    const hexToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    await supabase
      .from('calendar_connections')
      .update({
        access_token_encrypted: hexToken,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('id', connection.id);
    
    return data.access_token;
  }
  console.error('Token refresh failed:', data);
  throw new Error('Failed to refresh Google token: ' + JSON.stringify(data));
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
    }),
  });

  const data = await response.json();
  
  if (data.access_token) {
    const encoder = new TextEncoder();
    const tokenBytes = encoder.encode(data.access_token);
    const hexToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    await supabase
      .from('calendar_connections')
      .update({
        access_token_encrypted: hexToken,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('id', connection.id);
    
    return data.access_token;
  }
  throw new Error('Failed to refresh Outlook token');
}

async function updateGoogleCalendarEvent(
  accessToken: string, 
  eventId: string, 
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
    attendees?: string[];
  }
): Promise<any> {
  const eventBody: any = {};
  
  if (updates.summary !== undefined) eventBody.summary = updates.summary;
  if (updates.description !== undefined) eventBody.description = updates.description;
  if (updates.location !== undefined) eventBody.location = updates.location;
  
  if (updates.start) {
    eventBody.start = {
      dateTime: updates.start.toISOString(),
      timeZone: 'America/Detroit',
    };
  }
  
  if (updates.end) {
    eventBody.end = {
      dateTime: updates.end.toISOString(),
      timeZone: 'America/Detroit',
    };
  }

  // Add attendees if provided
  if (updates.attendees && updates.attendees.length > 0) {
    eventBody.attendees = updates.attendees.map(email => ({ email }));
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventBody),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google Calendar event: ${error}`);
  }
  
  return response.json();
}

async function updateOutlookCalendarEvent(
  accessToken: string, 
  eventId: string, 
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
    attendees?: string[];
  }
): Promise<any> {
  const eventBody: any = {};
  
  if (updates.summary !== undefined) eventBody.subject = updates.summary;
  if (updates.description !== undefined) {
    eventBody.body = {
      contentType: 'Text',
      content: updates.description,
    };
  }
  if (updates.location !== undefined) {
    eventBody.location = {
      displayName: updates.location,
    };
  }
  
  if (updates.start) {
    eventBody.start = {
      dateTime: updates.start.toISOString(),
      timeZone: 'America/Detroit',
    };
  }
  
  if (updates.end) {
    eventBody.end = {
      dateTime: updates.end.toISOString(),
      timeZone: 'America/Detroit',
    };
  }

  // Add attendees if provided
  if (updates.attendees && updates.attendees.length > 0) {
    eventBody.attendees = updates.attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required'
    }));
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'outlook.timezone="America/Detroit"'
      },
      body: JSON.stringify(eventBody),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Outlook Calendar event: ${error}`);
  }
  
  return response.json();
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

    const { 
      eventId, 
      provider, 
      calendarEmail,
      summary,
      description,
      location,
      startDate,
      endDate,
      attendees,
    } = await req.json();
    
    if (!eventId || !provider) {
      return new Response(JSON.stringify({ error: 'Missing eventId or provider' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Updating ${provider} event ${eventId} for user ${user.id}`);

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

    const refreshTokenDecoded = decodeToken(connection.refresh_token_encrypted);
    const accessTokenDecoded = decodeToken(connection.access_token_encrypted);
    
    // Build updates object
    const updates: {
      summary?: string;
      description?: string;
      location?: string;
      start?: Date;
      end?: Date;
      attendees?: string[];
    } = {};
    
    if (summary !== undefined) updates.summary = summary;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (startDate) updates.start = new Date(startDate);
    if (endDate) updates.end = new Date(endDate);
    if (attendees && Array.isArray(attendees)) updates.attendees = attendees;

    let result;
    
    if (provider === 'google') {
      // Always refresh token for fresh credentials
      let accessToken = accessTokenDecoded;
      try {
        accessToken = await refreshGoogleToken(refreshTokenDecoded, connection, supabase);
        console.log('Got fresh access token for update');
      } catch (refreshErr: any) {
        console.warn('Token refresh failed, using existing token:', refreshErr.message);
      }
      
      result = await updateGoogleCalendarEvent(accessToken, eventId, updates);
    } else if (provider === 'outlook') {
      let accessToken = accessTokenDecoded;
      try {
        accessToken = await refreshOutlookToken(refreshTokenDecoded, connection, supabase);
      } catch (refreshErr: any) {
        console.warn('Token refresh failed, using existing token:', refreshErr.message);
      }
      
      result = await updateOutlookCalendarEvent(accessToken, eventId, updates);
    } else {
      return new Response(JSON.stringify({ error: 'Unknown provider' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully updated event ${eventId}`);

    return new Response(JSON.stringify({ success: true, event: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
