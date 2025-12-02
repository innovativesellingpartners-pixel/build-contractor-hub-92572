import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobId, jobName, description, startDate, endDate, address, city, state } = await req.json();

    if (!jobId || !jobName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's calendar connections
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id);

    if (connError) {
      console.error('Error fetching calendar connections:', connError);
      return new Response(JSON.stringify({ error: 'Failed to fetch calendar connections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!connections || connections.length === 0) {
      console.log('No calendar connections found for user');
      return new Response(JSON.stringify({ message: 'No calendar connected', created: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const connection of connections) {
      try {
        // Decrypt tokens
        const { data: decryptedAccess } = await supabase.rpc('decrypt_secret', { 
          encrypted_value: connection.access_token_encrypted 
        });
        const { data: decryptedRefresh } = await supabase.rpc('decrypt_secret', { 
          encrypted_value: connection.refresh_token_encrypted 
        });

        let accessToken = decryptedAccess;

        // Check if token is expired and refresh if needed
        if (new Date(connection.expires_at) < new Date()) {
          console.log('Token expired, refreshing...');
          accessToken = await refreshToken(connection.provider, decryptedRefresh, connection, supabase);
        }

        // Build location string
        const locationParts = [address, city, state].filter(Boolean);
        const location = locationParts.join(', ');

        // Use start_date or default to tomorrow
        const eventStart = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        const eventEnd = endDate ? new Date(endDate) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);

        if (connection.provider === 'google') {
          const event = await createGoogleCalendarEvent(accessToken, {
            summary: `Job: ${jobName}`,
            description: description || `Job created in CT1`,
            location,
            start: eventStart,
            end: eventEnd,
          });
          results.push({ provider: 'google', success: true, eventId: event.id });
        } else if (connection.provider === 'outlook') {
          const event = await createOutlookCalendarEvent(accessToken, {
            subject: `Job: ${jobName}`,
            body: description || `Job created in CT1`,
            location,
            start: eventStart,
            end: eventEnd,
          });
          results.push({ provider: 'outlook', success: true, eventId: event.id });
        }
      } catch (err: any) {
        console.error(`Error creating event for ${connection.provider}:`, err);
        results.push({ provider: connection.provider, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({ created: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in create-calendar-event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshToken(provider: string, refreshToken: string, connection: any, supabase: any): Promise<string> {
  if (provider === 'google') {
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
      // Update stored token
      const { data: encryptedToken } = await supabase.rpc('encrypt_secret', { 
        secret_value: data.access_token 
      });
      
      await supabase
        .from('calendar_connections')
        .update({
          access_token_encrypted: encryptedToken,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        })
        .eq('id', connection.id);
      
      return data.access_token;
    }
    throw new Error('Failed to refresh Google token');
  } else if (provider === 'outlook') {
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
      const { data: encryptedToken } = await supabase.rpc('encrypt_secret', { 
        secret_value: data.access_token 
      });
      
      await supabase
        .from('calendar_connections')
        .update({
          access_token_encrypted: encryptedToken,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        })
        .eq('id', connection.id);
      
      return data.access_token;
    }
    throw new Error('Failed to refresh Outlook token');
  }
  throw new Error('Unknown provider');
}

async function createGoogleCalendarEvent(accessToken: string, event: {
  summary: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'America/Detroit',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'America/Detroit',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  return response.json();
}

async function createOutlookCalendarEvent(accessToken: string, event: {
  subject: string;
  body: string;
  location: string;
  start: Date;
  end: Date;
}) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: event.subject,
      body: {
        contentType: 'Text',
        content: event.body,
      },
      location: {
        displayName: event.location,
      },
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'America/Detroit',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'America/Detroit',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outlook Calendar API error: ${error}`);
  }

  return response.json();
}
