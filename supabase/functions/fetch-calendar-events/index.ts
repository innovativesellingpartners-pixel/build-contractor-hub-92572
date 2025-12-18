import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode token from various formats (hex-encoded, Buffer, or plain string)
function decodeToken(token: any): string {
  if (!token) return '';
  
  // If it's a string
  if (typeof token === 'string') {
    // Check if it's PostgreSQL hex-encoded bytea (starts with \x)
    if (token.startsWith('\\x')) {
      const hex = token.slice(2);
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      console.log('Decoded hex token, starts with:', str.substring(0, 10));
      return str;
    }
    return token;
  }
  
  // If it's a Buffer-like object
  if (token?.data) {
    const decoded = new TextDecoder().decode(new Uint8Array(token.data));
    // Check if the decoded result is also hex-encoded
    if (decoded.startsWith('\\x')) {
      return decodeToken(decoded);
    }
    return decoded;
  }
  
  return String(token);
}

serve(async (req) => {
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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role for DB access and token validation
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Get user from auth token using service client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching calendar events for user:', user.id);

    // Get calendar connections for this user - get most recent one
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (connError) {
      console.error('Error fetching connections:', connError);
      return new Response(JSON.stringify({ error: 'Failed to fetch connections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ events: [], message: 'No calendars connected' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allEvents: any[] = [];

    for (const connection of connections) {
      console.log('Processing connection:', connection.id, 'email:', connection.calendar_email);
      console.log('Token expires at:', connection.expires_at, 'Current time:', new Date().toISOString());
      console.log('Stored access token length:', connection.access_token_encrypted?.length);
      console.log('Stored refresh token length:', connection.refresh_token_encrypted?.length);
      
      // Decode the access token (handles hex-encoded, Buffer, or plain string)
      let accessToken = decodeToken(connection.access_token_encrypted);
      
      console.log('Decoded access token preview:', accessToken?.substring(0, 20) + '...');
      
      if (connection.provider === 'google') {
        // Try to refresh the token to ensure it's valid
        console.log('Attempting token refresh for fresh credentials...');
        const refreshedToken = await refreshGoogleToken(connection, supabase);
        
        if (refreshedToken) {
          accessToken = refreshedToken;
          console.log('Using refreshed token');
        } else {
          console.log('Refresh failed, trying stored token');
        }
        
        console.log('Fetching Google Calendar events with token length:', accessToken?.length);
        const events = await fetchGoogleCalendarEvents(accessToken);
        console.log('Fetched', events.length, 'events');
        allEvents.push(...events.map((e: any) => ({
          ...e,
          provider: 'google',
          calendar_email: connection.calendar_email
        })));
      }
    }

    // Sort by start time
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date || '';
      const bStart = b.start?.dateTime || b.start?.date || '';
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });

    return new Response(JSON.stringify({ events: allEvents }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in fetch-calendar-events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshGoogleToken(connection: any, supabase: any): Promise<string | null> {
  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

    console.log('Attempting to refresh token for:', connection.calendar_email);

    if (!connection.refresh_token_encrypted) {
      console.error('No refresh token available');
      return null;
    }

    // Decode the refresh token (handles hex-encoded, Buffer, or plain string)
    const refreshToken = decodeToken(connection.refresh_token_encrypted);

    console.log('Using refresh token preview:', refreshToken?.substring(0, 20) + '...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await response.json();
    console.log('Token refresh response status:', response.status);
    
    if (tokens.error) {
      console.error('Token refresh error:', tokens.error, tokens.error_description);
      return null;
    }

    console.log('Got new access token, length:', tokens.access_token?.length);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update the stored token
    const { error: updateError } = await supabase
      .from('calendar_connections')
      .update({
        access_token_encrypted: tokens.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Failed to update token in DB:', updateError);
    }

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function fetchGoogleCalendarEvents(accessToken: string): Promise<any[]> {
  try {
    // Fetch events from next 6 months (180 days)
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=50`;
      
    console.log('Calling Google Calendar API...');

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('Google Calendar API success, items count:', data.items?.length || 0);
    return data.items || [];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
}
