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
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching emails for user:', user.id);

    // Get email connections for this user
    const { data: connections, error: connError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id);

    if (connError) {
      console.error('Error fetching connections:', connError);
      return new Response(JSON.stringify({ error: 'Failed to fetch connections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ emails: [], message: 'No email accounts connected' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allEmails: any[] = [];

    for (const connection of connections) {
      console.log('Processing email connection:', connection.id, 'email:', connection.email_address);
      
      // Decode the access token (handles hex-encoded, Buffer, or plain string)
      let accessToken = decodeToken(connection.access_token_encrypted);
      console.log('Decoded access token preview:', accessToken?.substring(0, 20) + '...');
      
      // Always try to refresh the token first to ensure we have valid credentials
      console.log('Attempting token refresh for fresh credentials...');
      const refreshedToken = await refreshGoogleToken(connection, supabase);
      if (refreshedToken) {
        accessToken = refreshedToken;
        console.log('Using refreshed token');
      }

      if (connection.provider === 'google') {
        console.log('Fetching Gmail messages...');
        const emails = await fetchGmailMessages(accessToken);
        console.log('Fetched', emails.length, 'emails');
        allEmails.push(...emails.map((e: any) => ({
          ...e,
          provider: 'google',
          email_account: connection.email_address
        })));
      }
    }

    console.log('Total emails fetched:', allEmails.length);
    return new Response(JSON.stringify({ emails: allEmails }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in fetch-emails:', error);
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

    // Decode the refresh token
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

    console.log('Token refresh response status:', response.status);
    const tokens = await response.json();
    
    if (tokens.error) {
      console.error('Token refresh error:', tokens);
      return null;
    }

    console.log('Got new access token, length:', tokens.access_token?.length);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from('email_connections')
      .update({
        access_token_encrypted: tokens.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function fetchGmailMessages(accessToken: string): Promise<any[]> {
  try {
    console.log('Calling Gmail API with token length:', accessToken?.length);
    
    // Fetch recent emails from inbox
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?` +
      `maxResults=25&` +
      `labelIds=INBOX`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Gmail API error:', listResponse.status, errorText);
      return [];
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];
    console.log('Found', messageIds.length, 'message IDs');

    // Fetch details for each message (limit to 25 for performance)
    const emails: any[] = [];
    for (const msg of messageIds.slice(0, 25)) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (msgResponse.ok) {
        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];
        
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;
        
        emails.push({
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet,
          from: getHeader('From'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          labelIds: msgData.labelIds,
          isUnread: msgData.labelIds?.includes('UNREAD'),
        });
      }
    }

    return emails;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}
