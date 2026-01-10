import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to decode tokens that may be hex-encoded or bytea format
function decodeToken(token: any): string {
  if (!token) return '';
  
  // If it's already a string
  if (typeof token === 'string') {
    // Handle PostgreSQL bytea format: \x followed by hex
    if (token.startsWith('\\x')) {
      try {
        const hexPart = token.slice(2); // Remove \x prefix
        const decoded = new TextDecoder().decode(
          new Uint8Array(hexPart.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
        );
        console.log('Decoded bytea token, starts with:', decoded.substring(0, 10));
        return decoded;
      } catch (e) {
        console.log('Failed to decode bytea, using as-is');
        return token;
      }
    }
    
    // Check if it looks like a hex string (even length, only hex chars)
    if (/^[0-9a-fA-F]+$/.test(token) && token.length % 2 === 0 && token.length > 100) {
      try {
        const decoded = new TextDecoder().decode(
          new Uint8Array(token.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
        );
        console.log('Decoded hex token, starts with:', decoded.substring(0, 10));
        return decoded;
      } catch (e) {
        console.log('Failed to decode as hex, using as-is');
        return token;
      }
    }
    return token;
  }
  
  // Handle Buffer-like objects
  if (token && typeof token === 'object') {
    if (token.type === 'Buffer' && Array.isArray(token.data)) {
      return new TextDecoder().decode(new Uint8Array(token.data));
    }
    if (Array.isArray(token)) {
      return new TextDecoder().decode(new Uint8Array(token));
    }
  }
  
  return String(token);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for auth header - allow service-role calls from voice AI
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Check if it's the service role key (internal call from voice AI)
      if (token === supabaseServiceKey) {
        console.log("Service role call - will use contractorId from body");
        userId = null;
      } else {
        // Regular user auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        userId = user.id;
      }
    } else {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobId, jobName, description, startDate, endDate, location, address, city, state, contractorId } = await req.json();
    
    // Use contractorId from request (for service calls) or userId from auth
    const effectiveUserId = contractorId || userId;
    
    console.log('Creating calendar event for job:', jobName, 'user:', effectiveUserId);

    // Only require jobName (event title) - jobId is optional
    if (!jobName) {
      return new Response(JSON.stringify({ error: 'Missing event title' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!effectiveUserId) {
      return new Response(JSON.stringify({ error: 'No user context available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's calendar connections
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', effectiveUserId);

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

    console.log('Found', connections.length, 'calendar connections');
    const results = [];

    for (const connection of connections) {
      try {
        console.log('Processing connection:', connection.provider, connection.calendar_email);
        
        // Decode hex-encoded tokens - same logic as fetch-calendar-events
        const storedRefreshToken = connection.refresh_token_encrypted;
        const storedAccessToken = connection.access_token_encrypted;
        
        console.log('Stored refresh token length:', storedRefreshToken?.length);
        console.log('Stored access token length:', storedAccessToken?.length);
        
        const refreshTokenDecoded = decodeToken(storedRefreshToken);
        const accessTokenDecoded = decodeToken(storedAccessToken);
        
        console.log('Decoded access token preview:', accessTokenDecoded.substring(0, 20) + '...');
        console.log('Token expires at:', connection.expires_at, 'Current time:', new Date().toISOString());

        let accessToken = accessTokenDecoded;

        // Always refresh token to ensure it's valid
        console.log('Attempting token refresh for fresh credentials...');
        console.log('Using refresh token preview:', refreshTokenDecoded.substring(0, 20) + '...');
        
        try {
          accessToken = await refreshToken(connection.provider, refreshTokenDecoded, connection, supabase);
          console.log('Got fresh access token, length:', accessToken.length);
          console.log('Using refreshed token');
        } catch (refreshErr: any) {
          console.error('Token refresh failed:', refreshErr.message);
          // Try with existing decoded token if refresh fails
          console.log('Falling back to stored decoded token');
          accessToken = accessTokenDecoded;
        }

        // Build location string - prefer location param, fallback to address parts
        const eventLocation = location || [address, city, state].filter(Boolean).join(', ');

        // Use start_date or default to tomorrow
        const eventStart = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        const eventEnd = endDate ? new Date(endDate) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);

        console.log('Creating event:', jobName, 'at', eventLocation, 'from', eventStart, 'to', eventEnd);

        if (connection.provider === 'google') {
          const event = await createGoogleCalendarEvent(accessToken, {
            summary: `${jobName}`,
            description: description || `Scheduled from CT1`,
            location: eventLocation,
            start: eventStart,
            end: eventEnd,
          });
          console.log('Google Calendar event created:', event.id);
          results.push({ provider: 'google', success: true, eventId: event.id });
        } else if (connection.provider === 'outlook') {
          const event = await createOutlookCalendarEvent(accessToken, {
            subject: `${jobName}`,
            body: description || `Scheduled from CT1`,
            location: eventLocation,
            start: eventStart,
            end: eventEnd,
          });
          console.log('Outlook Calendar event created:', event.id);
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
